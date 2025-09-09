import express from 'express';
import GeoFenceController from '../controller/GeoFence.controller';

const router = express.Router();

// CRUD
router.post('/', GeoFenceController.createGeofence);
router.get('/', GeoFenceController.getGeofences);
router.get('/:id', GeoFenceController.getGeofenceById);
router.patch('/:id', GeoFenceController.updateGeofence);
router.delete('/:id', GeoFenceController.deleteGeofence);

export default router;
