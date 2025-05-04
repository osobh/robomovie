import { Router } from "express";
import multer from "multer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs/promises";
import { ensureUserDirectory, saveScript } from "../services/storage.js";
import { auth } from "../middleware/auth.js";
import { addActivity, formatBytes } from "../routes/dashboard.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      // Get user ID from request
      const userId = req.user?.id;
      if (!userId) {
        return cb(new Error("User not authenticated"), null);
      }

      // Ensure user directory exists
      const userDir = await ensureUserDirectory(userId, "scripts");
      cb(null, userDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    // Sanitize filename and add timestamp
    const sanitizedName = file.originalname
      .replace(/[^a-z0-9.]/gi, "_")
      .toLowerCase();
    cb(null, `${Date.now()}-${sanitizedName}`);
  },
});

// File filter to validate script files
const fileFilter = (req, file, cb) => {
  // Accept only text files and common script formats
  const allowedTypes = ["text/plain", "text/markdown", "application/pdf"];
  const allowedExtensions = [".txt", ".md", ".pdf", ".fountain", ".fdx"];

  const fileExtension = "." + file.originalname.split(".").pop().toLowerCase();

  if (
    allowedTypes.includes(file.mimetype) ||
    allowedExtensions.includes(fileExtension)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only text, markdown, PDF, and script files are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Maximum 10 files at once
  },
});

const router = Router();

// Route to handle multiple script uploads
router.post(
  "/upload-scripts",
  auth,
  upload.array("scripts", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Process each uploaded file
      const results = await Promise.all(
        req.files.map(async (file) => {
          const title = file.originalname.split(".")[0];
          const content = await fs.readFile(file.path, "utf8");

          // Save script using storage service
          const result = await saveScript(userId, title, content, {
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          });

          // Log activity
          await addActivity(userId, "script-upload", title, null, {
            fileSize: formatBytes(file.size),
            mimeType: file.mimetype,
          });

          // Delete the temporary file
          await fs.unlink(file.path);

          return {
            originalName: file.originalname,
            savedAs: result.fileName,
            path: result.filePath,
            metadata: result.metadataPath,
          };
        })
      );

      res.json({
        message: "Files uploaded successfully",
        files: results,
      });
    } catch (error) {
      console.error("Error processing uploads:", error);
      res.status(500).json({
        error: "Failed to process uploads",
        details: error.message,
      });
    }
  }
);

export default router;
