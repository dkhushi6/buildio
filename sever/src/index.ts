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

io.on("connection", (socket) => {
  // console.log("a user connected");
  // const token = socket.handshake.auth.token;
  // try {
  //   const decoded = jwt.verify(token, process.env.AUTH_SECRET);
  //   console.log(" Token verified:", decoded);
  // } catch {
  //   console.error("Error verifing token");
  // }

  socket.on("getcode", async (prompt, projectId, userId) => {
    getcode({ prompt, socket, projectId, userId });
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
