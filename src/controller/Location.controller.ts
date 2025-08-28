import { Server, Socket } from 'socket.io';
import Location from '../database/model/Location.Model';

const pickProps = (body: any) => ({
  deviceId: body.deviceId,
  latitude: String(body.lat ?? body.latitude),
  longitude: String(body.lng ?? body.longitude),
  altitude: body.altitude ? String(body.altitude) : null,
  speed: body.speed ? String(body.speed) : null,
});

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
        console.log(`Client ${socket.id} joined location_${locationId}`);
      });

      // register the createLocation listener
      this.createLocation(socket);

      this.fetchLocation(socket);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  private createLocation(socket: Socket) {
    socket.on('location:create', async (payload, callback) => {
      try {
        if (typeof payload === 'string') payload = JSON.parse(payload);
        if (!Array.isArray(payload) || payload.length === 0) {
          throw new Error('Array of location objects is required');
        }

        const formattedLocations = payload.map((loc) => pickProps(loc));
        const newLocations = await Location.bulkCreate(formattedLocations);

        // Emit only the latest vehicle location to front-end
        if (newLocations.length > 0) {
          const latest = newLocations[newLocations.length - 1];
          this.io.emit('vehicle_location_updated', latest.toJSON());
        }

        callback?.({
          status: 'success',
          results: newLocations.length,
          data: newLocations,
        });
      } catch (error: any) {
        callback?.({ status: 'error', message: error.message });
      }
    });
  }

  private fetchLocation(socket: Socket) {
    socket.on('location:readAll', async (userId: number, callback) => {
      try {
        const locations = await Location.findAll({
          where: { userId: userId },
          order: [['createdAt', 'DESC']],
        });
        callback?.({ status: 'success', data: locations });
      } catch (error: any) {
        callback?.({ status: 'error', message: error.message });
      }
    });
  }
}
