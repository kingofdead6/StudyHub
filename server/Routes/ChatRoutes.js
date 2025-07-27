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
});

// Routes
router.post('/upload-pdf', authMiddleware, upload.single('file'), handlePdfUploadStream); // SSE response, saves to Cloudinary
router.get('/chat', chat); // SSE response
router.post('/chat', chatWithGroq); // JSON response
router.post('/recommended-questions', recommendedQuestions); // JSON response
router.post('/pdf', upload.single('pdf'), handlePdf); // JSON response
router.post('/uploads', authMiddleware, adminMiddleware, upload.single('file'), createUpload);
router.get('/uploads', getUploads);
router.delete('/uploads/:id', authMiddleware, adminMiddleware, deleteUpload);

export default router;