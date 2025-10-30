import { NextFunction, Request, Response } from 'express';
import asyncHandler from '../utils/AsyncHandler';
import AppError from '../utils/AppError';
import Vehicle from '../database/model/Vechile.Model';
import { Op, UniqueConstraintError } from 'sequelize';
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

      try {
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
            activityType: 'vehicle_registered',
            description: `Vehicle ${vehicle.numberPlate} registered successfully`,
          });
        }

        res.status(201).json({
          status: 'success',
          message: 'Vehicle registered successfully',
          data: vehicle,
        });
      } catch (error: any) {
        // 🔥 Handle duplicate deviceId
        if (error instanceof UniqueConstraintError) {
          return next(
            new AppError(
              'This device is already assigned to another vehicle',
              400
            )
          );
        }

        return next(error); // Pass other errors to global error handler
      }
    }
  );

  public getAllVehicles = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      console.log('Vehicle read', req.user?.id);
      const vehicles = await Vehicle.findAll({
        where: {
          driverId: req.user?.id,
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Vehicles retrieved successfully',
        data: vehicles,
      });
    }
  );
  public getAllVehiclesByUser = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
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
      const vehicleId = req.params.id;

      const deletedCount = await Vehicle.destroy({
        where: { id: vehicleId },
      });

      if (deletedCount === 0) {
        return next(new AppError('Vehicle not found', 404));
      }

      // Log the deletion activity
      await ActivityLog.create({
        vehicleId: vehicleId,
        activityType: 'vehicle_removed', // choose the proper enum value
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

      // ✅ Create recent activity log
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

  // public getVehicleHistoryByDevice = asyncHandler(
  //   async (req: Request, res: Response) => {
  //     const { deviceId } = req.params;
  //     const { date } = req.query;

  //     if (!deviceId || !date) {
  //       return res
  //         .status(400)
  //         .json({ message: 'deviceId and date are required' });
  //     }

  //     const start = new Date(`${date}T00:00:00`);
  //     const end = new Date(`${date}T23:59:59`);

  //     const device = await Device.findByPk(deviceId, {
  //       include: [
  //         {
  //           model: Vehicle as ModelCtor<Vehicle>,
  //           as: 'vehicle',
  //         },
  //         {
  //           model: Location as ModelCtor<Location>,
  //           as: 'locations',
  //           where: {
  //             createdAt: { [Op.between]: [start, end] },
  //           },
  //           required: false, // allow empty locations
  //           order: [['createdAt', 'ASC']],
  //         },
  //       ],
  //     });

  //     if (!device) {
  //       return res.status(404).json({ message: 'Device not found' });
  //     }

  //     res.status(200).json({
  //       status: 'success',
  //       message: 'History retrieved successfully',
  //       data: (device as any).locations,
  //     });
  //   }
  // );

  public getVehicleHistoryByDevice = asyncHandler(
    async (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const { date } = req.query;
      console.log('hisklsjgjsl');

      // Validate inputs
      if (!deviceId || !date) {
        return res
          .status(400)
          .json({ message: 'deviceId and date are required' });
      }

      // if (!isUUID(deviceId)) {
      //   return res.status(400).json({ message: 'Invalid deviceId format' });
      // }

      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59`);

      try {
        const device = await Device.findByPk(deviceId, {
          include: [
            { model: Vehicle as ModelCtor<Vehicle>, as: 'vehicle' },
            {
              model: Location as ModelCtor<Location>,
              as: 'locations',
              where: {
                timestamp: { [Op.between]: [start, end] }, // ✅ Use timestamp
              },
              required: false, // allow devices with no locations
            },
          ],
          order: [[{ model: Location, as: 'locations' }, 'timestamp', 'ASC']],
        });

        if (!device) {
          return res.status(404).json({ message: 'Device not found' });
        }

        res.status(200).json({
          status: 'success',
          message: 'History retrieved successfully',
          results: (device as any).locations.length,
          data: (device as any).locations,
        });
      } catch (error: any) {
        console.error('Error fetching vehicle history:', error);
        res.status(500).json({
          status: 'error',
          message: 'Failed to retrieve vehicle history',
        });
      }
    }
  );
}

export default new VehicleController();
function isUUID(deviceId: string) {
  throw new Error('Function not implemented.');
}
