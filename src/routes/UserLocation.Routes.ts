import { Router } from 'express';
import UserLocationController from '../controller/UserLocation.controller';
import protectedRoutes from '../middleware/protectedRoutes';

const router = Router();
router.get('/check/11', UserLocationController.checkNearbyLocations);


router.post('/', protectedRoutes.isUserLoggedIn, UserLocationController.createUserLocation);
router.get('/', UserLocationController.getAllUserLocations);
router.get('/latest', UserLocationController.getLatestUserLocation);
router.get('/:id', UserLocationController.getUserLocationById);
router.patch('/:id', UserLocationController.updateUserLocation);
router.delete('/:id', UserLocationController.deleteUserLocation);


export default router;
