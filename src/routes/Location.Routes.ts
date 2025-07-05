import express from 'express';
import LocationController from '../controller/Location.controller';

const router = express.Router();

router.post('/', LocationController.createLocation);

router.get('/', LocationController.getAllLocations);

router.get('/latest', LocationController.getLatestLocation);

router.get('/:id', LocationController.getLocationById);

router.put('/:id', LocationController.updateLocation);

router.delete('/:id', LocationController.deleteLocation);

export default router;
