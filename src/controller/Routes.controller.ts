import { Request, Response } from 'express';
import AppError from '../utils/AppError';
import Vehicle from '../database/model/Vechile.Model';
import Route from '../database/model/Routes.Model';
import asyncHandler from '../utils/AsyncHandler';
import User from '../database/model/user.Model';
class RouteController {
  public createRoute = asyncHandler(async (req: Request, res: Response) => {
    const routes: any[] = req.body;

    if (!Array.isArray(routes) || routes.length === 0) {
      throw new AppError('An array of route objects is required', 400);
    }

    // Validate all vehicle IDs
    const vehicleIds = routes.map((r) => r.vehicleId);
    const existingVehicles = await Vehicle.findAll({
      where: { id: vehicleIds },
      attributes: ['id'],
    });
    const existingVehicleIds = existingVehicles.map((v) => v.id);

    // Throw error if any invalid vehicle
    for (const r of routes) {
      if (!r.vehicleId || !r.startLocation || !r.endLocation) {
        throw new AppError(
          'vehicleId, startLocation and endLocation are required',
          400
        );
      }
      if (!existingVehicleIds.includes(r.vehicleId)) {
        throw new AppError(`Vehicle with ID ${r.vehicleId} not found`, 404);
      }
    }

    const newRoutes = routes.map((r) => ({
      start_location: r.startLocation,
      end_location: r.endLocation,
      status: r.status ?? 'pending',
      vehicleId: r.vehicleId,
      intermediate_locations: r.intermediateLocation ?? [],
      distance: r.distance ?? null,
      estimated_duration: r.estimatedDuration ?? null,
    }));

    try {
      const createdRoutes = await Route.bulkCreate(newRoutes);
      res.status(201).json({
        status: 'success',
        results: createdRoutes.length,
        data: createdRoutes,
      });
    } catch (err: any) {
      console.error('Bulk insert failed:', err);
      throw new AppError(`DB Insert failed: ${err.message}`, 500);
    }
  });

  public getAllRoutes = asyncHandler(async (_req, res) => {
    const routes = await Route.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          include: [
            {
              model: User,
              as: 'driver',
              attributes: [
                'id',
                'firstName',
                'lastName',
                'email',
                'phoneNumber',
              ],
            },
          ],
        },
      ],
    });

    // Transform raw DB response into front-end-friendly structure
    const transformedRoutes = routes.map((route) => {
      // @ts-expect-error
      const vehicle = route.vehicle;
      const driver = vehicle?.driver;

      return {
        id: route.id,
        routeName: route.routeName,
        // @ts-expect-error
        vehicleId: vehicle?.numberPlate || route.vehicleId, // or route.vehicleId if plate missing
        vehicleName: vehicle?.brand || 'Unknown Vehicle',
        start_location: route.start_location,
        end_location: route.end_location,
        intermediate_locations: route.intermediate_locations || [],
        // @ts-expect-error
        distance: parseFloat(route.distance),
        estimated_duration: route.estimated_duration
          ? route.estimated_duration.replace('PT', '').toLowerCase()
          : null,
        status: route.status,
        currentLocation: route.started_at
          ? route.start_location
          : route.start_location, // or you can calculate dynamically
        driverName: driver
          ? `${driver.firstName} ${driver.lastName}`
          : 'Unknown',
        driverPhone: driver?.phoneNumber,
        plateNumber: vehicle?.numberPlate || 'N/A',
      };
    });

    res.status(200).json({
      status: 'success',
      results: transformedRoutes.length,
      data: transformedRoutes,
    });
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
      'routeName',
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
