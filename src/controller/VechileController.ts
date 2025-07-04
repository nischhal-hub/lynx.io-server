import { NextFunction, Request, Response } from 'express';
import asyncHandler from '../utils/AsyncHandler';
import AppError from '../utils/AppError';
import Vehicle from '../database/model/Vechile.Model';

export class VehicleController {
  // Create/Register Vehicle
  public registerVehicle = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const {numberPlate, model, brand, owner, vehicleType } = req.body;
  const userId=req.user?.id
      if (!numberPlate || !model || !brand || !owner || !vehicleType) {
        throw new AppError('All fields are required', 400);
      }

      const vehicle = await Vehicle.create({
        numberPlate,
        model,
        brand,
        owner,
        vehicleType,
        driverId:userId
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
}

export default new VehicleController();