// src/routes/deviceRoutes.ts
import { Router } from 'express';
import protectedRoutes from '../middleware/protectedRoutes';
import DeviceController from '../controller/Device.controller';

const router = Router();

router
  .route('/')
  .post(DeviceController.registerDevice)
  .get(DeviceController.getAllDevices);

router
  .route('/:id')
  .get( DeviceController.getDeviceById)
  .patch(DeviceController.updateDevice)
  .delete(DeviceController.deleteDevice);


export default router;
