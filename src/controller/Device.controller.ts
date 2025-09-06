// src/controller/deviceController.ts
import { Request, Response, NextFunction } from 'express';

import AppError from '../utils/AppError';
import asyncHandler from '../utils/AsyncHandler';
import Device from '../database/model/Device.Model';

class DeviceController {
  public registerDevice = asyncHandler(async (req: Request, res: Response) => {
    const { deviceName, status } = req.body;
  if (!deviceName || !status) throw new AppError('deviceName is required', 400);

    const device = await Device.create({ deviceName, status });
    res.status(201).json({ status: 'true', data: device });
  });

  public getAllDevices = asyncHandler(async (_req, res) => {
    const devices = await Device.findAll({ order: [['createdAt', 'DESC']]}
      
    );
    res
      .status(200)
      .json({ status: 'true', results: devices.length, data: devices });
  });

  public getDeviceById = asyncHandler(async (req, res) => {
    const device = await Device.findByPk(req.params.id);
    if (!device) throw new AppError('Device not found', 404);

    res.status(200).json({ status: 'true', data: device });
  });

  public updateDevice = asyncHandler(async (req, res) => {
    const device = await Device.findByPk(req.params.id);
    if (!device) throw new AppError('Device not found', 404);

    const { deviceName, status } = req.body;
    if (deviceName) device.deviceName = deviceName;
    if (status) device.status = status;
    await device.save();

    res.status(200).json({ status: 'true', data: device });
  });

  public deleteDevice = asyncHandler(async (req, res) => {
    const deleted = await Device.destroy({ where: { id: req.params.id } });
    if (!deleted) throw new AppError('Device not found', 404);

    res.status(204).send();
  });

}

export default new DeviceController();
