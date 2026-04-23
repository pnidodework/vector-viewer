let sharp;
try {
  sharp = require('sharp');
} catch {
  console.warn('[thumbnailService] sharp not available -- using Jimp fallback');
}

const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const THUMB_WIDTH = 200;

async function generateImageThumbnail(filePath) {
  if (sharp) {
    const buffer = await sharp(filePath)
      .resize(THUMB_WIDTH)
      .jpeg({ quality: 70 })
      .toBuffer();
    return buffer;
  }

  const image = await Jimp.read(filePath);
  image.resize(THUMB_WIDTH, Jimp.AUTO).quality(70);
  return image.getBufferAsync(Jimp.MIME_JPEG);
}

async function generateTiffThumbnail(filePath, pageIndex = 0) {
  if (sharp) {
    try {
      const buffer = await sharp(filePath, { page: pageIndex })
        .resize(THUMB_WIDTH)
        .jpeg({ quality: 70 })
        .toBuffer();
      return buffer;
    } catch {
      return generateImageThumbnail(filePath);
    }
  }

  try {
    const image = await Jimp.read(filePath);
    image.resize(THUMB_WIDTH, Jimp.AUTO).quality(70);
    return image.getBufferAsync(Jimp.MIME_JPEG);
  } catch {
    return null;
  }
}

async function getTiffPageCount(filePath) {
  if (!sharp) return 1;
  try {
    const metadata = await sharp(filePath).metadata();
    return metadata.pages || 1;
  } catch {
    return 1;
  }
}

async function getPdfPageCount(filePath) {
  try {
    const { PDFDocument } = require('pdf-lib');
    const fileBuffer = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBuffer);
    return pdfDoc.getPageCount();
  } catch {
    return 1;
  }
}

module.exports = {
  generateImageThumbnail,
  generateTiffThumbnail,
  getTiffPageCount,
  getPdfPageCount,
};
