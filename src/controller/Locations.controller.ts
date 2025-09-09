import Location from '../database/model/Location.Model';
import Device from '../database/model/Device.Model';
import Vehicle from '../database/model/Vechile.Model';
import Geofence from '../database/model/GeofencesArea';
import getDistanceKm from '../utils/distanceFormula';
import SocketNotificationService from './Notification.controller';
import SocketService from '../Socket';
import Notification from '../database/model/Notification.Model';

let socketService: SocketService;

export function initSocketService(server: any) {
  socketService = SocketService.initSocketService(server);
}

class LocationController {
  public createLocation = async (req: any, res: any, next: any) => {
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

    const latest = newLocations[newLocations.length - 1];

    // if (socketService?.io) {
    //   socketService.io.emit('vehicle_location_updated', latest.toJSON());
    // }

    // Check geofences & send notifications
    await this.checkGeofences(latest);

    res.status(201).json({
      status: 'success',
      results: newLocations.length,
      data: newLocations,
    });
  };

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

      // Send only once per event
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

export default new LocationController();
