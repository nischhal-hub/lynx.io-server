import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import './database/connection';

const app = express();

app.get('/', (req, res) => {
  res.json({
    message: 'Lynx Backend API',
  });
});

export default app;
