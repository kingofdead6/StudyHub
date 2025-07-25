import { PassThrough } from 'stream';
import { PrismaClient } from '@prisma/client';
import cloudinary from '../utils/cloudinary.js';
import { authMiddleware, adminMiddleware } from '../utils/authMiddleware.js';

const prisma = new PrismaClient();

export const createUpload = async (req, res) => {
  try {
    await authMiddleware(req, res, async () => {
      await adminMiddleware(req, res, async () => {
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

        // Validate required fields
        if (!file || !year || !universityYear || !semester || !module || !type) {
          console.log('Validation failed: Missing required fields');
          return res.status(400).json({ message: 'All required fields (file, year, universityYear, semester, module, type) must be provided' });
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

        // Log start of Cloudinary upload
        console.log(`Starting Cloudinary upload for file: ${file.originalname}, size: ${file.size} bytes`);

        // Upload PDF to Cloudinary with public access
        const uploadResult = await new Promise((resolve, reject) => {
          const publicId = `pdf_${Date.now()}_${file.originalname}`;
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'Uploads',
              resource_type: 'raw',
              public_id: publicId,
              access_mode: 'public', // Ensure public access
            },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error:', error.message);
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

        // Log successful database save
        console.log('Database save successful:', {
          uploadId: upload.id,
          link: upload.link,
        });

        res.status(201).json({ message: 'Upload created successfully', upload });
      });
    });
  } catch (err) {
    console.error('Error in createUpload:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    console.log('Disconnecting Prisma client');
    await prisma.$disconnect();
  }
};

export const getUploads = async (req, res) => {
  try {
    const { year, universityYear, semester, type, module } = req.query;

    // Log query parameters
    console.log('Fetching uploads with filters:', { year, universityYear, semester, type, module });

    const filters = {};
    if (year) filters.year = parseInt(year);
    if (universityYear) filters.universityYear = parseInt(universityYear);
    if (semester) filters.semester = parseInt(semester);
    if (type) filters.type = type;
    if (module) filters.module = { contains: module, mode: 'insensitive' };

    const uploads = await prisma.upload.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
    });

    // Log retrieved uploads
    console.log('Retrieved uploads:', {
      count: uploads.length,
      uploads: uploads.map(u => ({ id: u.id, link: u.link })),
    });

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
    if (isNaN(uploadId)) {
      console.log('Invalid upload ID:', req.params.id);
      return res.status(400).json({ message: 'Invalid or missing upload ID' });
    }

    // Log database fetch
    console.log('Fetching upload from database:', { uploadId });

    // Fetch upload to get Cloudinary URL
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
    });

    if (!upload) {
      console.log('Upload not found:', { uploadId });
      return res.status(404).json({ message: 'Upload not found' });
    }

    // Log Cloudinary deletion attempt
    console.log('Attempting to delete Cloudinary resource:', { link: upload.link });

    // Extract public_id from Cloudinary URL
    const publicIdMatch = upload.link.match(/\/Uploads\/(.+)\.pdf$/);
    if (publicIdMatch) {
      const publicId = `Uploads/${publicIdMatch[1]}`;
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      console.log('Deleted PDF from Cloudinary:', { publicId });
    } else {
      console.warn('Could not extract public_id from URL:', upload.link);
    }

    // Log database deletion
    console.log('Deleting upload from database:', { uploadId });

    // Delete from database
    await prisma.upload.delete({
      where: { id: uploadId },
    });

    // Log successful deletion
    console.log('Upload deleted successfully:', { uploadId });

    res.json({ message: 'Upload deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      console.log('Upload not found during deletion:', { uploadId });
      return res.status(404).json({ message: 'Upload not found' });
    }
    console.error('Error in deleteUpload:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    console.log('Disconnecting Prisma client');
    await prisma.$disconnect();
  }
};