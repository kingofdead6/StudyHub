import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import AuthRoutes from './Routes/AuthRoutes.js';
import AdminRoutes from './Routes/AdminRoutes.js';
import contactRoutes from './Routes/contactRoutes.js';
import ChatRoutes from './routes/ChatRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ limit: '100mb', extended: true })); // Increase URL-encoded payload limit

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'Uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch((err) => {
  console.error('Error creating uploads directory:', err);
});

app.use('/api/auth', AuthRoutes);
app.use('/api/admin', AdminRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/chat', ChatRoutes);

app.get('/', (req, res) => {
  res.send('Backend API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));