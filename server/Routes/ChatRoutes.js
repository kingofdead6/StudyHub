import express from 'express';
import multer from 'multer';
import {
  handlePdfUploadStream,
  chat,
  chatWithGroq,
  createUpload,
  getUploads,
  deleteUpload,
  handlePdf,
  recommendedQuestions,
  uploadstandalonepdf,
} from '../controllers/ChatController.js';
import { authMiddleware, adminMiddleware } from '../utils/authMiddleware.js';

const router = express.Router();

// Configure Multer for temporary local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // Increased to 50MB to handle larger PDFs
});

// Routes
router.post('/upload-pdf', authMiddleware, upload.single('file'), handlePdfUploadStream);
router.get('/', chat);
router.post('/', chatWithGroq);
router.post('/recommended-questions', recommendedQuestions);
router.post('/pdf', upload.single('pdf'), handlePdf);
router.post('/uploads', authMiddleware, adminMiddleware, upload.single('file'), createUpload);
router.get('/uploads', getUploads);
router.delete('/uploads/:id', authMiddleware, adminMiddleware, deleteUpload);
router.post('/upload-standalone-pdf', upload.single('file'), uploadstandalonepdf);

export default router;