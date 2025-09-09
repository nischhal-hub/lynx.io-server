import { Server, Socket } from 'socket.io';
import Location from '../database/model/Location.Model';

const pickProps = (body: any) => ({
  deviceId: body.deviceId || 'unknown_device',
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

      //! Where used and why?
      socket.on('joinLocationRoom', (locationId: string) => {
        socket.join(`location_${locationId}`);
        // console.log(`Client ${socket.id} joined location_${locationId}`);
      });

      //* For user-specific location updates register user
      socket.on('registerUser', (userId)=>{
        console.log("user registered: ",userId.userId)
        socket.join(`user_${userId.userId}`);
      })

      this.createLocation(socket);

      // this.fetchLocation(socket);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  private createLocation(socket: Socket) {
    socket.on('location:create', async (payload, callback) => {
      try {
        const location = payload;
        const newLocation = await Location.create(pickProps(location));

        // Emit only the latest vehicle location to front-end

          this.io.emit('vehicle_location_updated', newLocation);

        callback?.({
          status: 'success',
          data: newLocation,
        });
      } catch (error: any) {
        callback?.({ status: 'error', message: error.message });
      }
    });
  }


  private checkVehicleActive(socket: Socket) {
    socket.on('vehicle:isActive', async (deviceId: string, callback) => {
      try {
        // Find the latest location of the device
        const latest = await Location.findOne({
          where: { deviceId },
          order: [['createdAt', 'DESC']],
  private fetchLocation(socket: Socket) {
    socket.on('location:readAll', async ( callback) => {
      try {
        const locations = await Location.findAll({
        });

        const isActive =
          latest &&
          new Date().getTime() - new Date(latest.createdAt).getTime() <
            5 * 60 * 1000; // active if updated in last 5 minutes

        callback?.({
          status: 'success',
          isActive,
        });
      } catch (error: any) {
        callback?.({
          status: 'error',
          isActive: false,
          message: error.message,
        });
      }
    });
  }
}
