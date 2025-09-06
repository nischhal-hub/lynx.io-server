import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/AsyncHandler';
import AppError from '../utils/AppError';
import Geofence from '../database/model/GeofencesArea';

class GeofenceController {
  // Create Geofence
  public createGeofence = asyncHandler(async (req: Request, res: Response) => {
    const { name, center_lat, center_lng, radius, trigger } = req.body;

    if (!name || !center_lat || !center_lng || !radius) {
      throw new AppError('All fields are required', 400);
    }

    const geofence = await Geofence.create({
      name,
      center_lat,
      center_lng,
      radius,
      trigger,
    });

    res.status(201).json({ status: 'success', data: geofence });
  });

  // Get all geofences
  public getGeofences = asyncHandler(async (_req: Request, res: Response) => {
    const fences = await Geofence.findAll();
    res.status(200).json({ status: 'success', data: fences });
  });

  // Get one geofence
  public getGeofenceById = asyncHandler(async (req: Request, res: Response) => {
    const fence = await Geofence.findByPk(req.params.id);
    if (!fence) throw new AppError('Geofence not found', 404);
    res.status(200).json({ status: 'success', data: fence });
  });

  // Update
  public updateGeofence = asyncHandler(async (req: Request, res: Response) => {
    const fence = await Geofence.findByPk(req.params.id);
    if (!fence) throw new AppError('Geofence not found', 404);

    const updated = await fence.update(req.body);
    res.status(200).json({ status: 'success', data: updated });
  });

  // Delete
  public deleteGeofence = asyncHandler(async (req: Request, res: Response) => {
    const fence = await Geofence.findByPk(req.params.id);
    if (!fence) throw new AppError('Geofence not found', 404);

    await fence.destroy();
    res.status(204).send();
  });

}

export default new GeofenceController();
