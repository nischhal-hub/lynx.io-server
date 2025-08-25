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

      try {
        const formattedLocations = locations.map((loc) => pickProps(loc));

        const newLocations = await Location.bulkCreate(formattedLocations);

        if (socketService) {
          // Emit only latest to avoid spam
          const latest = newLocations[newLocations.length - 1];
          socketService.io.emit('location_created', latest.toJSON());
        }

        res.status(201).json({
          status: 'success',
          results: newLocations.length,
          data: newLocations,
        });
      } catch (error: any) {
        console.error('Database operation failed:', error);
        return next(
          new AppError(
            error.message || 'Failed to create location records',
            500
          )
        );
      }
    }
  );

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
