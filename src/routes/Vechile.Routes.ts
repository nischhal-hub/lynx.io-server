import express from 'express';
import VechileController, {
  VehicleController,
} from '../controller/VechileController';
import protectedRoutes from '../middleware/protectedRoutes';

const router = express.Router();

router
  .route('/')
  .get( protectedRoutes.isUserLoggedIn,VechileController.getAllVehicles)
  .post(protectedRoutes.isUserLoggedIn, VechileController.registerVehicle);

router
  .route('/user')
  .get(protectedRoutes.isUserLoggedIn, VechileController.getAllVehiclesByUser);

router
  .route('/:id')
  .get(VechileController.getVehicleById)
  .patch(VechileController.updateVehicleById)
  .delete(VechileController.deleteVehicleById);

router.get('/history/:deviceId', VechileController.getVehicleHistoryByDevice);

export default router;
