import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeStorage } from "./services/storage.js";

// Import routes
import uploadRoutes from "./routes/upload.js";
import generateScriptRoutes from "./routes/generate-script.js";
import storyboardingRoutes from "./routes/storyboarding.js";
import referenceImageRoutes from "./routes/reference-image.js";
import movieEditingRoutes from "./routes/movie-editing.js";
import theatreRoutes from "./routes/theatre.js";
import dashboardRoutes from "./routes/dashboard.js";
import statsRoutes from "./routes/stats.js";
import filesRoutes from "./routes/files.js";
import scriptsRoutes from "./routes/scripts.js";

// Load environment variables
dotenv.config({ path: "../.env" });

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || "localhost";
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

// Middleware
app.use(
  cors({
    origin: [
      frontendUrl,
      "https://api.robo.smartpi.ai",
      "https://robo.smartpi.ai",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400, // Cache preflight requests for 24 hours
  })
);

// Configure request size limits and error handling
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Add error handler for payload too large
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 413) {
    return res.status(413).json({
      error: "Request entity too large",
      message:
        "The data payload is too large. Please reduce the size and try again.",
    });
  }
  next(err);
});

// Routes
app.use("/api", uploadRoutes);
app.use("/api", generateScriptRoutes);
app.use("/api", storyboardingRoutes);
app.use("/api", referenceImageRoutes);
app.use("/api", movieEditingRoutes); // Now includes audio and assembly functionality
app.use("/api", theatreRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", statsRoutes);
app.use("/api", filesRoutes);
app.use("/api", scriptsRoutes);

// Health check endpoint
app.use("/api/health", (req, res) => {
  res.sendStatus(200);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

app.listen(port, host, async () => {
  try {
    await initializeStorage();
    console.log("Storage directories initialized");
    console.log(`Server running at http://${host}:${port}`);
  } catch (error) {
    console.error("Failed to initialize storage:", error);
    process.exit(1);
  }
});
