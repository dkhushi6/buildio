import express from "express";
import dotenv from "dotenv";

import cors from "cors";
import getTreeRoutes from "./routes/get-tree";
import getFileRoutes from "./routes/get-file";
import getUserProjectRoutes from "./routes/get-all-projects";
import { Server } from "socket.io";
import { createServer } from "node:http";
import { getcode } from "../lib/getcode";
import getReloadMsgRoutes from "./routes/reload-project";
import testRoute from "./routes/test";
import deployProjectRoutes from "./routes/deploy-project";
dotenv.config();

const app = express();
const server = createServer(app);

const socketCorsOptions = {
  origin: process.env.CORS_ORIGIN_URL,
  methods: ["GET", "POST"],
  credentials: true,
};

const io = new Server(server, {
  path: "/socket.io",
  cors: socketCorsOptions,
});
const wsIo = new Server(server, {
  path: "/ws/socket.io",
  cors: socketCorsOptions,
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN_URL,
    credentials: true,
  }),
);
app.use(express.json());

// Routes
app.use("/api", getTreeRoutes);
app.use("/api", getFileRoutes);
app.use("/api", getReloadMsgRoutes);
app.use("/api", getUserProjectRoutes);
app.use("/api", testRoute);
app.use("/api", deployProjectRoutes);

const registerSocketHandlers = (socketServer: Server) => {
  socketServer.on("connection", (socket) => {
    socket.data.projectId = null;
    socket.data.userId = null;
    socket.data.prompt = null;
    socket.data.sandboxId = null;

    socket.on("projectId", (id) => {
      socket.data.projectId = id;
      console.log("Received projectId:", id);
    });

    socket.on("userId", (id) => {
      socket.data.userId = id;
      console.log("Received userId:", id);
    });
    socket.on("sandboxId", (id) => {
      socket.data.sandboxId = id;
      console.log("Received sandboxId:", id);
    });
    socket.on("getcode", async (prompt) => {
      if (!prompt) return console.log("❌ No prompt received");
      socket.data.prompt = prompt;
      if (!socket.data.projectId || !socket.data.userId) {
        console.log("⚠ Missing projectId or userId, waiting...");
        return;
      }
      if (prompt) {
        getcode({
          prompt: socket.data.prompt,
          projectId: socket.data.projectId,
          userId: socket.data.userId,
          sandboxId: socket.data.sandboxId,
          socket,
        });
      }
    });
  });
};

registerSocketHandlers(io);
registerSocketHandlers(wsIo);

app.get("/", (req, res) => {
  res.send("🚀 Lovable E2B Clone Backend health check successfull...");
});
app.get("/test", (req, res) => {
  res.status(200).json({ ok: true });
});

// Start server
const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("Socket.IO paths: /socket.io and /ws/socket.io");
});
