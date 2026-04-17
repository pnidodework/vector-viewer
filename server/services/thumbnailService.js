const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const THUMB_WIDTH = 200;

async function generateImageThumbnail(filePath) {
  const buffer = await sharp(filePath)
    .resize(THUMB_WIDTH)
    .jpeg({ quality: 70 })
    .toBuffer();
  return buffer;
}

async function generateTiffThumbnail(filePath, pageIndex = 0) {
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

async function getTiffPageCount(filePath) {
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
