import Location from '../database/model/Location.Model';
import Device from '../database/model/Device.Model';
import Vehicle from '../database/model/Vechile.Model';
import Geofence from '../database/model/GeofencesArea';
import getDistanceKm from '../utils/distanceFormula';
import SocketNotificationService from './Notification.controller';
import SocketService from '../Socket';

let socketService: SocketService;

export function initSocketService(server: any) {
  socketService = SocketService.initSocketService(server);
}

async function getAllOnlineUsers() {
  // Replace this with your actual online users tracking
  return [
    { id: 'user1', name: 'Alice' },
    { id: 'user2', name: 'Bob' },
  ];
}

class LocationController {
  // Create new vehicle locations (bulk)
  public createLocation = async (req: any, res: any, next: any) => {
    console.log("jdshdfjhjsdhfkjdshfkjhskhkshfkhskhfsh");
    const locations = req.body;
    if (!Array.isArray(locations) || locations.length === 0) {
      return next(new Error('Array of location objects is required'));
    }

    const newLocations = await Location.bulkCreate(
      locations.map((loc) => ({
        deviceId: loc.deviceId,
        latitude: loc.latitude,
        longitude: loc.longitude,
        speed: loc.speed,
      }))
    );

    if (socketService && newLocations.length > 0) {
      const latest = newLocations[newLocations.length - 1];
      socketService.io.emit('vehicle_location_updated', latest.toJSON());

      // Call geofence check & push notifications
      await this.checkGeofences(latest);
    }

    res.status(201).json({ status: 'success', results: newLocations.length, data: newLocations });
  };

  private async checkGeofences(location: Location) {
    console.log("location",location);
    const fences = await Geofence.findAll();
    if (!fences.length) return;
    

    // Get vehicleId from Device → Vehicle
    const device = await Device.findByPk(location.deviceId, {
      include: [{ model: Vehicle, as: 'vehicle', attributes: ['id', 'numberPlate'] }],
    });

    console.log("device",device);
 


    // @ts-expect-error
    const vehicleId = device?.vehicle?.id ?? location.deviceId;
    // @ts-expect-error
    const vehiclePlate = device?.vehicle?.numberPlate ?? 'Unknown';
    console.log("vehiclePlate",vehiclePlate);
    console.log("vehicleId",vehicleId);

    const lat = parseFloat(location.latitude);
    const lon = parseFloat(location.longitude);

    const notificationService = SocketNotificationService.getInstance();

    // Fetch online users
    const onlineUsers = await getAllOnlineUsers();
    console.log("onineessdfdsf",onlineUsers);

    for (const fence of fences) {
      const distance = getDistanceKm(lat, lon, fence.center_lat, fence.center_lng);
      const inside = distance * 1000 <= fence.radius; // km → meters

      if (inside && (fence.trigger === 'entry' || fence.trigger === 'both')) {
        // Send notification to online users
        for (const user of onlineUsers) {
          await notificationService.createNotification(
            user.id,
            'Vehicle Entered Geofence',
            `Vehicle ${vehiclePlate} entered ${fence.name}`
          );
        }

        // Push via socket
        socketService.io.emit('geofence_alert', {
          vehicleId,
          type: 'entry',
          message: `Vehicle ${vehiclePlate} entered ${fence.name}`,
        });
      }

      if (!inside && (fence.trigger === 'exit' || fence.trigger === 'both')) {
        for (const user of onlineUsers) {
          await notificationService.createNotification(
            user.id,
            'Vehicle Exited Geofence',
            `Vehicle ${vehiclePlate} exited ${fence.name}`
          );
        }

        socketService.io.emit('geofence_alert', {
          vehicleId,
          type: 'exit',
          message: `Vehicle ${vehiclePlate} exited ${fence.name}`,
        });
      }
    }
  }
}

export default new LocationController();
