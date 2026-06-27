const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const missionsRouter = require("./routes/missions");
const satellitesRouter = require("./routes/satellites");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Routes
app.use("/api/missions", missionsRouter);
app.use("/api/satellites", satellitesRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "online", timestamp: new Date().toISOString(), version: "1.0.0" });
});

// Telemetry state per satellite
const telemetryState = {
  ISS: { altitude: 408, velocity: 7.66, temperature: -10, battery: 87, signal: 98 },
  "Hubble": { altitude: 547, velocity: 7.59, temperature: -20, battery: 92, signal: 95 },
  "JWST": { altitude: 1500000, velocity: 0.5, temperature: -233, battery: 100, signal: 88 },
};

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function simulateTelemetry() {
  const satellites = Object.keys(telemetryState);
  const data = {};

  satellites.forEach(name => {
    const s = telemetryState[name];
    s.altitude += (Math.random() - 0.5) * 0.5;
    s.velocity += (Math.random() - 0.5) * 0.01;
    s.temperature += (Math.random() - 0.5) * 0.3;
    s.battery = clamp(s.battery + (Math.random() - 0.45) * 0.2, 70, 100);
    s.signal = clamp(s.signal + (Math.random() - 0.5) * 0.5, 80, 100);

    data[name] = {
      name,
      altitude: +s.altitude.toFixed(2),
      velocity: +s.velocity.toFixed(3),
      temperature: +s.temperature.toFixed(1),
      battery: +s.battery.toFixed(1),
      signal: +s.signal.toFixed(1),
      timestamp: new Date().toISOString()
    };
  });

  return data;
}

// ISS position simulation (orbital mechanics approximation)
let issAngle = 0;
function getISSPosition() {
  issAngle = (issAngle + 0.05) % 360;
  const lat = 51.6 * Math.sin((issAngle * Math.PI) / 180);
  const lon = (issAngle * 3.6) % 360 - 180;
  return { lat: +lat.toFixed(4), lon: +lon.toFixed(4), altitude: 408, speed: 7.66 };
}

// Emit telemetry every 2 seconds
setInterval(() => {
  io.emit("telemetry", simulateTelemetry());
  io.emit("iss_position", getISSPosition());
}, 2000);

// Socket events
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.emit("telemetry", simulateTelemetry());
  socket.emit("iss_position", getISSPosition());

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Space Mission Control Backend running on http://localhost:${PORT}`);
});
