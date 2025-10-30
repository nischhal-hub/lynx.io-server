import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/User.Routes';
import vehicleRoutes from './routes/Vechile.Routes';
import locationRoutes from './routes/Location.Routes';
import deviceRoutes from './routes/Device.Routes';
import routesRoutes from './routes/Routes.Routes';
import userLocationRoutes from './routes/UserLocation.Routes';
import userRecenetActivityRoutes from './routes/RecentActivites.routes';
import GeoFenceRoutes from './routes/GeoFence.Routes';
import dashboardRoutes from './routes/dashboard.Routes';
import notificationRoutes from './routes/Notification.Routes';

import './database/connection';
import cookieParser from 'cookie-parser';
import { setupAssociations } from './database/connection';
import { leakyBucketMiddleware } from './middleware/rate-limiter';
import helmet from 'helmet';
import './mqttService'; // ✅ Important: import here so MQTT starts

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(leakyBucketMiddleware({ capacity: 5, leakRate: 0.005 }));

setupAssociations();

// ✅ Define all routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/vehicle', vehicleRoutes);
app.use('/api/v1/location', locationRoutes);
app.use('/api/v1/device', deviceRoutes);
app.use('/api/v1/routes', routesRoutes);
app.use('/api/v1/userlocation', userLocationRoutes);
app.use('/api/v1/recentactivity', userRecenetActivityRoutes);
app.use('/api/v1/geofence', GeoFenceRoutes);
app.use('/api/v1/notification', notificationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Lynx Backend API',
  });
});

export default app;
