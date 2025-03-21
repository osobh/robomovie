import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();
const STORAGE_BASE = path.join(process.cwd(), 'storage');

// Initialize storage directories
async function initializeStorage() {
  try {
    await fs.mkdir(STORAGE_BASE, { recursive: true });
    await fs.mkdir(path.join(STORAGE_BASE, 'scripts'), { recursive: true });
    await fs.mkdir(path.join(STORAGE_BASE, 'screenplays'), { recursive: true });
  } catch (error) {
    console.error('Error initializing storage directories:', error);
  }
}

// Initialize storage on startup
initializeStorage();

// Helper function to get file stats
async function getFileStats(filePath) {
  const stats = await fs.stat(filePath);
  return {
    size: stats.size,
    createdAt: stats.birthtime
  };
}

// Get recent files for a user
router.get('/user-files/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const scriptsDir = path.join(STORAGE_BASE, 'scripts', userId);
    const screenplaysDir = path.join(STORAGE_BASE, 'screenplays', userId);
    const files = [];

    // Get scripts
    try {
      const scriptFiles = await fs.readdir(scriptsDir);
      for (const fileName of scriptFiles) {
        const filePath = path.join(scriptsDir, fileName);
        const stats = await getFileStats(filePath);
        files.push({
          id: fileName,
          name: fileName.split('_')[0], // Get original title
          type: 'script',
          createdAt: stats.createdAt,
          size: stats.size
        });
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error reading scripts directory:', error);
      }
    }

    // Get screenplays
    try {
      const screenplayFiles = await fs.readdir(screenplaysDir);
      for (const fileName of screenplayFiles) {
        const filePath = path.join(screenplaysDir, fileName);
        const stats = await getFileStats(filePath);
        files.push({
          id: fileName,
          name: fileName.split('_')[0], // Get original title
          type: 'movie',
          createdAt: stats.createdAt,
          size: stats.size
        });
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error reading screenplays directory:', error);
      }
    }

    // Sort by creation date (newest first) and limit to 5
    files.sort((a, b) => b.createdAt - a.createdAt);
    const recentFiles = files.slice(0, 5);

    res.json(recentFiles);
  } catch (error) {
    console.error('Error getting user files:', error);
    res.status(500).json({ error: 'Failed to get user files' });
  }
});

export default router;
