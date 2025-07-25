import fs from 'fs/promises';
import { fromPath } from 'pdf2pic';
import Tesseract from 'tesseract.js';

const extractTextFromPDFWithOCR = async (pdfPath) => {
  const outputImagesDir = './temp_images';

  if (!await fs.exists(outputImagesDir)) {
    await fs.mkdir(outputImagesDir);
  }

  const options = {
    density: 150,
    format: 'png',
    saveFilename: 'page',
    savePath: outputImagesDir,
    size: '800x1000',
  };

  const convert = fromPath(pdfPath, options);

  let fullText = '';

  try {
    const totalPages = 5; // or a dynamic page count later
    for (let i = 1; i <= totalPages; i++) {
      const imageResult = await convert(i);
      const ocr = await Tesseract.recognize(imageResult.path, 'ara+eng', {
        logger: (m) => console.log(m),
      });
      fullText += ocr.data.text + '\n';
      await fs.unlink(imageResult.path);
    }

    return fullText.trim();
  } catch (error) {
    console.error('OCR failed:', error.message);
    return null;
  }
};

export default extractTextFromPDFWithOCR;