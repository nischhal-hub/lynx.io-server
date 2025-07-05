// src/routes/routeRoutes.ts
import { Router } from 'express';
import RoutesController from '../controller/Routes.controller';

const router = Router();

router
  .route('/')
  .post(RoutesController.createRoute)
  .get(RoutesController.getAllRoutes);

router.get('/vehicle/:vehicleId',  RoutesController.getRoutesByVehicle);

router
  .route('/:id')
  .get(RoutesController.getRouteById)
  .patch(RoutesController.updateRoute)
  .delete(RoutesController.deleteRoute);

export default router;
