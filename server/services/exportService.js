let sharp;
try {
  sharp = require('sharp');
} catch {
  console.warn('[exportService] sharp not available -- using Jimp fallback where possible');
}

const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { annotationsStore } = require('../config/store');

function buildAnnotationSvg(annotations, width, height) {
  const elements = [];

  for (const ann of annotations) {
    const d = ann.data || {};
    const color = d.color || '#FF0000';
    const sw = d.strokeWidth || 2;

    switch (ann.type) {
      case 'stickyNote': {
        const w = d.width || 150;
        const h = d.height || 100;
        const fill = d.color || '#FFEB3B';
        elements.push(`<rect x="${d.x}" y="${d.y}" width="${w}" height="${h}" fill="${fill}" opacity="0.9" rx="4" stroke="#666" stroke-width="1"/>`);
        if (d.text) {
          elements.push(`<text x="${d.x + 6}" y="${d.y + 18}" font-size="12" font-family="sans-serif" fill="#333">${escapeXml(d.text)}</text>`);
        }
        break;
      }
      case 'stamp': {
        const w = d.width || 120;
        const h = d.height || 40;
        const sc = d.color || '#F44336';
        elements.push(`<rect x="${d.x}" y="${d.y}" width="${w}" height="${h}" fill="none" stroke="${sc}" stroke-width="3" rx="4"/>`);
        elements.push(`<text x="${d.x + w / 2}" y="${d.y + h / 2 + 5}" text-anchor="middle" fill="${sc}" font-size="16" font-weight="bold" font-family="sans-serif">${escapeXml(d.stampType || 'STAMP')}</text>`);
        break;
      }
      case 'arrow':
      case 'line': {
        elements.push(`<line x1="${d.x}" y1="${d.y}" x2="${d.endX}" y2="${d.endY}" stroke="${color}" stroke-width="${sw}"/>`);
        if (ann.type === 'arrow' && d.endX != null && d.endY != null) {
          const angle = Math.atan2(d.endY - d.y, d.endX - d.x);
          const headLen = 12;
          const x1 = d.endX - headLen * Math.cos(angle - Math.PI / 6);
          const y1 = d.endY - headLen * Math.sin(angle - Math.PI / 6);
          const x2 = d.endX - headLen * Math.cos(angle + Math.PI / 6);
          const y2 = d.endY - headLen * Math.sin(angle + Math.PI / 6);
          elements.push(`<polygon points="${d.endX},${d.endY} ${x1},${y1} ${x2},${y2}" fill="${color}"/>`);
        }
        break;
      }
      case 'circle':
        elements.push(`<circle cx="${d.x}" cy="${d.y}" r="${d.radius || 50}" fill="none" stroke="${color}" stroke-width="${sw}"/>`);
        break;
      case 'highlighter': {
        const pts = d.points || [];
        if (pts.length >= 4) {
          let pathD = `M ${pts[0]} ${pts[1]}`;
          for (let i = 2; i < pts.length; i += 2) pathD += ` L ${pts[i]} ${pts[i + 1]}`;
          elements.push(`<path d="${pathD}" fill="none" stroke="${d.color || '#FFFF00'}" stroke-width="${d.strokeWidth || 20}" opacity="${d.opacity || 0.3}" stroke-linecap="round" stroke-linejoin="round"/>`);
        }
        break;
      }
      case 'freehand': {
        const pts = d.points || [];
        if (pts.length >= 4) {
          let pathD = `M ${pts[0]} ${pts[1]}`;
          for (let i = 2; i < pts.length; i += 2) pathD += ` L ${pts[i]} ${pts[i + 1]}`;
          elements.push(`<path d="${pathD}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`);
        }
        break;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${elements.join('')}</svg>`;
}

function escapeXml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function compositeAnnotations(baseBuffer, annotations, width, height) {
  if (!annotations || annotations.length === 0) return baseBuffer;
  if (!sharp) return baseBuffer;

  const svgString = buildAnnotationSvg(annotations, width, height);
  const svgBuffer = Buffer.from(svgString);

  const result = await sharp(baseBuffer)
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .toBuffer();
  return result;
}

async function exportToJpg(filePath, fileId, quality = 80) {
  if (sharp) {
    const annotations = annotationsStore.getAll((a) => a.fileId === fileId);
    const metadata = await sharp(filePath).metadata();
    const w = metadata.width || 800;
    const h = metadata.height || 600;

    let buffer = await sharp(filePath).png().toBuffer();
    buffer = await compositeAnnotations(buffer, annotations, w, h);
    buffer = await sharp(buffer).jpeg({ quality }).toBuffer();

    return { buffer, mimeType: 'image/jpeg', extension: 'jpg' };
  }

  const image = await Jimp.read(filePath);
  image.quality(quality);
  const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);
  return { buffer, mimeType: 'image/jpeg', extension: 'jpg' };
}

async function exportToTiff(filePath, fileId, quality = 80) {
  if (!sharp) throw new Error('TIFF export requires sharp which is not installed');
  const annotations = annotationsStore.getAll((a) => a.fileId === fileId);
  const metadata = await sharp(filePath).metadata();
  const w = metadata.width || 800;
  const h = metadata.height || 600;

  let buffer = await sharp(filePath).png().toBuffer();
  buffer = await compositeAnnotations(buffer, annotations, w, h);
  buffer = await sharp(buffer).tiff({ quality }).toBuffer();

  return { buffer, mimeType: 'image/tiff', extension: 'tiff' };
}

async function exportToPdf(filePath, fileType, fileId) {
  if (fileType === 'pdf') {
    const existingPdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const annotations = annotationsStore.getAll((a) => a.fileId === fileId);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    for (const ann of annotations) {
      const pageIdx = (ann.page || 1) - 1;
      if (pageIdx < 0 || pageIdx >= pages.length) continue;
      const page = pages[pageIdx];
      const { height: pageH } = page.getSize();
      const d = ann.data || {};

      drawAnnotationOnPdfPage(page, ann, d, pageH, font);
    }

    const pdfBytes = await pdfDoc.save();
    return { buffer: Buffer.from(pdfBytes), mimeType: 'application/pdf', extension: 'pdf' };
  }

  const pdfDoc = await PDFDocument.create();
  const imageBytes = fs.readFileSync(filePath);

  let image;
  if (fileType === 'jpg') {
    image = await pdfDoc.embedJpg(imageBytes);
  } else if (sharp) {
    const pngBuffer = await sharp(filePath).png().toBuffer();
    image = await pdfDoc.embedPng(pngBuffer);
  } else {
    const jimpImage = await Jimp.read(filePath);
    const pngBuffer = await jimpImage.getBufferAsync(Jimp.MIME_PNG);
    image = await pdfDoc.embedPng(pngBuffer);
  }

  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

  const annotations = annotationsStore.getAll((a) => a.fileId === fileId);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  for (const ann of annotations) {
    if ((ann.page || 1) !== 1) continue;
    drawAnnotationOnPdfPage(page, ann, ann.data || {}, image.height, font);
  }

  const pdfBytes = await pdfDoc.save();
  return { buffer: Buffer.from(pdfBytes), mimeType: 'application/pdf', extension: 'pdf' };
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return rgb(1, 0, 0);
  return rgb(parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255);
}

function drawAnnotationOnPdfPage(page, ann, d, pageH, font) {
  const color = hexToRgb(d.color || '#FF0000');
  const sw = d.strokeWidth || 2;

  // pdf-lib uses bottom-left origin; SVG uses top-left
  const flipY = (y) => pageH - y;

  switch (ann.type) {
    case 'stickyNote': {
      const w = d.width || 150;
      const h = d.height || 100;
      const fill = hexToRgb(d.color || '#FFEB3B');
      page.drawRectangle({ x: d.x, y: flipY(d.y + h), width: w, height: h, color: fill, opacity: 0.9 });
      if (d.text) {
        page.drawText(d.text.substring(0, 80), { x: d.x + 6, y: flipY(d.y + 18), size: 10, font, color: rgb(0.2, 0.2, 0.2) });
      }
      break;
    }
    case 'stamp': {
      const w = d.width || 120;
      const h = d.height || 40;
      const sc = hexToRgb(d.color || '#F44336');
      page.drawRectangle({ x: d.x, y: flipY(d.y + h), width: w, height: h, borderColor: sc, borderWidth: 3, color: rgb(1, 1, 1), opacity: 0 });
      const text = d.stampType || 'STAMP';
      page.drawText(text, { x: d.x + 8, y: flipY(d.y + h / 2 + 5), size: 14, font, color: sc });
      break;
    }
    case 'arrow':
    case 'line':
      if (d.endX != null && d.endY != null) {
        page.drawLine({ start: { x: d.x, y: flipY(d.y) }, end: { x: d.endX, y: flipY(d.endY) }, thickness: sw, color });
      }
      break;
    case 'circle':
      if (d.radius) {
        page.drawEllipse({ x: d.x, y: flipY(d.y), xScale: d.radius, yScale: d.radius, borderColor: color, borderWidth: sw, color: rgb(1, 1, 1), opacity: 0 });
      }
      break;
  }
}

module.exports = { exportToJpg, exportToTiff, exportToPdf };
