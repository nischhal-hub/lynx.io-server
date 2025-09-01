import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/User.Routes';
import vehicleRoutes from './routes/Vechile.Routes';
import locationRoutes from './routes/Location.Routes';
import deviceRoutes from './routes/Device.Routes';
import routesRoutes from './routes/Routes.Routes';
import userLocationRoutes from './routes/UserLocation.Routes';
import userRecenetActivityRoutes from './routes/RecentActivites.routes';

dotenv.config();

import './database/connection';
import cookieParser from 'cookie-parser';
import { setupAssociations } from './database/connection';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
setupAssociations();

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/vehicle', vehicleRoutes);
app.use('/api/v1/location', locationRoutes);
app.use('/api/v1/device', deviceRoutes);
app.use('/api/v1/routes', routesRoutes);
app.use('/api/v1/userlocation',userLocationRoutes);
app.use('/api/v1/recentactivity',userRecenetActivityRoutes);
app.get('/', (req, res) => {
  res.json({
    message: 'Lynx Backend API',
  });
});

export default app;
