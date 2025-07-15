import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createUpload = async (req, res) => {
  try {
    const { link, year, universityYear, semester, module, type, speciality, solution } = req.body;

    // Validate required fields
    if (!link || !year || !universityYear || !semester || !module || !type) {
      return res.status(400).json({ message: 'All required fields (link, year, universityYear, semester, module, type) must be provided' });
    }

    // Validate type
    if (!['Interrogation', 'Intermediate Exam', 'Final Exam', 'TD', 'Course', 'Solution'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type. Must be one of: Interrogation, Intermediate Exam, Final Exam, TD, Course, Solution' });
    }

    // Validate semester
    if (![1, 2].includes(Number(semester))) {
      return res.status(400).json({ message: 'Semester must be 1 or 2' });
    }

    // Validate year
    if (![1, 2, 3, 4, 5].includes(Number(year))) {
      return res.status(400).json({ message: 'Year must be between 1 and 5' });
    }

    // Validate universityYear
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(Number(universityYear)) || universityYear < 2000 || universityYear > currentYear + 5) {
      return res.status(400).json({ message: `University year must be between 2000 and ${currentYear + 5}` });
    }

    // Validate speciality
    if (year === 4 && !['SID', 'SIL', 'SIQ', 'SIT'].includes(speciality)) {
      return res.status(400).json({ message: 'Speciality must be SID, SIL, SIQ, or SIT for 4th year' });
    }
    if (year !== 4 && speciality) {
      return res.status(400).json({ message: 'Speciality should only be provided for 4th year' });
    }

    // Validate solution
    if (solution && !solution.startsWith('https://drive.google.com/')) {
      return res.status(400).json({ message: 'Solution must be a valid Google Drive link' });
    }

    const upload = await prisma.upload.create({
      data: {
        link,
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
  } catch (err) {
    console.error('Error in createUpload:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    await prisma.$disconnect();
  }
};

export const getUploads = async (req, res) => {
  try {
    const { year, universityYear, semester, type } = req.query;

    const filters = {};
    if (year) filters.year = parseInt(year);
    if (universityYear) filters.universityYear = parseInt(universityYear);
    if (semester) filters.semester = parseInt(semester);
    if (type) filters.type = type;

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
    const uploadId = parseInt(req.params.id);
    if (isNaN(uploadId)) {
      return res.status(400).json({ message: 'Invalid or missing upload ID' });
    }

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