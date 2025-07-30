// utils/ocr.js
import { createWorker } from 'tesseract.js';
import pkg from 'pdf2pic';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { create } = pkg;

async function extractTextFromPDFWithOCR(buffer) {
  try {
    // Create a temporary directory for PDF and image files
    const tempDir = path.join(__dirname, '../temp');
    await fs.mkdir(tempDir, { recursive: true });
    const tempFilePath = path.join(tempDir, `temp_${Date.now()}.pdf`);

    // Write the PDF buffer to a temporary file
    await fs.writeFile(tempFilePath, buffer);

    // Convert PDF to images using pdf2pic
    const output = create({
      density: 100,
      format: 'png',
      width: 1000,
      height: 1000,
    });
    output.bulk(-1, { input: tempFilePath, outputdir: tempDir });

    // Wait for conversion to complete
    const images = await output.bulk(-1);
    if (!images || images.length === 0) {
      console.warn('No images generated from PDF');
      await fs.unlink(tempFilePath).catch(err => console.error(`Error deleting temp PDF ${tempFilePath}:`, err));
      return '';
    }

    // Initialize Tesseract worker with proper configuration
    const worker = await createWorker({
      langPath: path.join(__dirname, '../lang-data'), // Ensure Tesseract language data is available
      cachePath: tempDir, // Store cache in temp directory
      logger: (m) => console.log('Tesseract:', m), // Log Tesseract progress
    });

    // Load English language for OCR
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    let text = '';
    // Process each image with OCR
    for (const image of images) {
      const imagePath = path.join(tempDir, image.name);
      try {
        await fs.access(imagePath); // Check if image exists
        const { data: { text: pageText } } = await worker.recognize(imagePath);
        text += pageText + '\n';
        await fs.unlink(imagePath).catch(err => console.error(`Error deleting image ${imagePath}:`, err));
      } catch (err) {
        console.error(`Error processing image ${imagePath}:`, err.message);
      }
    }

    // Terminate Tesseract worker
    await worker.terminate();

    // Clean up temporary PDF file
    await fs.unlink(tempFilePath).catch(err => console.error(`Error deleting temp PDF ${tempFilePath}:`, err));

    // Clean up extracted text
    text = text.replace(/(\n\s*\n)+/g, '\n').replace(/[^\x20-\x7E\n]/g, '').trim();
    console.log(`OCR extracted text length: ${text.length}`);
    return text.length >= 10 ? text : '';
  } catch (err) {
    console.error('OCR extraction error:', err.message);
    return '';
  }
}

export default extractTextFromPDFWithOCR;