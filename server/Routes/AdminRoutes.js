import express from 'express';
import multer from 'multer';
import { authMiddleware, adminMiddleware } from '../utils/authMiddleware.js';
import { deleteUser, getUsers } from '../controllers/adminController.js';
import { createUpload, getUploads, deleteUpload } from '../controllers/uploadsController.js';

const router = express.Router();

// Configure Multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    console.log('Multer fileFilter:', file.mimetype);
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

// Routes
router.get('/users', authMiddleware, adminMiddleware, getUsers);
router.delete('/users/:id', authMiddleware, adminMiddleware, deleteUser);
router.post('/uploads', authMiddleware, adminMiddleware, upload.single('file'), createUpload);
router.get('/uploads', authMiddleware, adminMiddleware, getUploads);
router.delete('/uploads/:id', authMiddleware, adminMiddleware, deleteUpload);

export default router;