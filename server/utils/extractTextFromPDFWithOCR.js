import fs from 'fs/promises';
import { fromPath } from 'pdf2pic';
import Tesseract from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';

const extractTextFromPDFWithOCR = async (pdfPath) => {
  const outputImagesDir = './temp_images';

  try {
    await fs.access(outputImagesDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(outputImagesDir, { recursive: true });
    } else {
      console.error('Failed to access temp_images directory:', error);
      throw error;
    }
  }

  const options = {
    density: 100, // Reduced for performance
    format: 'png',
    saveFilename: 'page',
    savePath: outputImagesDir,
    size: '600x800',
  };

  const convert = fromPath(pdfPath, options);
  let fullText = '';

  try {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();
    console.log(`Processing PDF with ${totalPages} pages`);

    for (let i = 1; i <= totalPages; i++) {
      console.log(`Converting page ${i} to image...`);
      const imageResult = await convert(i).catch((err) => {
        console.error(`Failed to convert page ${i} to image:`, err);
        throw err;
      });
      console.log(`Generated image: ${imageResult.path}`);

      try {
        const ocr = await Tesseract.recognize(
          imageResult.path,
          'ara+eng',
          {
            logger: (m) => console.log(`Tesseract progress for page ${i}:`, m),
            workerPath: require.resolve('tesseract.js/src/worker/node/index.js'),
            langPath: 'https://tessdata.projectnaptha.com/4.0.0',
            corePath: require.resolve('tesseract.js-core/tesseract-core.wasm.js'),
          }
        );
        fullText += ocr.data.text + '\n';
      } catch (ocrError) {
        console.error(`OCR failed for page ${i}:`, ocrError);
        throw ocrError;
      }

      await fs.unlink(imageResult.path).catch((err) =>
        console.error(`Error deleting image ${imageResult.path}:`, err)
      );
    }

    return fullText.trim();
  } catch (error) {
    console.error('OCR processing failed:', error);
    return null;
  } finally {
    await fs.rm(outputImagesDir, { recursive: true, force: true }).catch((err) =>
      console.error(`Error deleting temp_images directory:`, err)
    );
  }
};

export default extractTextFromPDFWithOCR;