import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import AuthRoutes from './Routes/AuthRoutes.js';
import AdminRoutes from './Routes/AdminRoutes.js';
import contactRoutes from './Routes/contactRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/auth', AuthRoutes);
app.use('/api/admin', AdminRoutes);
app.use('/api/contacts', contactRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.get('/', (req, res) => {
  res.send('Backend API is running');
});