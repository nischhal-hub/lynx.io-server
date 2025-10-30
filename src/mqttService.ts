import mqtt from 'mqtt';
import Location from './database/model/Location.Model';
import LocationController from './controller/Location.controller';
import Device from './database/model/Device.Model';
import User from './database/model/user.Model';
import Vehicle from './database/model/Vechile.Model';

const MQTT_URL = process.env.MQTT_URL || 'mqtt://broker.emqx.io:1883';
const client = mqtt.connect(MQTT_URL, {
  clientId: 'backend-server-' + Math.random().toString(16).slice(2),
  clean: true,
});

client.on('connect', () => {
  console.log('✅ MQTT connected');
  client.subscribe('esp32/loc', (err) => {
    if (!err) console.log('📡 Subscribed to topic: esp32/loc');
    else console.error('❌ MQTT subscribe error:', err);
  });
});

client.on('message', async (topic, message) => {
  const msgString = message.toString();
  try {
    const payload = JSON.parse(msgString);

    const location = await Location.create({
      deviceId: payload.deviceId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      altitude: payload.altitude,
      speed: payload.speed,
      timestamp: new Date(),
    });

    // console.log("Location saved:", location.toJSON());
    const device = await Device.findByPk(payload.deviceId, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          include: [
            {
              model: User,
              as: 'driver',
            },
          ],
        },
      ],
    });

    const deviceJson = device?.toJSON();
    if (!deviceJson || !deviceJson.vehicle || !deviceJson.vehicle.driver) {
      console.log(
        'No associated vehicle or driver found for device:',
        payload.deviceId
      );
      return;
    }
    const userId = deviceJson.vehicle.driver.id;
    // console.log("Emitting location to user:", userId);
    const locationController = LocationController.getInstance();
    locationController.io
      .to(`user_${userId}`)
      .emit('vehicle_location_updated', location.toJSON());
  } catch (err) {
    console.error('❌ Error processing MQTT message:', err);
  }
});

export default client;

//     device: {
//   id: '2f95439e-2218-4bfd-acd6-66f516dbad4d',
//   deviceName: 'Device-1',
//   status: 'Active',
//   createdAt: 2025-09-07T02:43:45.214Z,
//   updatedAt: 2025-09-07T02:43:45.214Z,
//   vehicle: {
//     id: 'a3ac805a-a3ac-405c-a7d0-20c0aee23171',
//     numberPlate: 'BA-1-2345',
//     model: 'Camry',
//     brand: 'Toyota',
//     owner: 'John Doe',
//     vehicleType: 'four-wheeler',
//     createdAt: 2025-09-07T03:08:13.970Z,
//     updatedAt: 2025-09-07T03:08:13.970Z,
//     driverId: 2,
//     deviceId: '2f95439e-2218-4bfd-acd6-66f516dbad4d',
//     driver: {
//       id: 2,
//       firstName: 'John',
//       lastName: 'Doe',
//       email: 'nischal@gmail.com',
//       password: '$2b$10$Khh0dGFLFQQgMMPkRLMIcOQeEQJIQOhfDyA03sR5JjiC3Y92CEjHe',
//       roles: 'user',
//       address: '123 Main Street, City, Country',
//       phoneNumber: '+9779841234567',
//       profilePicture: null,
//       expoPushToken: null,
//       refreshToken: null,
//       otp: null,
//       otpGeneratedTime: null,
//       googleId: null,
//       authProvider: 'local',
//       isEmailVerified: false,
//       createdAt: 2025-09-07T02:51:49.482Z,
//       updatedAt: 2025-09-07T02:51:49.482Z
//     }
//   }
// }
