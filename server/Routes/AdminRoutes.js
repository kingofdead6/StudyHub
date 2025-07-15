import express from 'express';
import { authMiddleware, adminMiddleware } from '../utils/authMiddleware.js';
import { deleteUser, getUsers } from '../controllers/adminController.js';
import { createUpload, getUploads, deleteUpload } from '../controllers/uploadsController.js';

const router = express.Router();

router.get('/users', authMiddleware, adminMiddleware, getUsers);
router.delete('/users/:id', authMiddleware, adminMiddleware, deleteUser);
router.post('/uploads', authMiddleware, adminMiddleware, createUpload);
router.get('/uploads', authMiddleware, adminMiddleware, getUploads);
router.delete('/uploads/:id', authMiddleware, adminMiddleware, deleteUpload);

export default router;