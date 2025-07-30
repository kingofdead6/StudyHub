import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
const { default: extractTextFromPDF } = await import('../utils/extractTextFromPDF.cjs');
import extractTextFromPDFWithOCR from '../utils/ocr.js';
import { askGroq, askGroqStream } from '../utils/groq.js';
import cloudinary from '../utils/cloudinary.js';
import { authMiddleware, adminMiddleware } from '../utils/authMiddleware.js';
import fetch from 'node-fetch';
import { PassThrough } from 'stream';

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

// Controller for /upload-pdf (SSE response, saves to Cloudinary and database)
export const handlePdfUploadStream = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    await authMiddleware(req, res, async () => {
      const { year, universityYear, semester, module, type, speciality } = req.body;
      const file = req.file;


      if (file.mimetype !== 'application/pdf') {
        res.write('event: error\ndata: Only PDF files are allowed\n\n');
        res.end();
        return;
      }

      // Validate inputs
      if (!['Course', 'TD', 'EMD'].includes(type)) {
        res.write('event: error\ndata: Invalid type. Must be one of: Course, TD, EMD\n\n');
        res.end();
        return;
      }

      if (![1, 2].includes(Number(semester))) {
        res.write('event: error\ndata: Semester must be 1 or 2\n\n');
        res.end();
        return;
      }

      if (![1, 2, 3, 4, 5].includes(Number(year))) {
        res.write('event: error\ndata: Year must be between 1 and 5\n\n');
        res.end();
        return;
      }

      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(Number(universityYear)) || universityYear < 2000 || universityYear > currentYear + 5) {
        res.write(`event: error\ndata: University year must be between 2000 and ${currentYear + 5}\n\n`);
        res.end();
        return;
      }

      if (year === '4' && !['SID', 'SIL', 'SIQ', 'SIT'].includes(speciality)) {
        res.write('event: error\ndata: Speciality must be SID, SIL, SIQ, or SIT for 4th year\n\n');
        res.end();
        return;
      }
      if (year !== '4' && speciality) {
        res.write('event: error\ndata: Speciality should only be provided for 4th year\n\n');
        res.end();
        return;
      }

      // Sanitize filename for public_id
      const sanitizedFileName = file.originalname
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '');
      const publicId = `Uploads/pdf_${Date.now()}_${sanitizedFileName}`;

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'Uploads',
            resource_type: 'raw',
            public_id: publicId,
            access_mode: 'public',
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', {
                message: error.message,
                name: error.name,
                http_code: error.http_code,
              });
              return reject(new Error(`Cloudinary upload failed: ${error.message}`));
            }
            console.log('Cloudinary upload successful:', {
              public_id: result.public_id,
              secure_url: result.secure_url,
              bytes: result.bytes,
              access_mode: result.access_mode,
            });
            resolve(result);
          }
        );

        const bufferStream = new PassThrough();
        bufferStream.end(file.buffer);
        bufferStream.pipe(uploadStream);

        bufferStream.on('error', (error) => {
          console.error('Buffer stream error:', error.message);
          reject(error);
        });
      });

      // Extract text from PDF
      let text = await extractTextFromPDF(file.buffer);
      if (!text || text.length < 20) {
        console.warn('⚠️ PDF parsing returned too little, using OCR...');
        text = await extractTextFromPDFWithOCR(file.buffer);
      }

      if (!text || text.trim().length < 10) {
        res.write('event: error\ndata: PDF is empty or unreadable\n\n');
        res.end();
        return;
      }

      // Save to database
      const upload = await prisma.upload.create({
        data: {
          link: uploadResult.secure_url,
          year: Number(year),
          universityYear: Number(universityYear),
          semester: Number(semester),
          module,
          type,
          speciality: year === '4' ? speciality : null,
        },
      });

      // Generate recommended questions
      const questionsPrompt = `Based on the following PDF content for ${module} (${type}):\n${text}\n\nGenerate 3-5 relevant questions that a student might ask about this content. Return the questions as a JSON array.`;
      const questionsResponse = await askGroq(questionsPrompt);
      let questions = [];
      try {
        questions = JSON.parse(questionsResponse);
      } catch (err) {
        console.error('Error parsing questions response:', err);
        questions = [
          "What are the main topics covered in this document?",
          "Can you explain the key concepts in this PDF?",
          "What are some practice problems related to this content?",
        ];
      }

      // Stream Grok's explanation
      await askGroqStream(text, res);

      // Send upload and questions as final response
      res.write(`event: done\ndata: ${JSON.stringify({ upload, questions })}\n\n`);
      res.end();
    });
  } catch (err) {
    console.error('PDF processing error:', err.message, err.stack);
    res.write(`event: error\ndata: Failed to process PDF: ${err.message}\n\n`);
    res.end();
  }
};

// Controller for /recommended-questions (JSON response)
export const recommendedQuestions = async (req, res) => {
  try {
    const { year, semester, module, type, speciality } = req.body;
    if (!year || !semester || !module || !type) {
      console.error('Missing required fields:', { year, semester, module, type });
      return res.status(400).json({ error: 'Year, semester, module, and type are required' });
    }

    const filters = {
      year: parseInt(year),
      semester: parseInt(semester),
      module,
      type,
    };
    if (speciality) {
      filters.speciality = speciality;
    }

    console.log('Fetching uploads with filters:', filters);
    const uploads = await prisma.upload.findMany({
      where: filters,
    });
    console.log('Found uploads:', uploads.length);

    let context = '';
    for (const upload of uploads) {
      try {
        console.log(`Fetching PDF: ${upload.link}`);
        const response = await fetch(upload.link);
        if (!response.ok) {
          console.error(`Failed to fetch PDF from ${upload.link}: ${response.status}`);
          continue;
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        let pdfText = await extractTextFromPDF(buffer);
        if (!pdfText || pdfText.length < 20) {
          console.warn(`PDF parsing failed for ${upload.link}, using OCR...`);
          pdfText = await extractTextFromPDFWithOCR(buffer);
        }
        if (pdfText && pdfText.trim().length >= 10) {
          context += `\n\nPDF Content (${upload.module} - ${upload.type}):\n${pdfText}`;
        } else {
          console.warn(`PDF ${upload.link} is empty or unreadable`);
        }
      } catch (err) {
        console.error(`Error processing PDF ${upload.link}:`, err.message);
      }
    }

    if (!context) {
      console.log('No valid PDF content found for question generation');
      return res.status(200).json({ questions: [] });
    }

    const questionsPrompt = `Based on the following PDF content for ${module} (${type}):\n${context}\n\nGenerate 3-5 relevant questions that a student might ask about this content. Return the questions as a JSON array, e.g., ["Question 1", "Question 2", "Question 3"].`;
    console.log('Generating questions with prompt length:', questionsPrompt.length);
    const questionsResponse = await askGroq(questionsPrompt);
    let questions = [];
    try {
      questions = JSON.parse(questionsResponse);
      console.log('Generated questions:', questions);
    } catch (err) {
      console.error('Error parsing questions response:', err.message, questionsResponse);
      questions = [
        "What are the main topics covered in this document?",
        "Can you explain the key concepts in this PDF?",
        "What are some practice problems related to this content?",
      ];
    }

    res.json({ questions });
  } catch (err) {
    console.error('Error in recommendedQuestions:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: `Failed to generate recommended questions: ${err.message}` });
  } finally {
    await prisma.$disconnect();
  }
};

export const chat = async (req, res) => {
  try {
    const { message, year, semester, module, type, speciality } = req.query;
    if (!message) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write('data: Error: Message is required\n\n');
      res.write('event: done\n\n');
      res.end();
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let context = '';
    if (year && semester && module && type) {
      const filters = {
        year: parseInt(year),
        semester: parseInt(semester),
        module,
        type,
        ...(speciality && { speciality }),
      };

      console.log('Fetching uploads with filters:', filters);
      const uploads = await prisma.upload.findMany({
        where: filters,
        orderBy: { universityYear: 'desc' },
        take: 5,
      });
      console.log('Found uploads:', uploads.length);

      for (const upload of uploads) {
        try {
          console.log(`Fetching PDF: ${upload.link}`);
          const response = await fetch(upload.link);
          if (!response.ok) {
            console.error(`Failed to fetch PDF from ${upload.link}: ${response.status}`);
            continue;
          }
          const buffer = Buffer.from(await response.arrayBuffer());
          let pdfText = await extractTextFromPDF(buffer);
          console.log(`Extracted text length for ${upload.link}: ${pdfText.length}`);
          if (!pdfText || pdfText.length < 20) {
            console.warn(`PDF parsing failed for ${upload.link}, using OCR...`);
            pdfText = await extractTextFromPDFWithOCR(buffer);
            console.log(`OCR text length for ${upload.link}: ${pdfText.length}`);
          }
          if (pdfText && pdfText.trim().length >= 10) {
            context += `\n\nPDF Content (${upload.module} - ${upload.type}):\n${pdfText.slice(0, 5000)}`;
          } else {
            console.warn(`PDF ${upload.link} is empty or unreadable`);
          }
        } catch (err) {
          console.error(`Error fetching PDF from ${upload.link}:`, err.message);
        }
      }

      if (context) {
        const summaryPrompt = `Summarize the following content into a concise overview (max 500 words):\n${context}`;
        context = await askGroq(summaryPrompt);
      } else {
        console.log('No valid PDF content found for chat context');
      }
    }

    const prompt = context
      ? `You are an expert tutor in ${module || 'the relevant subject'}. Answer the user's question based on the provided PDF content. If the content is insufficient, use your general knowledge but note any assumptions. Format math in LaTeX (e.g., $x^2$) and code in markdown code blocks.\n\nPDF Content:\n${context}\n\nQuestion: ${message}`
      : `You are a knowledgeable assistant. Answer the user's question conversationally and accurately. Format math in LaTeX (e.g., $x^2$) and code in markdown code blocks if applicable.\n\nQuestion: ${message}`;

    console.log('Sending prompt to Groq, length:', prompt.length);
    await askGroqStream(prompt, res);
  } catch (err) {
    console.error('Error in /chat route:', err.message);
    res.write('data: ⚠️ Error receiving stream\n\n');
    res.write('event: done\n\n');
    res.end();
  } finally {
    await prisma.$disconnect();
  }
};

// Controller for /chat (JSON response, POST)
export const chatWithGroq = async (req, res) => {
  const { message, year, semester, module, type, speciality } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    let context = '';
    if (year && semester && module && type) {
      const filters = {
        year: parseInt(year),
        semester: parseInt(semester),
        module,
        type,
      };
      if (speciality) {
        filters.speciality = speciality;
      }

      const uploads = await prisma.upload.findMany({
        where: filters,
      });

      for (const upload of uploads) {
        try {
          const response = await fetch(upload.link);
          if (!response.ok) {
            console.error(`Failed to fetch PDF from ${upload.link}: ${response.status}`);
            continue;
          }
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          let pdfText = await extractTextFromPDF(buffer);
          if (!pdfText || pdfText.length < 20) {
            pdfText = await extractTextFromPDFWithOCR(buffer);
          }
          context += `\n\nPDF Content (${upload.module} - ${upload.type}):\n${pdfText}`;
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

        if (year === '4' && !['SID', 'SIL', 'SIQ', 'SIT'].includes(speciality)) {
          return res.status(400).json({ message: 'Speciality must be SID, SIL, SIQ, or SIT for 4th year' });
        }
        if (year !== '4' && speciality) {
          return res.status(400).json({ message: 'Speciality should only be provided for 4th year' });
        }

        if (solution && !solution.startsWith('https://drive.google.com/')) {
          return res.status(400).json({ message: 'Solution must be a valid Google Drive link' });
        }

        // Upload PDF to Cloudinary
        const filePath = path.join(__dirname, '..', file.path);
        const uploadResult = await cloudinary.uploader.upload(filePath, {
          folder: 'Uploads',
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
            speciality: year === '4' ? speciality : null,
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
    const { year, universityYear, semester, type, module, speciality } = req.query;

    const filters = {};
    if (year) filters.year = parseInt(year);
    if (universityYear) filters.universityYear = parseInt(universityYear);
    if (semester) filters.semester = parseInt(semester);
    if (type) filters.type = type;
    if (module) filters.module = module;
    if (speciality) filters.speciality = speciality;

    console.log('Fetching uploads with filters:', filters);
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

export const deleteUpload = async (req, res) => {
  try {
    await authMiddleware(req, res, async () => {
      await adminMiddleware(req, res, async () => {
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
      });
    });
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





export const uploadstandalonepdf = async (req, res) => {
  try {
    console.log('Starting uploadstandalonepdf function');
    const file = req.file;

    console.log('Received file:', file ? { originalname: file.originalname, size: file.size, mimetype: file.mimetype, path: file.path } : 'No file');

    // Validate file presence and type
    if (!file) {
      console.log('Validation failed: No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    if (file.mimetype !== 'application/pdf') {
      console.log('Validation failed: Invalid file type', file.mimetype);
      return res.status(400).json({ message: 'Only PDF files are allowed' });
    }

    // Sanitize filename for public_id
    const sanitizedFileName = file.originalname
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    const publicId = `Uploads/pdf_${Date.now()}_${sanitizedFileName}`;
    const filePath = path.join(__dirname, '..', file.path);

    console.log(`Starting Cloudinary upload for file: ${file.originalname}, public_id: ${publicId}`);

    // Upload PDF to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: 'Uploads',
      resource_type: 'raw',
      public_id: publicId,
      access_mode: 'public',
    });
    console.log('Cloudinary upload successful:', {
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      bytes: uploadResult.bytes,
      access_mode: uploadResult.access_mode,
    });

    // Extract text from PDF using the temporary file
    console.log('Processing PDF...');
    let pdfContent = await extractTextFromPDF(filePath);
    console.log('PDF content length:', pdfContent?.length || 0);

    // Generate recommended questions
    console.log('Generating recommended questions...');
    const questions = await generateRecommendedQuestions(pdfContent);

    // Clean up temporary file
    console.log('Cleaning up temporary file:', filePath);
    await fs.unlink(filePath).catch((err) => console.error(`Error deleting temporary file ${filePath}:`, err));

    // Save Cloudinary URL to database
    console.log('Saving upload to database:', { link: uploadResult.secure_url });
    const upload = await prisma.upload.create({
      data: {
        link: uploadResult.secure_url,
        filename: file.originalname,
      },
    });

    console.log('Database save successful:', {
      uploadId: upload.id,
      link: upload.link,
    });

    // Store in session (optional)
    if (req.session) {
      req.session.standalonePDF = {
        filePath,
        filename: file.originalname,
      };
      console.log('Session updated:', req.session.standalonePDF);
    } else {
      console.warn('Session middleware not initialized');
    }

    res.status(201).json({ message: 'Standalone PDF uploaded successfully', filename: file.originalname, questions, upload });
  } catch (err) {
    console.error('Error in uploadstandalonepdf:', {
      message: err.message,
      stack: err.stack,
    });
    let errorMessage = 'Failed to upload standalone PDF';
    if (err.message.includes('Customer is marked as untrusted')) {
      errorMessage = 'Failed to upload PDF: Customer is marked as untrusted. Please enable PDF delivery in Cloudinary settings under Security > PDF and ZIP files delivery.';
    } else {
      errorMessage = `Failed to upload standalone PDF: ${err.message}`;
    }
    // Clean up temporary file in case of error
    if (req.file?.path) {
      const filePath = path.join(__dirname, '..', req.file.path);
      await fs.unlink(filePath).catch((err) => console.error(`Error deleting temporary file ${filePath}:`, err));
    }
    res.status(500).json({ message: errorMessage, error: err.message });
  } finally {
    console.log('Disconnecting Prisma client');
    await prisma.$disconnect();
  }
};