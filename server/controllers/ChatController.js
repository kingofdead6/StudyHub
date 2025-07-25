import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import extractTextFromPDF from '../utils/extractTextFromPDF.js';
import extractTextFromPDFWithOCR from '../utils/ocr.js';
import { askGroq, askGroqStream } from '../utils/groq.js';
import cloudinary from '../utils/cloudinary.js';
import { authMiddleware, adminMiddleware } from '../utils/authMiddleware.js';
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to bold titles and math-related content
function boldTitlesAndMath(text) {
  text = text.replace(/^(#{1,6}\s+)(.*?)$/gm, (match, prefix, title) => {
    return `${prefix}**${title.trim()}**`;
  });

  text = text.replace(
    /\b(\d+\/\d+|\d+\.\d+|[-\d]+|[xXyYzZ]\b|\$[^\$]+\$)/g,
    (match) => {
      if (match.startsWith('$') && match.endsWith('$')) {
        return match.replace(
          /(\d+\/\d+|\d+\.\d+|[-\d]+|[xXyYzZ])/g,
          '**$1**'
        );
      }
      return `**${match}**`;
    }
  );

  text = text.replace(/\b([xXyYzZ])([\^][0-9]+)/g, '**$1**$2');

  return text;
}

// Controller for /upload-pdf (JSON response)
export const handlePdfUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const filePath = path.join(__dirname, '..', req.file.path);
    let text = await extractTextFromPDF(filePath);

    if (!text || text.length < 20) {
      console.warn('⚠️ PDF parsing returned too little, using OCR...');
      text = await extractTextFromPDFWithOCR(filePath);
    }

    if (!text || text.trim().length < 10) {
      await fs.unlink(filePath).catch((err) => console.error(`Error deleting file ${filePath}:`, err));
      return res.status(400).json({ error: 'PDF is empty or unreadable' });
    }

    const explanation = await askGroq(text);
    await fs.unlink(filePath).catch((err) => console.error(`Error deleting file ${filePath}:`, err));

    res.json({ explanation });
  } catch (err) {
    console.error('Error in /upload-pdf route:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Controller for /upload-pdf (SSE response)
export const handlePdfUploadStream = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    if (!req.file) {
      res.write('event: error\ndata: No file uploaded\n\n');
      res.end();
      return;
    }
    const filePath = path.join(__dirname, '..', req.file.path);
    let text = await extractTextFromPDF(filePath);

    if (!text || text.length < 20) {
      console.warn('⚠️ PDF parsing returned too little, using OCR...');
      text = await extractTextFromPDFWithOCR(filePath);
    }

    await fs.unlink(filePath).catch((err) => console.error(`Error deleting file ${filePath}:`, err));

    if (!text || text.trim().length < 10) {
      res.write('event: error\ndata: Failed to extract text from PDF\n\n');
      res.end();
      return;
    }

    await askGroqStream(text, res);
  } catch (err) {
    console.error('PDF processing error:', err.message, err.stack);
    res.write(`event: error\ndata: Failed to process PDF: ${err.message}\n\n`);
    res.end();
  }
};

// Controller for /chat (SSE response)
export const chat = async (req, res) => {
  try {
    const { message, year, semester, module, type } = req.query;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Fetch PDFs from database based on sidebar selections
    let context = '';
    if (year && semester && module && type) {
      const uploads = await prisma.upload.findMany({
        where: {
          year: parseInt(year),
          semester: parseInt(semester),
          module,
          type,
        },
      });

      for (const upload of uploads) {
        try {
          const response = await fetch(upload.link);
          const buffer = await response.buffer();
          const tempFilePath = path.join(__dirname, '..', 'uploads', `temp-${Date.now()}.pdf`);
          await fs.writeFile(tempFilePath, buffer);
          let pdfText = await extractTextFromPDF(tempFilePath);
          if (!pdfText || pdfText.length < 20) {
            pdfText = await extractTextFromPDFWithOCR(tempFilePath);
          }
          context += `\n\nPDF Content (${upload.module} - ${upload.type}):\n${pdfText}`;
          await fs.unlink(tempFilePath).catch((err) => console.error(`Error deleting temp file: ${err}`));
        } catch (err) {
          console.error(`Error fetching PDF from ${upload.link}:`, err);
        }
      }
    }

    const prompt = context
      ? `Based on the following PDF content:\n${context}\n\nUser query: ${message}`
      : message;

    await askGroqStream(prompt, res);
  } catch (err) {
    console.error('Error in /chat route:', err);
    res.write('data: ⚠️ Error receiving stream\n\n');
    res.write('event: done\n\n');
    res.end();
  } finally {
    await prisma.$disconnect();
  }
};

// Controller for /chat (JSON response, POST)
export const chatWithGroq = async (req, res) => {
  const { message, year, semester, module, type } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Fetch PDFs from database based on sidebar selections
    let context = '';
    if (year && semester && module && type) {
      const uploads = await prisma.upload.findMany({
        where: {
          year: parseInt(year),
          semester: parseInt(semester),
          module,
          type,
        },
      });

      for (const upload of uploads) {
        try {
          const response = await fetch(upload.link);
          const buffer = await response.buffer();
          const tempFilePath = path.join(__dirname, '..', 'Uploads', `temp-${Date.now()}.pdf`);
          await fs.writeFile(tempFilePath, buffer);
          let pdfText = await extractTextFromPDF(tempFilePath);
          if (!pdfText || pdfText.length < 20) {
            pdfText = await extractTextFromPDFWithOCR(tempFilePath);
          }
          context += `\n\nPDF Content (${upload.module} - ${upload.type}):\n${pdfText}`;
          await fs.unlink(tempFilePath).catch((err) => console.error(`Error deleting temp file: ${err}`));
        } catch (err) {
          console.error(`Error fetching PDF from ${upload.link}:`, err);
        }
      }
    }

    const prompt = context
      ? `Based on the following PDF content:\n${context}\n\nUser query: ${message}`
      : message;

    const reply = await askGroq(prompt);
    res.json({ reply });
  } catch (err) {
    console.error('Groq Error:', err);
    res.status(500).json({ error: 'Groq failed' });
  } finally {
    await prisma.$disconnect();
  }
};

// Controller for /uploads (POST) - Admin only, Cloudinary upload
export const createUpload = async (req, res) => {
  try {
    // Apply auth and admin middleware
    await authMiddleware(req, res, async () => {
      await adminMiddleware(req, res, async () => {
        const { year, universityYear, semester, module, type, speciality, solution } = req.body;
        const file = req.file;

        if (!file || !year || !universityYear || !semester || !module || !type) {
          return res.status(400).json({ message: 'All required fields (file, year, universityYear, semester, module, type) must be provided' });
        }

        if (!['Course', 'TD', 'EMD'].includes(type)) {
          return res.status(400).json({ message: 'Invalid type. Must be one of: Course, TD, EMD' });
        }

        if (![1, 2].includes(Number(semester))) {
          return res.status(400).json({ message: 'Semester must be 1 or 2' });
        }

        if (![1, 2, 3, 4, 5].includes(Number(year))) {
          return res.status(400).json({ message: 'Year must be between 1 and 5' });
        }

        const currentYear = new Date().getFullYear();
        if (!Number.isInteger(Number(universityYear)) || universityYear < 2000 || universityYear > currentYear + 5) {
          return res.status(400).json({ message: `University year must be between 2000 and ${currentYear + 5}` });
        }

        if (year === 4 && !['SID', 'SIL', 'SIQ', 'SIT'].includes(speciality)) {
          return res.status(400).json({ message: 'Speciality must be SID, SIL, SIQ, or SIT for 4th year' });
        }
        if (year !== 4 && speciality) {
          return res.status(400).json({ message: 'Speciality should only be provided for 4th year' });
        }

        if (solution && !solution.startsWith('https://drive.google.com/')) {
          return res.status(400).json({ message: 'Solution must be a valid Google Drive link' });
        }

        // Upload PDF to Cloudinary
        const filePath = path.join(__dirname, '..', file.path);
        const uploadResult = await cloudinary.uploader.upload(filePath, {
          folder: 'uploads',
          resource_type: 'raw',
          public_id: `pdf_${Date.now()}_${file.originalname}`,
        });

        // Delete local file after Cloudinary upload
        await fs.unlink(filePath).catch((err) => console.error(`Error deleting file ${filePath}:`, err));

        // Save Cloudinary URL to database
        const upload = await prisma.upload.create({
          data: {
            link: uploadResult.secure_url,
            year: Number(year),
            universityYear: Number(universityYear),
            semester: Number(semester),
            module,
            type,
            speciality: year === 4 ? speciality : null,
            solution: solution || null,
          },
        });

        res.status(201).json({ message: 'Upload created successfully', upload });
      });
    });
  } catch (err) {
    console.error('Error in createUpload:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    await prisma.$disconnect();
  }
};

// Controller for /uploads (GET)
export const getUploads = async (req, res) => {
  try {
    const { year, universityYear, semester, type, module } = req.query;

    const filters = {};
    if (year) filters.year = parseInt(year);
    if (universityYear) filters.universityYear = parseInt(universityYear);
    if (semester) filters.semester = parseInt(semester);
    if (type) filters.type = type;
    if (module) filters.module = module;

    const uploads = await prisma.upload.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
    });

    res.json(uploads);
  } catch (err) {
    console.error('Error in getUploads:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    await prisma.$disconnect();
  }
};

// Controller for /uploads/:id (DELETE)
export const deleteUpload = async (req, res) => {
  try {
    const uploadId = parseInt(req.params.id);
    if (isNaN(uploadId)) {
      return res.status(400).json({ message: 'Invalid or missing upload ID' });
    }

    // Fetch upload to get Cloudinary URL
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
    });

    if (!upload) {
      return res.status(404).json({ message: 'Upload not found' });
    }

    // Extract public_id from Cloudinary URL
    const publicIdMatch = upload.link.match(/\/Uploads\/(.+)\.pdf$/);
    if (publicIdMatch) {
      const publicId = `Uploads/${publicIdMatch[1]}`;
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    }

    // Delete from database
    await prisma.upload.delete({
      where: { id: uploadId },
    });

    res.json({ message: 'Upload deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Upload not found' });
    }
    console.error('Error in deleteUpload:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    await prisma.$disconnect();
  }
};

// Controller for /pdf (JSON response)
export const handlePdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const filePath = path.join(__dirname, '..', req.file.path);
    let text = await extractTextFromPDF(filePath);
    console.log('📄 Extracted with pdf2json:\n', text);

    if (!text || text.length < 20) {
      console.warn('⚠️ PDF parsing returned too little, using OCR...');
      text = await extractTextFromPDFWithOCR(filePath);
    }

    if (!text || text.trim().length < 10) {
      await fs.unlink(filePath).catch((err) => console.error(`Error deleting file ${filePath}:`, err));
      return res.status(400).json({ error: 'PDF is empty or unreadable' });
    }

    const explanation = await askGroq(text);
    await fs.unlink(filePath).catch((err) => console.error(`Error deleting file ${filePath}:`, err));

    res.json({ explanation });
  } catch (err) {
    console.error('Error in /pdf route:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};