import { NextFunction, Request, Response } from 'express';
import asyncHandler from '../utils/AsyncHandler';
import AppError from '../utils/AppError';
import Vehicle from '../database/model/Vechile.Model';
import { Op } from 'sequelize';
import Device from '../database/model/Device.Model';
import { ModelCtor } from 'sequelize-typescript';
import Location from '../database/model/Location.Model';

export class VehicleController {
  // Create/Register Vehicle
  public registerVehicle = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { numberPlate, model, brand, owner, vehicleType,deviceId } = req.body;
      const userId = req.user?.id;
      if (!numberPlate || !model || !brand || !owner || !vehicleType||!deviceId) {
        throw new AppError('All fields are required', 400);
      }

      const vehicle = await Vehicle.create({
        numberPlate,
        model,
        brand,
        owner,
        vehicleType,
        driverId: userId,
        deviceId
      });

      res.status(201).json({
        status: 'success',
        message: 'Vehicle registered successfully',
        data: vehicle,
      });
    }
  );

  public getAllVehicles = asyncHandler(
    async (_req: Request, res: Response, _next: NextFunction) => {
      const vehicles = await Vehicle.findAll();

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
      const deletedCount = await Vehicle.destroy({
        where: { id: req.params.id },
      });

      if (deletedCount === 0) {
        throw new AppError('Vehicle not found', 404);
      }

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
        throw new AppError('Vehicle not found', 404);
      }

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
            required: false, // allow empty locations
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
}

export default new VehicleController();
