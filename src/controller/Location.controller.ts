// import { Server, Socket } from 'socket.io';
// import Location from '../database/model/Location.Model';
// import Device from '../database/model/Device.Model';
// import Vehicle from '../database/model/Vechile.Model';

// const pickProps = (body: any) => ({
//   deviceId: body.deviceId || 'unknown_device',
//   latitude: String(body.lat ?? body.latitude),
//   longitude: String(body.lng ?? body.longitude),
//   altitude: body.altitude ? String(body.altitude) : null,
//   speed: body.speed ? String(body.speed) : null,
// });

// export default class LocationController {
//   private static instance: LocationController;
//   public io: Server;

//   private constructor(io: Server) {
//     this.io = io;
//     this.initialize();
//   }

//   public static getInstance(io?: Server): LocationController {
//     if (!LocationController.instance) {
//       if (!io)
//         throw new Error('Socket IO instance is required for initialization');
//       LocationController.instance = new LocationController(io);
//     }
//     return LocationController.instance;
//   }

//   private initialize() {
//     this.io.on('connection', (socket: Socket) => {
//       console.log('Vehicle connected to location service');

//       //! Where used and why?
//       socket.on('joinLocationRoom', (locationId: string) => {
//         socket.join(`location_${locationId}`);
//         // console.log(`Client ${socket.id} joined location_${locationId}`);
//       });

//       //* For user-specific location updates register user
//       socket.on('registerUser', (userId) => {
//         console.log('user registered: ', userId.userId);
//         socket.join(`user_${userId.userId}`);
//       });

//       this.createLocation(socket);
//       this.handleVehicleRoom(socket);
//       this.checkVehicleActive(socket);

//       socket.on('disconnect', () => {
//         console.log('Client disconnected:', socket.id);
//       });
//     });
//   }

//   private createLocation(socket: Socket) {
//     socket.on('location:create', async (payload, callback) => {
//       try {
//         const location = payload;
//         const newLocation = await Location.create(pickProps(location));

//         // Emit only the latest vehicle location to front-end

//         this.io.emit('vehicle_location_updated', newLocation);

//         callback?.({
//           status: 'success',
//           data: newLocation,
//         });
//       } catch (error: any) {
//         callback?.({ status: 'error', message: error.message });
//       }
//     });
//   }

//   private handleVehicleRoom(socket: Socket) {
//     // Join vehicle room
//     socket.on('vehicleRoom:join', async (vehicleId: string, callback) => {
//       const room = `vehicle_${vehicleId}`;
//       socket.join(room);
//       console.log(`Socket ${socket.id} joined ${room}`);

//       // Current occupancy
//       const count = this.io.sockets.adapter.rooms.get(room)?.size || 0;

//       try {
//         // Get vehicle + latest location
//         const vehicles = await Vehicle.findAll({
//           include: [
//             {
//               model: Device,
//               as: 'device',
//               include: [
//                 {
//                   model: Location,
//                   as: 'locations',
//                   limit: 1, // latest location only
//                   order: [['timestamp', 'DESC']],
//                 },
//               ],
//             },
//           ],
//         });

//         // Assuming you want the first vehicle for now
//         const vehicle = vehicles[0];
//         // @ts-ignore
//         const latestLocationRaw = vehicle?.device?.locations?.[0] || null;

//         // Convert coordinates to numbers
//         const latestLocation = latestLocationRaw
//           ? {
//               latitude: Number(latestLocationRaw.latitude),
//               longitude: Number(latestLocationRaw.longitude),
//             }
//           : null;

//         console.log('Latest location:', latestLocation);

//         // Broadcast to room
//         this.io.to(room).emit('vehicle:roomUpdate', {
//           vehicleId,
//           count,
//           location: latestLocation,
//         });

//         callback?.({
//           status: 'success',
//           vehicleId,
//           count,
//           location: latestLocation,
//         });
//       } catch (err) {
//         console.error('Error fetching vehicle/location:', err);
//         callback?.({
//           status: 'error',
//           message: 'Failed to fetch vehicle location',
//         });
//       }
//     });

//     // Leave vehicle room
//     socket.on('vehicleRoom:leave', (vehicleId: string, callback) => {
//       const room = `vehicle_${vehicleId}`;
//       socket.leave(room);
//       console.log(`Socket ${socket.id} left ${room}`);

//       const count = this.io.sockets.adapter.rooms.get(room)?.size || 0;

//       this.io.to(room).emit('vehicle:roomUpdate', { vehicleId, count });
//       callback?.({ status: 'success', vehicleId, count });
//     });
//   }

//   private checkVehicleActive(socket: Socket) {
//     socket.on('vehicle:isActive', async (deviceId: string, callback) => {
//       try {
//         // Find the latest location of the device
//         const latest = await Location.findOne({
//           where: { deviceId },
//           order: [['createdAt', 'DESC']],
//         });
//         callback?.({ status: 'success', data: latest });
//       } catch (error: any) {
//         callback?.({ status: 'error', message: error.message });
//       }
//     });
//   }
// }

import { Server, Socket } from 'socket.io';
import Location from '../database/model/Location.Model';
import Device from '../database/model/Device.Model';
import Vehicle from '../database/model/Vechile.Model';
import Geofence from '../database/model/GeofencesArea';
import getDistanceKm from '../utils/distanceFormula';
import SocketNotificationService from './Notification.controller';
import Notification from '../database/model/Notification.Model';

const pickProps = (body: any) => {
  if (!body.deviceId) {
    throw new Error('deviceId is required and must be a valid UUID');
  }
  return {
    deviceId: body.deviceId,
    latitude: String(body.lat ?? body.latitude),
    longitude: String(body.lng ?? body.longitude),
    altitude: body.altitude ? String(body.altitude) : null,
    speed: body.speed ? String(body.speed) : null,
  };
};

export default class LocationController {
  private static instance: LocationController;
  public io: Server;

  private constructor(io: Server) {
    this.io = io;
    this.initialize();
  }

  public static getInstance(io?: Server): LocationController {
    if (!LocationController.instance) {
      if (!io)
        throw new Error('Socket IO instance is required for initialization');
      LocationController.instance = new LocationController(io);
    }
    return LocationController.instance;
  }

  private initialize() {
    this.io.on('connection', (socket: Socket) => {
      console.log('Vehicle connected to location service');

      socket.on('joinLocationRoom', (locationId: string) => {
        socket.join(`location_${locationId}`);
      });

      socket.on('registerUser', (userId) => {
        console.log('User registered: ', userId.userId);
        socket.join(`user_${userId.userId}`);
      });

      this.createLocation(socket);
      this.handleVehicleRoom(socket);
      this.checkVehicleActive(socket);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  /**
   * 🔹 Handle new location events from vehicles
   */
  private createLocation(socket: Socket) {
    socket.on('location:create', async (payload, callback) => {
      try {
        const location = payload;
        const newLocation = await Location.create(pickProps(location));

        // Emit latest location update globally
        this.io.emit('vehicle_location_updated', newLocation);

        // ✅ Geofence checking for this location
        await this.checkGeofences(newLocation);

        callback?.({
          status: 'success',
          data: newLocation,
        });
      } catch (error: any) {
        callback?.({ status: 'error', message: error.message });
      }
    });
  }

  /**
   * 🔹 Vehicle room handling
   */
  private handleVehicleRoom(socket: Socket) {
    socket.on('vehicleRoom:join', async (vehicleId: string, callback) => {
      const room = `vehicle_${vehicleId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined ${room}`);

      const count = this.io.sockets.adapter.rooms.get(room)?.size || 0;

      try {
        const vehicles = await Vehicle.findAll({
          include: [
            {
              model: Device,
              as: 'device',
              include: [
                {
                  model: Location,
                  as: 'locations',
                  limit: 1,
                  order: [['timestamp', 'DESC']],
                },
              ],
            },
          ],
        });

        const vehicle = vehicles[0];
        // @ts-ignore
        const latestLocationRaw = vehicle?.device?.locations?.[0] || null;

        const latestLocation = latestLocationRaw
          ? {
              latitude: Number(latestLocationRaw.latitude),
              longitude: Number(latestLocationRaw.longitude),
            }
          : null;

        this.io.to(room).emit('vehicle:roomUpdate', {
          vehicleId,
          count,
          location: latestLocation,
        });

        callback?.({
          status: 'success',
          vehicleId,
          count,
          location: latestLocation,
        });
      } catch (err) {
        console.error('Error fetching vehicle/location:', err);
        callback?.({
          status: 'error',
          message: 'Failed to fetch vehicle location',
        });
      }
    });

    socket.on('vehicleRoom:leave', (vehicleId: string, callback) => {
      const room = `vehicle_${vehicleId}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} left ${room}`);

      const count = this.io.sockets.adapter.rooms.get(room)?.size || 0;
      this.io.to(room).emit('vehicle:roomUpdate', { vehicleId, count });

      callback?.({ status: 'success', vehicleId, count });
    });
  }

  /**
   * 🔹 Check if a vehicle/device is active
   */
  private checkVehicleActive(socket: Socket) {
    socket.on('vehicle:isActive', async (deviceId: string, callback) => {
      try {
        const latest = await Location.findOne({
          where: { deviceId },
          order: [['createdAt', 'DESC']],
        });
        callback?.({ status: 'success', data: latest });
      } catch (error: any) {
        callback?.({ status: 'error', message: error.message });
      }
    });
  }

  /**
   * 🔹 Check if vehicle entered or exited geofences
   */
  private async checkGeofences(location: any) {
    const latNum = parseFloat(location.latitude);
    const lonNum = parseFloat(location.longitude);

    const notificationService = SocketNotificationService.getInstance();
    const fences = await Geofence.findAll({ where: { active: true } });
    if (!fences.length) return;

    const device = await Device.findByPk(location.deviceId, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'numberPlate', 'driverId'],
        },
      ],
    });

    // @ts-ignore
    if (!device?.vehicle?.driverId) return;
    // @ts-ignore
    const vehiclePlate = device.vehicle.numberPlate ?? 'Unknown';
    // @ts-ignore
    const userId = device.vehicle.driverId;

    for (const fence of fences) {
      const distance = getDistanceKm(
        latNum,
        lonNum,
        fence.center_lat,
        fence.center_lng
      );
      const inside = distance * 1000 <= fence.radius;
      const type = inside ? 'Entry' : 'Exit';
      const title = `Vehicle ${type} Geofence`;

      const message = inside
        ? `Your vehicle ${vehiclePlate} entered ${fence.name}`
        : `Your vehicle ${vehiclePlate} exited ${fence.name}`;

      // 🚫 Prevent duplicate notifications
      const lastNotification = await Notification.findOne({
        where: { userId, title },
        order: [['createdAt', 'DESC']],
      });

      if (!lastNotification) {
        await notificationService.createNotification(
          String(userId),
          title,
          message
        );
      }
    }
  }
}
