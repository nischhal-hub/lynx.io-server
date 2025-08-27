import axios from 'axios';

const BACKEND_API = "http://192.168.1.80:3000/api/v1/location";


// Generate fake GPS points
function generateFakeGPS() {
  const latitude = 27.7172 + (Math.random() * 0.01); // Kathmandu area
  const longitude = 85.3240 + (Math.random() * 0.01);
  const speed = (Math.random() * 60).toFixed(2); // 0–60 km/h

  return { latitude, longitude, speed: parseFloat(speed) };
}

async function sendBatch(batch) {
  try {
    const response = await axios.post(BACKEND_API, batch, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    console.log("✅ Uploaded:", response.data);
  } catch (error) {
    console.error("❌ Upload failed:", error.response?.data || error.message);
  }
}

// Main simulation
async function main() {
//   let buffer = [];

  setInterval(async () => {
    const gpsPoint = generateFakeGPS();
    // buffer.push(gpsPoint);
    await sendBatch(gpsPoint);
    console.log("Generated: ", gpsPoint);
  }, 5000);

//   setInterval(async () => {
//     // Upload every 30s
//     if (buffer.length > 0) {
//       const batch = [...buffer];
//       buffer = []; // clear buffer
//       console.log("Sending batch:", batch);

//       await sendBatch(batch);
//     }
//   }, 30000);
}

main();
