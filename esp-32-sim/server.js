import express from "express";
import path from "path";
import axios from "axios";

const app = express();
const PORT = 4000;
const BACKEND_API = "http://192.168.1.80:3000/api/v1/location";

app.use(express.json());
app.use(express.static("public")); // serve UI files from /public

// Store simulations in memory
let simulations = {};

function generateFakeGPS(start, end, deviceId) {
  const lat = start.lat + (Math.random() * (end.lat - start.lat));
  const lng = start.lng + (Math.random() * (end.lng - start.lng));
  const speed = (Math.random() * 60).toFixed(2);
  return { lat, lng, speed: parseFloat(speed),deviceId };
}

async function sendBatch(batch) {
  try {
    const response = await axios.post(BACKEND_API, batch );
    console.log(`✅ Uploaded for ${deviceId}:`, response.data);
  } catch (error) {
    console.error(`❌ Upload failed `, error.response?.data || error.message);
  }
}

// Start simulation
app.post("/start", (req, res) => {
  const { deviceIds, startLocation, endLocation } = req.body;

  deviceIds.forEach((id) => {
    let buffer = [];

    // generate GPS
    const gpsInterval = setInterval(() => {
      const gpsPoint = generateFakeGPS(startLocation, endLocation, id);
      buffer.push(gpsPoint);
      console.log(`Generated [${id}]`, gpsPoint);
    }, 2000);

    // send batch
    const batchInterval = setInterval(() => {
      if (buffer.length > 0) {
        const batch = [...buffer];
        console.log(batch);
        buffer = [];
        sendBatch( batch);
      }
    }, 6000);

    simulations[id] = { gpsInterval, batchInterval };
  });

  res.json({ message: "Simulation started", devices: deviceIds });
});

// Stop simulation
app.post("/stop", (req, res) => {
  const { deviceIds } = req.body;
  deviceIds.forEach((id) => {
    if (simulations[id]) {
      clearInterval(simulations[id].gpsInterval);
      clearInterval(simulations[id].batchInterval);
      delete simulations[id];
      console.log(`🛑 Stopped simulation for ${id}`);
    }
  });
  res.json({ message: "Simulation stopped", devices: deviceIds });
});

app.listen(PORT, () => {
  console.log(`🚀 Simulator UI running at http://localhost:${PORT}`);
});
