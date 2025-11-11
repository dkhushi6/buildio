import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import llmRoutes from "./routes/code-gen-agent";
import getTreeRoutes from "./routes/get-tree";
import getFileRoutes from "./routes/get-file";
import { Server } from "socket.io";
import { createServer } from "node:http";
import { getcode } from "../lib/getcode";
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // your frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:3000", // match frontend
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
  console.log("a user connected");
  socket.on("getcode", async (prompt) => {
    console.log("message: ");
    getcode(prompt, socket);
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
