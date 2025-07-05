import { Request, Response } from 'express';
import AppError from '../utils/AppError';
import Vehicle from '../database/model/Vechile.Model';
import Route from '../database/model/Routes.Model';
import asyncHandler from '../utils/AsyncHandler';
class RouteController {
  public createRoute = asyncHandler(async (req: Request, res: Response) => {
    const {
      vehicleId,
      startLocation,
      endLocation,
      status,
      estimatedDuration,
      distance,
      intermediateLocation,
    } = req.body;

    if (!vehicleId || !startLocation || !endLocation) {
      throw new AppError(
        'vehicleId, startLocation and endLocation are required',
        400
      );
    }

    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) throw new AppError('Vehicle not found', 404);

    const route = await Route.create({
      start_location: startLocation,
      end_location: endLocation,
      status,
      vehicleId,
      intermediate_locations: intermediateLocation,
      distance,
      estimated_duration: estimatedDuration,
    });
    res.status(201).json({ status: 'success', data: route });
  });

  public getAllRoutes = asyncHandler(async (_req, res) => {
    const routes = await Route.findAll({
      order: [['createdAt', 'DESC']],
      include: [{ model: Vehicle, as: 'vehicle' }],
    });
    res
      .status(200)
      .json({ status: 'success', results: routes.length, data: routes });
  });

  public getRouteById = asyncHandler(async (req, res) => {
    const route = await Route.findByPk(req.params.id, { include: ['vehicle'] });
    if (!route) throw new AppError('Route not found', 404);
    res.status(200).json({ status: 'success', data: route });
  });

  public updateRoute = asyncHandler(async (req, res) => {
    const route = await Route.findByPk(req.params.id);
    if (!route) throw new AppError('Route not found', 404);

    const allowed = [
      'startLocation',
      'endLocation',
      'intermediateLocations',
      'distance',
      'estimatedDuration',
      'status',
      'startedAt',
      'completedAt',
    ] as const;

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        // @ts-ignore
        route[key] = req.body[key];
      }
    }
    await route.save();
    res.status(200).json({ status: 'success', data: route });
  });

  public deleteRoute = asyncHandler(async (req, res) => {
    const deleted = await Route.destroy({ where: { id: req.params.id } });
    if (!deleted) throw new AppError('Route not found', 404);
    res.status(204).send();
  });

  public getRoutesByVehicle = asyncHandler(async (req, res) => {
    const routes = await Route.findAll({
      where: { vehicleId: req.params.vehicleId },
      order: [['createdAt', 'DESC']],
    });
    res
      .status(200)
      .json({ status: 'success', results: routes.length, data: routes });
  });
}

export default new RouteController();
