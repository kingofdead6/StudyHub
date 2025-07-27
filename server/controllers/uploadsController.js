import { PassThrough } from 'stream';
import { PrismaClient } from '@prisma/client';
import cloudinary from '../utils/cloudinary.js';
import { authMiddleware, adminMiddleware } from '../utils/authMiddleware.js';
import axios from 'axios';

const prisma = new PrismaClient();

export const createUpload = async (req, res) => {
  try {
    await authMiddleware(req, res, async () => {
      await adminMiddleware(req, res, async () => {
        console.log('Starting createUpload function');
        // Safely destructure with defaults
        const {
          year = '',
          universityYear = '',
          semester = '',
          module = '',
          type = '',
          speciality = '',
          solution = '',
        } = req.body || {};
        const file = req.file;

        console.log('Received request body:', { year, universityYear, semester, module, type, speciality, solution });
        console.log('Received file:', file ? { originalname: file.originalname, size: file.size, mimetype: file.mimetype } : 'No file');

        // Validate required fields
        if (!file || !year || !universityYear || !semester || !module || !type) {
          console.log('Validation failed: Missing required fields');
          return res.status(400).json({ message: 'All required fields (file, year, universityYear, semester, module, type) must be provided' });
        }

        // Validate file type
        if (file.mimetype !== 'application/pdf') {
          console.log('Validation failed: Invalid file type', file.mimetype);
          return res.status(400).json({ message: 'Only PDF files are allowed' });
        }

        // Convert and validate types
        const yearNum = parseInt(year);
        const universityYearNum = parseInt(universityYear);
        const semesterNum = parseInt(semester);

        // Validate type
        if (!['Course', 'TD', 'EMD'].includes(type)) {
          console.log('Validation failed: Invalid type', type);
          return res.status(400).json({ message: 'Invalid type. Must be one of: Course, TD, EMD' });
        }

        // Validate semester
        if (![1, 2].includes(semesterNum)) {
          console.log('Validation failed: Invalid semester', semester);
          return res.status(400).json({ message: 'Semester must be 1 or 2' });
        }

        // Validate year
        if (![1, 2, 3, 4, 5].includes(yearNum)) {
          console.log('Validation failed: Invalid year', year);
          return res.status(400).json({ message: 'Year must be between 1 and 5' });
        }

        // Validate universityYear
        const currentYear = new Date().getFullYear();
        if (!Number.isInteger(universityYearNum) || universityYearNum < 2000 || universityYearNum > currentYear + 5) {
          console.log('Validation failed: Invalid universityYear', universityYear);
          return res.status(400).json({ message: `University year must be between 2000 and ${currentYear + 5}` });
        }

        // Validate speciality
        if (yearNum === 4 && !['SID', 'SIL', 'SIQ', 'SIT'].includes(speciality)) {
          console.log('Validation failed: Invalid speciality for 4th year', speciality);
          return res.status(400).json({ message: 'Speciality must be SID, SIL, SIQ, or SIT for 4th year' });
        }
        if (yearNum !== 4 && speciality) {
          console.log('Validation failed: Speciality provided for non-4th year', speciality);
          return res.status(400).json({ message: 'Speciality should only be provided for 4th year' });
        }

        // Validate solution
        if (solution && !solution.startsWith('https://drive.google.com/')) {
          console.log('Validation failed: Invalid solution link', solution);
          return res.status(400).json({ message: 'Solution must be a valid Google Drive link' });
        }

        // Sanitize filename for public_id
        const sanitizedFileName = file.originalname
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .replace(/[^a-zA-Z0-9._-]/g, ''); // Remove special characters
        const publicId = `Uploads/pdf_${Date.now()}_${sanitizedFileName}`; // Fixed: No nested Uploads folder

        console.log(`Starting Cloudinary upload for file: ${file.originalname}, public_id: ${publicId}`);

        // Upload PDF to Cloudinary with public access
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'Uploads', // Folder is specified here
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
                full_response: JSON.stringify(result, null, 2),
              });

              // Verify the uploaded file is accessible
              axios
                .get(result.secure_url, { responseType: 'arraybuffer' })
                .then(response => {
                  if (response.status === 200 && response.headers['content-type'] === 'application/pdf') {
                    console.log('Cloudinary file verification successful:', result.secure_url);
                    resolve(result);
                  } else {
                    console.error('Cloudinary file verification failed:', {
                      status: response.status,
                      contentType: response.headers['content-type'],
                    });
                    reject(new Error(`Uploaded file is not accessible or not a valid PDF (status: ${response.status})`));
                  }
                })
                .catch(err => {
                  console.error('Cloudinary file verification error:', {
                    message: err.message,
                    response: err.response ? {
                      status: err.response.status,
                      data: err.response.data ? JSON.stringify(err.response.data, null, 2) : 'No data',
                    } : 'No response data',
                  });
                  if (err.response?.data?.error?.code === 'show_original_customer_untrusted') {
                    reject(new Error('Customer is marked as untrusted. Please enable PDF delivery in Cloudinary settings under Security > PDF and ZIP files delivery.'));
                  }
                  reject(new Error(`Failed to verify uploaded file: ${err.message}`));
                });
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

        // Log database operation
        console.log('Saving upload to database:', {
          link: uploadResult.secure_url,
          year: yearNum,
          universityYear: universityYearNum,
          semester: semesterNum,
          module,
          type,
          speciality: yearNum === 4 ? speciality : null,
          solution: solution || null,
        });

        // Save Cloudinary URL to database
        const upload = await prisma.upload.create({
          data: {
            link: uploadResult.secure_url,
            year: yearNum,
            universityYear: universityYearNum,
            semester: semesterNum,
            module,
            type,
            speciality: yearNum === 4 ? speciality : null,
            solution: solution || null,
          },
        });

        console.log('Database save successful:', {
          uploadId: upload.id,
          link: upload.link,
        });

        res.status(201).json({ message: 'Upload created successfully', upload });
      });
    });
  } catch (err) {
    console.error('Error in createUpload:', {
      message: err.message,
      stack: err.stack,
    });
    // Provide specific guidance for Cloudinary-related errors
    let errorMessage = 'Server error';
    if (err.message.includes('Customer is marked as untrusted')) {
      errorMessage = 'Failed to upload PDF: Customer is marked as untrusted. Please enable PDF delivery in Cloudinary settings under Security > PDF and ZIP files delivery.';
    } else if (err.message.includes('Failed to verify uploaded file')) {
      errorMessage = `Failed to verify uploaded file: ${err.message}`;
    } else {
      errorMessage = `Server error: ${err.message}`;
    }
    res.status(500).json({ message: errorMessage, error: err.message });
  } finally {
    console.log('Disconnecting Prisma client');
    await prisma.$disconnect();
  }
};

// Existing getUploads and deleteUpload functions (unchanged)
export const getUploads = async (req, res) => {
  try {
    console.log('Starting getUploads function');
    const { year, universityYear, semester, type, module } = req.query;

    const filters = {};
    if (year) filters.year = parseInt(year);
    if (universityYear) filters.universityYear = parseInt(universityYear);
    if (semester) filters.semester = parseInt(semester);
    if (type) filters.type = type;
    if (module) filters.module = { contains: module, mode: 'insensitive' };

    console.log('Fetching uploads with filters:', filters);

    const uploads = await prisma.upload.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
    });

    console.log('Uploads fetched:', { count: uploads.length });

    res.json(uploads);
  } catch (err) {
    console.error('Error in getUploads:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    console.log('Disconnecting Prisma client');
    await prisma.$disconnect();
  }
};

export const deleteUpload = async (req, res) => {
  try {
    const uploadId = parseInt(req.params.id);
    console.log('Starting deleteUpload function for ID:', uploadId);

    if (isNaN(uploadId)) {
      console.log('Invalid upload ID:', req.params.id);
      return res.status(400).json({ message: 'Invalid or missing upload ID' });
    }

    console.log('Fetching upload from database:', { uploadId });

    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
    });

    if (!upload) {
      console.log('Upload not found:', { uploadId });
      return res.status(404).json({ message: 'Upload not found' });
    }

    console.log('Attempting to delete Cloudinary resource:', { link: upload.link });

    const publicIdMatch = upload.link.match(/\/Uploads\/(.+)\.pdf$/);
    if (publicIdMatch) {
      const publicId = `Uploads/${publicIdMatch[1]}`;
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      console.log('Deleted PDF from Cloudinary:', { publicId });
    } else {
      console.warn('Could not extract public_id from URL:', upload.link);
    }

    console.log('Deleting upload from database:', { uploadId });

    await prisma.upload.delete({
      where: { id: uploadId },
    });

    console.log('Upload deleted successfully:', { uploadId });

    res.json({ message: 'Upload deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      console.log('Upload not found during deletion:', { uploadId: req.params.id });
      return res.status(404).json({ message: 'Upload not found' });
    }
    console.error('Error in deleteUpload:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    console.log('Disconnecting Prisma client');
    await prisma.$disconnect();
  }
};