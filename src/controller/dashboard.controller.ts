import { Request, Response } from 'express';
import asyncHandler from '../utils/AsyncHandler';
import User from '../database/model/user.Model';
import Vehicle from '../database/model/Vechile.Model';
import Device from '../database/model/Device.Model';
import Route from '../database/model/Routes.Model';

class DashboardController {
  public getDashboardOverview = asyncHandler(
    async (_req: Request, res: Response) => {
      // Users
      const totalUsers = await User.count();
      const activeUsers = await User.count({
        where: { isEmailVerified: true },
      });

      // Vehicles
      const totalVehicles = await Vehicle.count();
      const twoWheelers = await Vehicle.count({
        where: { vehicleType: 'two-wheeler' },
      });
      const fourWheelers = await Vehicle.count({
        where: { vehicleType: 'four-wheeler' },
      });
      const activeVehicles = await Vehicle.count({
        where: { status: 'Active' },
      });
      const maintenanceVehicles = await Vehicle.count({
        where: { status: 'Maintenance' },
      });
      const availableVehicles = await Vehicle.count({
        where: { status: 'Available' },
      });

      // Devices
      const totalDevices = await Device.count();
      const activeDevices = await Device.count({ where: { status: 'Active' } });
      const inactiveDevices = await Device.count({
        where: { status: 'Inactive' },
      });

      // Routes
      const totalRoutes = await Route.count();
      const inProgressRoutes = await Route.count({
        where: { status: 'in_progress' },
      });
      const completedRoutes = await Route.count({
        where: { status: 'completed' },
      });

      // Random Revenue
      const randomRevenue = Math.floor(Math.random() * 100000); // Rs 0 - 1,00,000

      // Response
      res.status(200).json({
        status: 'success',
        data: {
          users: {
            total: totalUsers,
            active: activeUsers,
          },
          vehicles: {
            total: totalVehicles,
            active: activeVehicles,
            maintenance: maintenanceVehicles,
            available: availableVehicles,
            twoWheelers,
            fourWheelers,
          },
          devices: {
            total: totalDevices,
            active: activeDevices,
            inactive: inactiveDevices,
          },
          routes: {
            total: totalRoutes,
            inProgress: inProgressRoutes,
            completed: completedRoutes,
          },
          revenue: `Rs ${randomRevenue.toLocaleString()}`,
        },
      });
    }
  );
}

export default new DashboardController();
