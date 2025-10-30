import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/AsyncHandler';
import AppError from '../utils/AppError';
import UserLocation from '../database/model/UserLocation.Model';
import User from '../database/model/user.Model';
import Location from '../database/model/Location.Model';
import getDistanceKm from '../utils/distanceFormula';
import SocketNotificationService from '../controller/Notification.controller';
import SocketService from '../Socket';
import Vehicle from '../database/model/Vechile.Model';
import Device from '../database/model/Device.Model';

let socketService: SocketService;

export function initSocketService(server: any) {
  socketService = SocketService.initSocketService(server);
}

const pickProps = (body: any) => ({
  latitude: body.latitude?.toString(),
  longitude: body.longitude?.toString(),
  userId: body.userId,
});
const notifiedVehicles = new Map<string, Set<string>>();

class UserLocationController {
  // Create new user location and notify nearby vehicles
  // public createUserLocation = asyncHandler(
  //   async (req: Request, res: Response, next: NextFunction) => {
  //     const { latitude, longitude } = req.body;
  //     const userId = req.user?.id;

  //     if (!latitude || !longitude || !userId) {
  //       return next(
  //         new AppError('Latitude, longitude, and userId are required', 400)
  //       );
  //     }

  //     // 1️⃣ Save or update the user's latest location
  //     const [newUserLocation] = await UserLocation.upsert(
  //       {
  //         userId,
  //         latitude: String(latitude),
  //         longitude: String(longitude),
  //       },
  //       { returning: true }
  //     );

  //     const latNum = parseFloat(latitude);
  //     const lonNum = parseFloat(longitude);

  //     // 2️⃣ Fetch latest location for each vehicle
  //     const latestVehicleLocations = await Vehicle.findAll({
  //       include: [
  //         {
  //           model: Device,
  //           as: 'device',
  //           include: [
  //             {
  //               model: Location,
  //               as: 'locations',
  //               limit: 1, // latest location only
  //               order: [['timestamp', 'DESC']],
  //             },
  //           ],
  //         },
  //       ],
  //     });

  //     const nearbyResults: any[] = [];
  //     const notificationService = SocketNotificationService.getInstance();

  //     // 3️⃣ Compare distances & send notifications
  //     for (const vehicle of latestVehicleLocations) {
  //       // @ts-expect-error
  //       const vehicleLoc = vehicle.device?.locations[0];
  //       if (!vehicleLoc) continue;

  //       const vehicleLat = parseFloat(vehicleLoc.latitude);
  //       const vehicleLon = parseFloat(vehicleLoc.longitude);

  //       const distance = getDistanceKm(latNum, lonNum, vehicleLat, vehicleLon);

  //       if (distance < 0.2) {
  //         nearbyResults.push({
  //           vehicleId: vehicle.id,
  //           numberPlate: vehicle.numberPlate,
  //           distance: `${distance.toFixed(3)} km`,
  //         });

  //         await notificationService.createNotification(
  //           String(userId),
  //           'Vehicle Nearby',
  //           `Vehicle ${vehicle.numberPlate} is ${distance.toFixed(
  //             3
  //           )} km away from you`
  //         );
  //       }
  //     }

  //     // 4️⃣ Emit socket update to user
  //     if (socketService) {
  //       socketService.emitUserLocationUpdated(newUserLocation.toJSON());
  //     }

  //     // 5️⃣ Send response
  //     res.status(201).json({
  //       status: 'success',
  //       data: {
  //         newUserLocation,
  //         nearbyVehicles: nearbyResults,
  //       },
  //     });
  //   }
  // );

  public createUserLocation = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { latitude, longitude } = req.body;
      const userId = req.user?.id;

      if (!latitude || !longitude || !userId) {
        return next(
          new AppError('Latitude, longitude, and userId are required', 400)
        );
      }

      // 1️⃣ Save or update the user's latest location
      const [newUserLocation] = await UserLocation.upsert(
        {
          userId,
          latitude: String(latitude),
          longitude: String(longitude),
        },
        { returning: true }
      );

      const latNum = parseFloat(latitude);
      const lonNum = parseFloat(longitude);

      // 2️⃣ Fetch latest location for each vehicle
      const latestVehicleLocations = await Vehicle.findAll({
        include: [
          {
            model: Device,
            as: 'device',
            include: [
              {
                model: Location,
                as: 'locations',
                limit: 1, // latest location only
                order: [['timestamp', 'DESC']],
              },
            ],
          },
        ],
      });

      const nearbyResults: any[] = [];
      const notificationService = SocketNotificationService.getInstance();

      // 3️⃣ Compare distances & send notifications only once per vehicle
      for (const vehicle of latestVehicleLocations) {
        // @ts-expect-error
        const vehicleLoc = vehicle.device?.locations?.[0];
        if (!vehicleLoc) continue;

        const vehicleLat = parseFloat(vehicleLoc.latitude);
        const vehicleLon = parseFloat(vehicleLoc.longitude);

        const distance = getDistanceKm(latNum, lonNum, vehicleLat, vehicleLon);

        // Initialize for user if not exists
        if (!notifiedVehicles.has(String(userId))) {
          notifiedVehicles.set(String(userId), new Set());
        }

        const userNotifiedSet = notifiedVehicles.get(String(userId))!;

        if (distance < 0.2 && !userNotifiedSet.has(String(vehicle.id))) {
          // ✅ User just entered the nearby zone
          nearbyResults.push({
            vehicleId: vehicle.id,
            numberPlate: vehicle.numberPlate,
            distance: `${distance.toFixed(3)} km`,
          });

          await notificationService.createNotification(
            String(userId),
            'Vehicle Nearby',
            `Vehicle ${vehicle.numberPlate} is ${distance.toFixed(
              3
            )} km away from you`
          );

          // Mark this vehicle as notified for this user
          userNotifiedSet.add(String(vehicle.id));
        } else if (distance >= 0.2 && userNotifiedSet.has(String(vehicle.id))) {
          // 🚗 User moved out of range — reset so we can notify again next time
          userNotifiedSet.delete(String(vehicle.id));
        }
      }

      // 4️⃣ Emit socket update to user
      if (socketService) {
        socketService.emitUserLocationUpdated(newUserLocation.toJSON());
      }

      // 5️⃣ Send response
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
