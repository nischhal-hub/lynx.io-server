// src/config/config.ts
import dotenv from 'dotenv';
dotenv.config(); 

export const envConfig = {
  port: process.env.PORT,
  connection: process.env.CONNECTION_STRING,
  JWT_SECRET: process.env.JWT_SCERET,
};
