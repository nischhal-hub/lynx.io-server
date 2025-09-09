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

dotenv.config();

import './database/connection';
import cookieParser from 'cookie-parser';
import { setupAssociations } from './database/connection';
import mqtt from 'mqtt';
import "./mqttService"
const client = mqtt.connect('mqtt://broker.emqx.io:1883');
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
app.use('/api/v1/geofence',GeoFenceRoutes);
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is healthy" });
});
app.get('/', (req, res) => {
  res.json({
    message: 'Lynx Backend API',
  });
});

// client.on("connect",()=>{
//   client.subscribe("emqx/esp32",(err)=>{
//     if(!err){
//       client.publish("emqx/esp32","Hello from NodeJS")
//     }
//   })
// })

// client.on("message",(topic,message)=>{
//   console.log(topic,message.toString());
// })

export default app;
