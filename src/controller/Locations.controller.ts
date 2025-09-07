import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/AsyncHandler";
import AppError from "../utils/AppError";
import Location from "../database/model/Location.Model"; // Vehicle locations
import SocketService from "../Socket";
import db from "../database/connection";

let socketService: SocketService;

export function initSocketService(server: any) {
  socketService = SocketService.initSocketService(server);
}

const pickProps = (body: any) => ({
  deviceId: body.deviceId,
  latitude: String(body.lat ?? body.latitude),
  longitude: String(body.lng ?? body.longitude),
  altitude: body.altitude ? String(body.altitude) : null,
  speed: body.speed ? String(body.speed) : null,
  timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
});

class LocationController {
  // Create new vehicle locations (bulk)
  public createLocation = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const location = req.body;

      const newLocation = await Location.create(pickProps(location));

      // Emit only the latest vehicle location to front-end
      if (socketService && newLocation) {
        socketService.io.emit("vehicle_location_updated", newLocation.toJSON());
      }

      res.status(201).json({
        status: "success",
        data: newLocation,
      });
    }
  );

  // Get all vehicle locations
  public getAllLocations = asyncHandler(
    async (_req: Request, res: Response) => {
      const [locations] = await db.sequelize.query(`
       SELECT *
       FROM locations
       WHERE "timestamp" > NOW() - interval '1 hour'
       ORDER BY "timestamp";
        `);

        res.status(200).json({
          status: 'success',
          message: 'Fetched locations from last 1 hour',
          results: locations.length,
          data: locations,
        });

      // const locations = await sequelize.
      // res.status(200).json({
      //   status: 'success',
      //   results: locations.length,
      //   data: locations,
      // });
    }
  );

  // Get latest vehicle location
  // public getLatestLocation = asyncHandler(
  //   async (_req: Request, res: Response) => {
  //     const latest = await Location.findOne({ order: [["createdAt", "DESC"]] });
  //     if (!latest) throw new AppError("No vehicle location data yet", 404);

  //     res.status(200).json({ status: "success", data: latest });
  //   }
  // );

  // Get vehicle location by ID
  // public getLocationById = asyncHandler(async (req: Request, res: Response) => {
  //   const location = await Location.findByPk(req.params.id);
  //   if (!location) throw new AppError('Vehicle location not found', 404);

  //   res.status(200).json({ status: "success", data: location });
  // });
public getLocationById = asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;

      const query = `
        SELECT *
        FROM locations
        WHERE id = $1
      `;

      const [locations] = await db.sequelize.query(query, {
        bind: [id],
      });

      if (!locations || (locations as any[]).length === 0) {
        throw new AppError("Vehicle location not found", 404);
      }

      res.status(200).json({ 
        status: "success", 
        data: (locations as any[])[0] 
      });
    }
  );
  // Update vehicle location
  public updateLocation = asyncHandler(async (req: Request, res: Response) => {
    const location = await Location.findByPk(req.params.id);
    if (!location) throw new AppError("Vehicle location not found", 404);

    const updatedLocation = await location.update(pickProps(req.body));

    if (socketService) {
      socketService.io.emit(
        "vehicle_location_updated",
        updatedLocation.toJSON()
      );
    }

    res.status(200).json({ status: "success", data: updatedLocation });
  });

  // Delete vehicle location
  public deleteLocation = asyncHandler(async (req: Request, res: Response) => {
    const location = await Location.findByPk(req.params.id);
    if (!location) throw new AppError("Vehicle location not found", 404);

    await location.destroy();

    if (socketService) {
      socketService.io.emit("vehicle_location_deleted", req.params.id);
    }

    res.status(204).send();
  });
}

export default new LocationController();
