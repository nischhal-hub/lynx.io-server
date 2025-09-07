import mqtt from "mqtt";
import Location from "./database/model/Location.Model";
import LocationController from "./controller/Location.controller";
import Device from "./database/model/Device.Model";
import User from "./database/model/user.Model";

const MQTT_URL = process.env.MQTT_URL || "mqtt://broker.emqx.io:1883";
const client = mqtt.connect(MQTT_URL, {
  clientId: "backend-server-" + Math.random().toString(16).slice(2),
  clean: true,
});

client.on("connect", () => {
  console.log("✅ MQTT connected");
  client.subscribe("esp32/loc", (err) => {
    if (!err) console.log("📡 Subscribed to topic: esp32/loc");
    else console.error("❌ MQTT subscribe error:", err);
  });
});

client.on("message", async (topic, message) => {
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

    console.log("📌 Location saved:", location.toJSON());
    const deviceId = await Device.findByPk(payload.deviceId,{include: [User]});

    const locationController = LocationController.getInstance();
    locationController.io.to().emit('vehicle_location_updated', location.toJSON());
    // You can also emit to a room if you have location-specific rooms:
    // locationController.io.to(`location_${payload.deviceId}`).emit(...);

  } catch (err) {
    console.error("❌ Error processing MQTT message:", err);
  }
});

export default client;
