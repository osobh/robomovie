import { Router } from "express";
import multer from "multer";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs/promises";
import { auth } from "../middleware/auth.js";
import { addActivity } from "./dashboard.js";
import { processWithGPT4Vision } from "../services/vision.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return cb(new Error("User not authenticated"), null);
      }

      const timestamp = Date.now();
      const uploadDir = join(
        __dirname,
        "..",
        "storage",
        "uploads",
        userId,
        timestamp.toString(),
        "original"
      );

      // Create directories if they don't exist
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.mkdir(uploadDir.replace("/original", "/extracted_text"), {
        recursive: true,
      });

      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    const sanitizedName = file.originalname
      .replace(/[^a-z0-9.]/gi, "_")
      .toLowerCase();
    cb(null, sanitizedName);
  },
});

// File filter to validate image and document files
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPG, PNG, PDF, and DOCX files are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

const router = Router();

// Handle preflight requests
router.options("/process-documents", cors());

// Map to store processing jobs
const processingJobs = new Map();

router.post(
  "/process-documents",
  auth,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const jobId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const uploadPath = req.file.path;
      const extractedTextPath = uploadPath
        .replace("/original/", "/extracted_text/")
        .replace(/\.[^/.]+$/, ".txt");

      // Initialize job status
      processingJobs.set(jobId, {
        status: "uploading",
        progress: 0,
        error: null,
        textPath: null,
      });

      // Start processing in background with progress updates
      processFile(
        jobId,
        uploadPath,
        extractedTextPath,
        userId,
        req.file,
        (progress) => {
          processingJobs.set(jobId, {
            ...progress,
            textPath: extractedTextPath,
          });
        }
      );

      // Return job ID immediately
      res.json({ jobId });
    } catch (error) {
      console.error("Error processing document:", error);
      res.status(500).json({
        error: "Failed to process document",
        details: error.message,
      });
    }
  }
);

// Get processing status
router.get("/process-status/:jobId", auth, (req, res) => {
  const { jobId } = req.params;
  const status = processingJobs.get(jobId);

  if (!status) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json(status);
});

async function processFile(jobId, filePath, extractedTextPath, userId, file) {
  try {
    // Update status to processing
    processingJobs.set(jobId, {
      status: "processing",
      progress: 10,
      error: null,
      textPath: null,
    });

    // Process with GPT-4 Vision and track progress
    const extractedText = await processWithGPT4Vision(filePath, (progress) => {
      processingJobs.set(jobId, {
        status: "processing",
        ...progress,
        error: null,
        textPath: null,
      });
    });

    // Save extracted text
    await fs.writeFile(extractedTextPath, extractedText);

    // Log activity
    await addActivity(userId, "script-upload", file.originalname, "complete", {
      processingType: "gpt4-vision",
      outputPath: extractedTextPath,
    });

    // Update status to complete
    processingJobs.set(jobId, {
      status: "complete",
      progress: 100,
      error: null,
      textPath: extractedTextPath,
    });
  } catch (error) {
    console.error("Error processing file:", error);
    processingJobs.set(jobId, {
      status: "error",
      progress: 0,
      error: error.message,
      textPath: null,
    });
  }
}

export default router;
