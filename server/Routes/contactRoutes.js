import express from 'express';
import { createContact, getContacts, deleteContact, updateContactSeen} from '../controllers/contactController.js';
import { authMiddleware, adminMiddleware } from '../utils/authMiddleware.js';

const router = express.Router();

// POST /api/contacts - Create a new contact inquiry
router.post('/', createContact);

// GET /api/contacts - Get all contact inquiries (admin only)
router.get('/', authMiddleware, adminMiddleware, getContacts);

// PATCH /api/contacts/:id/seen - Update seen status (admin only)
router.patch('/:id/seen', authMiddleware, adminMiddleware, updateContactSeen);

// DELETE /api/contacts/:id - Delete a contact inquiry (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, deleteContact);


export default router;