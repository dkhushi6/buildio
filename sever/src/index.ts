import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import cors from "cors";
import llmRoutes from "./routes/code-gen-agent";
import getTreeRoutes from "./routes/get-tree";
import getFileRoutes from "./routes/get-file";
import { Server } from "socket.io";
import { createServer } from "node:http";
import { getcode } from "../lib/getcode";
import getReloadMsgRoutes from "./routes/reload-project";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
// Middleware
app.use(express.json());

// Routes
app.use("/api", llmRoutes);
app.use("/api", getTreeRoutes);
app.use("/api", getFileRoutes);
app.use("/api", getReloadMsgRoutes);

io.on("connection", (socket) => {
  // console.log("a user connected");
  // const token = socket.handshake.auth.token;
  // try {
  //   const decoded = jwt.verify(token, process.env.AUTH_SECRET);
  //   console.log(" Token verified:", decoded);
  // } catch {
  //   console.error("Error verifing token");
  // }
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
    socket.data.prompt = prompt; // store it

    // Now check if everything exists
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
// Health check route (optional)
app.get("/", (req, res) => {
  res.send("🚀 Lovable E2B Clone Backend health check successfull...");
});
app.get("/test", (req, res) => {
  res.status(200).json({ ok: true });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
