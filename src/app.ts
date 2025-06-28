import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/User.Routes';

dotenv.config();

import './database/connection';
import cookieParser from 'cookie-parser';


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth',authRoutes);
app.get('/', (req, res) => {
  res.json({
    message: 'Lynx Backend API',
  });
});

export default app;
