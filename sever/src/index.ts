import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import llmRoutes from "./routes/code-gen-agent";
import getTreeRoutes from "./routes/get-tree";
import getFileRoutes from "./routes/get-file";
dotenv.config();

const app = express();
app.use(cors()); // <--- Add this line

// Middleware
app.use(express.json());

// Routes
app.use("/api", llmRoutes);
app.use("/api", getTreeRoutes);
app.use("/api", getFileRoutes);

// Health check route (optional)
app.get("/", (req, res) => {
  res.send("🚀 Lovable E2B Clone Backend health check successfull...");
});
app.get("/test", (req, res) => {
  res.status(200).json({ ok: true });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
