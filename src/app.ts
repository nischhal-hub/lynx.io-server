import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/User.Routes';
import vehicleRoutes from './routes/Vechile.Routes';

dotenv.config();

import './database/connection';
import cookieParser from 'cookie-parser';
import { setupAssociations } from './database/connection';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
setupAssociations();

app.use('/api/auth', authRoutes);
app.use('/api/vehicle', vehicleRoutes);
app.get('/', (req, res) => {
  res.json({
    message: 'Lynx Backend API',
  });
});

export default app;
