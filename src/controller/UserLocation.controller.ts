import { Request, Response, NextFunction } from 'express';
import SocketService from '../Socket';
import asyncHandler from '../utils/AsyncHandler';
import AppError from '../utils/AppError';
import UserLocation from '../database/model/UserLocation.Model';
import User from '../database/model/user.Model';
import Location from '../database/model/Location.Model';
import getDistanceKm from '../utils/distanceFormula';

let socketService: SocketService;

export function initSocketService(server: any) {
  socketService = SocketService.initSocketService(server);
}

// Utility to pick properties
const pickProps = (body: any) => ({
  latitude: body.latitude?.toString(),
  longitude: body.longitude?.toString(),
  userId: body.userId,
});

// Euclidean distance in km approximation

class UserLocationController {
  public createUserLocation = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { latitude, longitude } = req.body;

      if (!latitude || !longitude || !req.user?.id) {
        return next(
          new AppError('Latitude, longitude, and userId are required', 400)
        );
      }

      const newLocation = await UserLocation.create({
        latitude: String(latitude),
        longitude: String(longitude),
        userId: req.user.id,
      });

      if (socketService) {
        socketService.emitUserLocationCreated(newLocation.toJSON());
      }

      res.status(201).json({ status: 'success', data: newLocation });
    }
  );

  public getAllUserLocations = asyncHandler(
    async (_req: Request, res: Response) => {
      const locations = await UserLocation.findAll({
        order: [['createdAt', 'DESC']],
      });

      res.status(200).json({
        status: 'success',
        results: locations.length,
        data: locations,
      });
    }
  );

  public getLatestUserLocation = asyncHandler(
    async (_req: Request, res: Response) => {
      const latest = await UserLocation.findOne({
        order: [['createdAt', 'DESC']],
      });

      if (!latest) throw new AppError('No user location data yet', 404);

      res.status(200).json({ status: 'success', data: latest });
    }
  );

  public getUserLocationById = asyncHandler(
    async (req: Request, res: Response) => {
      const location = await UserLocation.findByPk(req.params.id);
      if (!location) throw new AppError('User location not found', 404);

      res.status(200).json({ status: 'success', data: location });
    }
  );

  public updateUserLocation = asyncHandler(
    async (req: Request, res: Response) => {
      const location = await UserLocation.findByPk(req.params.id);
      if (!location) throw new AppError('User location not found', 404);

      const updatedLocation = await location.update(pickProps(req.body));

      if (socketService) {
        socketService.emitUserLocationUpdated(updatedLocation.toJSON());
      }

      res.status(200).json({ status: 'success', data: updatedLocation });
    }
  );

  public deleteUserLocation = asyncHandler(
    async (req: Request, res: Response) => {
      const location = await UserLocation.findByPk(req.params.id);
      if (!location) throw new AppError('User location not found', 404);

      await location.destroy();

      if (socketService) {
        socketService.emitUserLocationDeleted(req.params.id);
      }

      res.status(204).send();
    }
  );

  public checkNearbyLocations = asyncHandler(
    async (req: Request, res: Response) => {
      const locations = await Location.findAll();
      const userLocations = await UserLocation.findAll({
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName'] }],
      });

      const nearbyResults: any[] = [];

      for (const loc of locations) {
        const lat1 = parseFloat(loc.latitude);
        const lon1 = parseFloat(loc.longitude);

        for (const userLoc of userLocations) {
            console.log("hello iam user hai",userLoc);
          const lat2 = parseFloat(userLoc.latitude);
          const lon2 = parseFloat(userLoc.longitude);

          const distance = getDistanceKm(lat1, lon1, lat2, lon2);

          nearbyResults.push({
            locationId: loc.id,
            userId: userLoc?.userId,
            // userName: userLoc.user.firstName,
            distance: `${distance.toFixed(3)} km`,
          });
        }
      }

      return res.status(200).json({
        status: 'success',
        results: nearbyResults.length,
        data: nearbyResults,
      });
    }
  );
}

export default new UserLocationController();
