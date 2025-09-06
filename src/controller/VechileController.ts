import { NextFunction, Request, Response } from 'express';
import asyncHandler from '../utils/AsyncHandler';
import AppError from '../utils/AppError';
import Vehicle from '../database/model/Vechile.Model';
import { Op } from 'sequelize';
import Device from '../database/model/Device.Model';
import { ModelCtor } from 'sequelize-typescript';
import Location from '../database/model/Location.Model';
import ActivityLog from '../database/model/RecentActiviity.Model';

export class VehicleController {
  public registerVehicle = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { numberPlate, model, brand, owner, vehicleType, deviceId } =
        req.body;
      const userId = req.user?.id;

      if (
        !numberPlate ||
        !model ||
        !brand ||
        !owner ||
        !vehicleType ||
        !deviceId
      ) {
        throw new AppError('All fields are required', 400);
      }

      const vehicle = await Vehicle.create({
        numberPlate,
        model,
        brand,
        owner,
        vehicleType,
        driverId: userId,
        deviceId,
      });

      if (vehicle) {
        await ActivityLog.create({
          vehicleId: vehicle.id,
          activity: 'vehicle_registered',
          description: `Vehicle ${vehicle.numberPlate} registered successfully`,
        });
      }

      res.status(201).json({
        status: 'success',
        message: 'Vehicle registered successfully',
        data: vehicle,
      });
    }
  );

  public getAllVehicles = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { page = 1, limit = 20, sortBy = 'createdAt', order = 'DESC' } =
        req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const vehicles = await Vehicle.findAll({
        limit: Number(limit),
        offset,
        order: [[sortBy as string, order as string]],
      });

      res.status(200).json({
        status: 'success',
        message: 'Vehicles retrieved successfully',
        data: vehicles,
      });
    }
  );

  public getVehicleById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const vehicle = await Vehicle.findByPk(req.params.id);

      if (!vehicle) {
        throw new AppError('Vehicle not found', 404);
      }

      res.status(200).json({
        status: 'success',
        message: 'Vehicle retrieved successfully',
        data: vehicle,
      });
    }
  );

  public deleteVehicleById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const vehicleId = req.params.id;

      const deletedCount = await Vehicle.destroy({
        where: { id: vehicleId },
      });

      if (deletedCount === 0) {
        return next(new AppError('Vehicle not found', 404));
      }

      await ActivityLog.create({
        vehicleId: vehicleId,
        activityType: 'vehicle_maintenance',
        description: `Vehicle with ID ${vehicleId} deleted successfully.`,
      });

      res.status(200).json({
        status: 'success',
        message: 'Vehicle deleted successfully',
      });
    }
  );

  public updateVehicleById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const [updatedCount, updatedRows] = await Vehicle.update(req.body, {
        where: { id: req.params.id },
        returning: true,
      });

      if (updatedCount === 0) {
        return next(new AppError('Vehicle not found', 404));
      }

      await ActivityLog.create({
        vehicleId: req.params.id,
        activityType: 'vehicle_maintenance',
        description: `Vehicle with ID ${req.params.id} updated successfully.`,
      });

      res.status(200).json({
        status: 'success',
        message: 'Vehicle updated successfully',
        data: updatedRows[0],
      });
    }
  );

  public getVehicleHistoryByDevice = asyncHandler(
    async (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const { date } = req.query;

      if (!deviceId || !date) {
        return res
          .status(400)
          .json({ message: 'deviceId and date are required' });
      }

      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59`);

      const device = await Device.findByPk(deviceId, {
        include: [
          {
            model: Vehicle as ModelCtor<Vehicle>,
            as: 'vehicle',
          },
          {
            model: Location as ModelCtor<Location>,
            as: 'locations',
            where: {
              createdAt: { [Op.between]: [start, end] },
            },
            required: false,
            order: [['createdAt', 'ASC']],
          },
        ],
      });

      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      res.status(200).json({
        vehicle: (device as any).vehicle,
        locations: (device as any).locations,
      });
    }
  );

  public searchVehicles = asyncHandler(
    async (req: Request, res: Response) => {
      const { query } = req.query;
      if (!query) {
        return res
          .status(400)
          .json({ message: 'Search query parameter is required' });
      }

      const vehicles = await Vehicle.findAll({
        where: {
          [Op.or]: [
            { numberPlate: { [Op.like]: `%${query}%` } },
            { model: { [Op.like]: `%${query}%` } },
            { brand: { [Op.like]: `%${query}%` } },
            { owner: { [Op.like]: `%${query}%` } },
          ],
        },
      });

      res.status(200).json({
        status: 'success',
        message: `Vehicles matching "${query}" retrieved`,
        data: vehicles,
      });
    }
  );

  public getVehiclesByType = asyncHandler(
    async (req: Request, res: Response) => {
      const { type } = req.params;
      const vehicles = await Vehicle.findAll({ where: { vehicleType: type } });

      res.status(200).json({
        status: 'success',
        message: `Vehicles of type ${type} retrieved successfully`,
        data: vehicles,
      });
    }
  );

  public bulkRegisterVehicles = asyncHandler(
    async (req: Request, res: Response) => {
      const { vehicles } = req.body;
      if (!Array.isArray(vehicles) || vehicles.length === 0) {
        return res.status(400).json({ message: 'No vehicles provided' });
      }

      const createdVehicles = [];
      for (const vehicleData of vehicles) {
        const vehicle = await Vehicle.create(vehicleData);
        createdVehicles.push(vehicle);

        await ActivityLog.create({
          vehicleId: vehicle.id,
          activityType: 'vehicle_registered',
          description: `Vehicle ${vehicle.numberPlate} registered in bulk`,
        });
      }

      res.status(201).json({
        status: 'success',
        message: 'Bulk vehicles registered successfully',
        data: createdVehicles,
      });
    }
  );

  private async logVehicleActivity(
    vehicleId: string,
    activityType: string,
    description: string
  ) {
    await ActivityLog.create({ vehicleId, activityType, description });
  }

  public notifyMaintenanceDue = asyncHandler(async () => {
    const vehicles = await Vehicle.findAll({
      where: { maintenanceDue: true },
    });

    for (const vehicle of vehicles) {
      await this.logVehicleActivity(
        vehicle.id,
        'maintenance_due',
        `Maintenance due notification sent for vehicle ${vehicle.numberPlate}`
      );
      console.log(`Maintenance notification for vehicle ${vehicle.numberPlate}`);
    }
  });
}

export default new VehicleController();
