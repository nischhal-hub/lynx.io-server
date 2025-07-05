import { Request, Response, NextFunction } from 'express';
import SocketService from '../Socket';
import asyncHandler from '../utils/AsyncHandler';
import AppError from '../utils/AppError';
import Location from '../database/model/Location.Model';

let socketService: SocketService;

export function initSocketService(server: any) {
  socketService = new SocketService(server);
}

const pickProps = (body: any) => ({
  latitude: body.latitude?.toString(),
  longitude: body.longitude?.toString(),
  altitude: body.altitude?.toString() ?? null,
  speed: body.speed?.toString() ?? null,
});

class LocationController {
  // src/controller/Location.controller.ts
  public createLocation = asyncHandler(async (req, res, next) => {
    const { latitude, longitude, altitude, speed } = req.body;

    // Validate input
    if (!latitude || !longitude) {
      return next(new AppError('Latitude and longitude are required', 400));
    }

    try {
      const newLocation = await Location.create({
        latitude: String(latitude),
        longitude: String(longitude),
        altitude: altitude ? String(altitude) : null,
        speed: speed ? String(speed) : null,
      });

      // Emit socket event
      const socketService = SocketService.getInstance();
      socketService.io.emit('location_created', newLocation.toJSON());

      res.status(201).json({
        status: 'success',
        data: newLocation,
      });
    } catch (error) {
      console.error('Database operation failed:', error);
      return next(new AppError('Failed to create location record', 500));
    }
  });

  public getAllLocations = asyncHandler(
    async (_req: Request, res: Response) => {
      const locations = await Location.findAll({
        order: [['createdAt', 'DESC']],
      });
      res.status(200).json({
        status: 'success',
        results: locations.length,
        data: locations,
      });
    }
  );

  public getLatestLocation = asyncHandler(
    async (_req: Request, res: Response) => {
      const latest = await Location.findOne({ order: [['createdAt', 'DESC']] });
      if (!latest) throw new AppError('No location data yet', 404);

      res.status(200).json({ status: 'success', data: latest });
    }
  );

  public getLocationById = asyncHandler(async (req: Request, res: Response) => {
    const location = await Location.findByPk(req.params.id);
    if (!location) throw new AppError('Location not found', 404);

    res.status(200).json({ status: 'success', data: location });
  });

  public updateLocation = asyncHandler(async (req: Request, res: Response) => {
    const location = await Location.findByPk(req.params.id);
    if (!location) throw new AppError('Location not found', 404);

    const updatedLocation = await location.update(pickProps(req.body));

    if (socketService) {
      socketService.emitLocationUpdated(updatedLocation.toJSON());
    }

    res.status(200).json({ status: 'success', data: updatedLocation });
  });

  public deleteLocation = asyncHandler(async (req: Request, res: Response) => {
    const location = await Location.findByPk(req.params.id);
    if (!location) throw new AppError('Location not found', 404);

    await location.destroy();

    // Emit real-time event
    if (socketService) {
      socketService.emitLocationDeleted(req.params.id);
    }

    res.status(204).send();
  });
}

export default new LocationController();
