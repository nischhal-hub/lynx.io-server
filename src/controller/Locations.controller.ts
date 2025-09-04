import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/AsyncHandler';
import AppError from '../utils/AppError';
import Location from '../database/model/Location.Model';
import SocketService from '../Socket';

let socketService: SocketService;

export function initSocketService(server: any) {
  socketService = SocketService.initSocketService(server);
}

const pickProps = (body: any) => ({
  deviceId: body.deviceId,
  latitude: String(body.lat ?? body.latitude),
  longitude: String(body.lng ?? body.longitude),
  altitude: body.altitude ? String(body.altitude) : null,
  speed: body.speed ? String(body.speed) : null,
});

class LocationController {
  
  public createLocation = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const locations = req.body;

      if (!Array.isArray(locations) || locations.length === 0) {
        return next(new AppError('Array of location objects is required', 400));
      }

      const formattedLocations = locations.map((loc) => pickProps(loc));
      const newLocations = await Location.bulkCreate(formattedLocations);

      // Emit only the latest vehicle location to front-end
      if (socketService && newLocations.length > 0) {
        const latest = newLocations[newLocations.length - 1];
        socketService.io.emit('vehicle_location_updated', latest.toJSON());
      }

      res.status(201).json({
        status: 'success',
        results: newLocations.length,
        data: newLocations,
      });
    }
  );

  // Get all vehicle locations
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

  // Get latest vehicle location
  public getLatestLocation = asyncHandler(
    async (_req: Request, res: Response) => {
      const latest = await Location.findOne({ order: [['createdAt', 'DESC']] });
      if (!latest) throw new AppError('No vehicle location data yet', 404);

      res.status(200).json({ status: 'success', data: latest });
    }
  );
  // Get vehicle location by ID
  public getLocationById = asyncHandler(async (req: Request, res: Response) => {
    const location = await Location.findByPk(req.params.id);
    if (!location) throw new AppError('Vehicle location not found', 404);

    res.status(200).json({ status: 'success', data: location });
  });

  // Update vehicle location
  public updateLocation = asyncHandler(async (req: Request, res: Response) => {
    const location = await Location.findByPk(req.params.id);
    if (!location) throw new AppError('Vehicle location not found', 404);

    const updatedLocation = await location.update(pickProps(req.body));

    if (socketService) {
      socketService.io.emit(
        'vehicle_location_updated',
        updatedLocation.toJSON()
      );
    }

    res.status(200).json({ status: 'success', data: updatedLocation });
  });

  // Delete vehicle location
  public deleteLocation = asyncHandler(async (req: Request, res: Response) => {
    const location = await Location.findByPk(req.params.id);
    if (!location) throw new AppError('Vehicle location not found', 404);

    await location.destroy();

    if (socketService) {
      socketService.io.emit('vehicle_location_deleted', req.params.id);
    }

    res.status(204).send();
  });
}

export default new LocationController();
