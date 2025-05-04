import { Router } from "express";
import multer from "multer";
import cors from "cors";
import { fileURLToPath } from "url";
import path, { dirname, join } from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
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
      const baseDir = join(
        __dirname,
        "..",
        "storage",
        "uploads",
        userId,
        timestamp.toString()
      );

      // Create all required directories
      await fs.mkdir(join(baseDir, "original"), { recursive: true });
      await fs.mkdir(join(baseDir, "extracted_text"), { recursive: true });
      await fs.mkdir(join(baseDir, "pages"), { recursive: true });
      await fs.mkdir(join(baseDir, "images"), { recursive: true });

      // Store in original or images based on file type
      const destDir =
        file.mimetype === "application/pdf"
          ? join(baseDir, "original")
          : join(baseDir, "images");

      cb(null, destDir);
    } catch (error) {
      console.error("Error creating directories:", error);
      cb(
        new Error(`Failed to create upload directories: ${error.message}`),
        null
      );
    }
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const uuid = uuidv4().slice(0, 8); // Short UUID
    const sanitizedName = file.originalname
      .replace(/[^a-z0-9.]/gi, "_")
      .toLowerCase();
    cb(null, `${timestamp}-${uuid}-${sanitizedName}`);
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

      const jobId = `${Date.now()}-${uuidv4().slice(0, 8)}`;
      const uploadPath = req.file.path;
      const baseDir = path.dirname(path.dirname(uploadPath));
      const extractedTextPath = path.join(
        baseDir,
        "extracted_text",
        path.basename(uploadPath).replace(/\.[^/.]+$/, ".txt")
      );

      // Initialize job status
      processingJobs.set(jobId, {
        status: "uploading",
        stage: "File received",
        progress: 0,
        error: null,
        textPath: null,
        details: "Starting file processing",
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
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
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
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
      stage: "Initializing",
      progress: 10,
      error: null,
      textPath: null,
      details: "Starting file processing",
      fileName: file.originalname,
      fileType: file.mimetype,
    });

    // Get base directory (two levels up from filePath)
    const baseDir = path.dirname(path.dirname(filePath));

    // Process with GPT-4 Vision and track progress
    const extractedText = await processWithGPT4Vision(
      filePath,
      baseDir,
      (progress) => {
        processingJobs.set(jobId, {
          status: "processing",
          ...progress,
          error: null,
          textPath: null,
          fileName: file.originalname,
          fileType: file.mimetype,
        });
      }
    );

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
      stage: "Completed",
      progress: 100,
      error: null,
      textPath: extractedTextPath,
      details: "Processing completed successfully",
      fileName: file.originalname,
      fileType: file.mimetype,
    });
  } catch (error) {
    console.error("Error processing file:", {
      error: error.message,
      jobId,
      fileName: file.originalname,
      userId,
    });

    processingJobs.set(jobId, {
      status: "error",
      stage: "Failed",
      progress: 0,
      error: error.message,
      textPath: null,
      details: `Processing failed: ${error.message}`,
      fileName: file.originalname,
      fileType: file.mimetype,
    });
  }
}

export default router;
