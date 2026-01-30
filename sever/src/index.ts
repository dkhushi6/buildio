import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import cors from "cors";
import llmRoutes from "./routes/code-gen-agent";
import getTreeRoutes from "./routes/get-tree";
import getFileRoutes from "./routes/get-file";
import getUserProjectRoutes from "./routes/get-all-projects";
import { Server } from "socket.io";
import { createServer } from "node:http";
import { getcode } from "../lib/getcode";
import getReloadMsgRoutes from "./routes/reload-project";
import testRoute from "./routes/test";
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN_URL,
    credentials: true,
  }),
);
app.use(express.json());

// Routes
app.use("/api", llmRoutes);
app.use("/api", getTreeRoutes);
app.use("/api", getFileRoutes);
app.use("/api", getReloadMsgRoutes);
app.use("/api", getUserProjectRoutes);
app.use("/api", testRoute);

io.on("connection", (socket) => {
  socket.data.projectId = null;
  socket.data.userId = null;
  socket.data.prompt = null;

  socket.on("projectId", (id) => {
    socket.data.projectId = id;
    console.log("Received projectId:", id);
  });

  socket.on("userId", (id) => {
    socket.data.userId = id;
    console.log("Received userId:", id);
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
        socket,
      });
    }
  });
});
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
});
