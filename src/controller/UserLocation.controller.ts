import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/AsyncHandler';
import AppError from '../utils/AppError';
import UserLocation from '../database/model/UserLocation.Model';
import User from '../database/model/user.Model';
import Location from '../database/model/Location.Model';
import getDistanceKm from '../utils/distanceFormula';
import SocketNotificationService from '../controller/Notification.controller';
import SocketService from '../Socket';

let socketService: SocketService;

export function initSocketService(server: any) {
  socketService = SocketService.initSocketService(server);
}

const pickProps = (body: any) => ({
  latitude: body.latitude?.toString(),
  longitude: body.longitude?.toString(),
  userId: body.userId,
});

class UserLocationController {
  // Create new user location and notify nearby vehicles
  public createUserLocation = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { latitude, longitude } = req.body;
      const userId = req.user?.id;

      if (!latitude || !longitude || !userId) {
        return next(
          new AppError('Latitude, longitude, and userId are required', 400)
        );
      }

      // 1️⃣ Save the user's location
      const newUserLocation = await UserLocation.create({
        userId,
        latitude: String(latitude),
        longitude: String(longitude),
      });

      const latNum = parseFloat(newUserLocation.latitude);
      const lonNum = parseFloat(newUserLocation.longitude);

      // 2️⃣ Fetch all vehicles
      const vehicles = await Location.findAll();

      const approxDistanceKm = 1; // 1 km bounding box
      const latDiff = approxDistanceKm / 111;
      const lonDiff =
        approxDistanceKm / (111 * Math.cos((latNum * Math.PI) / 180));

      // 3️⃣ Filter vehicles roughly within bounding box
      const nearbyVehicles = vehicles.filter((v) => {
        const vehicleLat = parseFloat(v.latitude);
        const vehicleLon = parseFloat(v.longitude);
        return (
          vehicleLat >= latNum - latDiff &&
          vehicleLat <= latNum + latDiff &&
          vehicleLon >= lonNum - lonDiff &&
          vehicleLon <= lonNum + lonDiff
        );
      });

      const notificationService = SocketNotificationService.getInstance();
      const nearbyResults: any[] = [];

      // 4️⃣ Compute exact distance and notify user
      for (const vehicle of nearbyVehicles) {
        const vehicleLat = parseFloat(vehicle.latitude);
        const vehicleLon = parseFloat(vehicle.longitude);
        const distance = getDistanceKm(latNum, lonNum, vehicleLat, vehicleLon);

        nearbyResults.push({
          vehicleId: vehicle.id,
          distance: `${distance.toFixed(3)} km`,
        });

        if (distance < 0.2) {
          await notificationService.createNotification(
            String(userId),
            'Vehicle Nearby',
            `A vehicle is ${distance.toFixed(3)} km away from you`
          );
        }
      }

      // 5️⃣ Emit socket update
      if (socketService) {
        socketService.emitUserLocationUpdated(newUserLocation.toJSON());
      }

      // 6️⃣ Response
      res.status(201).json({
        status: 'success',
        data: {
          newUserLocation,
          nearbyVehicles: nearbyResults,
        },
      });
    }
  );

  public checkNearbyLocations = asyncHandler(
    async (_req: Request, res: Response) => {
      const users = await UserLocation.findAll({
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName'] }],
      });

      const vehicles = await Location.findAll();
      const nearbyResults: any[] = [];

      // Precompute vehicle positions
      const vehiclePositions = vehicles.map((v) => ({
        id: v.id,
        lat: parseFloat(v.latitude),
        lon: parseFloat(v.longitude),
      }));

      // Loop over users and filter vehicles using bounding box
      for (const user of users) {
        const userLat = parseFloat(user.latitude);
        const userLon = parseFloat(user.longitude);

        const approxDistanceKm = 1; // 1 km radius for rough filter
        const latDiff = approxDistanceKm / 111;
        const lonDiff =
          approxDistanceKm / (111 * Math.cos((userLat * Math.PI) / 180));

        const candidateVehicles = vehiclePositions.filter(
          (v) =>
            v.lat >= userLat - latDiff &&
            v.lat <= userLat + latDiff &&
            v.lon >= userLon - lonDiff &&
            v.lon <= userLon + lonDiff
        );

        // Compute exact distances only for candidates
        for (const v of candidateVehicles) {
          const distance = getDistanceKm(v.lat, v.lon, userLat, userLon);
          nearbyResults.push({
            vehicleId: v.id,
            userId: user.userId,
            distance: `${distance.toFixed(3)} km`,
          });
        }
      }

      res.status(200).json({
        status: 'success',
        results: nearbyResults.length,
        data: nearbyResults,
      });
    }
  );

  // --- keep other CRUD methods for backward compatibility ---
  public getAllUserLocations = asyncHandler(async (_req, res) => {
    const locations = await UserLocation.findAll({
      order: [['createdAt', 'DESC']],
    });
    res
      .status(200)
      .json({ status: 'success', results: locations.length, data: locations });
  });

  public getLatestUserLocation = asyncHandler(async (_req, res) => {
    const latest = await UserLocation.findOne({
      order: [['createdAt', 'DESC']],
    });
    if (!latest) throw new AppError('No user location data yet', 404);
    res.status(200).json({ status: 'success', data: latest });
  });

  public getUserLocationById = asyncHandler(async (req, res) => {
    const location = await UserLocation.findByPk(req.params.id);
    if (!location) throw new AppError('User location not found', 404);
    res.status(200).json({ status: 'success', data: location });
  });

  public updateUserLocation = asyncHandler(async (req, res) => {
    const location = await UserLocation.findByPk(req.params.id);
    if (!location) throw new AppError('User location not found', 404);

    const updatedLocation = await location.update(pickProps(req.body));
    if (socketService)
      socketService.emitUserLocationUpdated(updatedLocation.toJSON());
    res.status(200).json({ status: 'success', data: updatedLocation });
  });

  public deleteUserLocation = asyncHandler(async (req, res) => {
    const location = await UserLocation.findByPk(req.params.id);
    if (!location) throw new AppError('User location not found', 404);

    await location.destroy();
    if (socketService) socketService.emitUserLocationDeleted(req.params.id);
    res.status(204).send();
  });
}

export default new UserLocationController();
