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
    await fs.mkdir(path.join(STORAGE_BASE, 'storyboards'), { recursive: true });
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
    const { type } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const files = [];

    // Get scripts if no type specified or type is 'script'
    if (!type || type === 'script') {
      try {
        const scriptsDir = path.join(STORAGE_BASE, 'scripts', userId);
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
    }

    // Get screenplays if no type specified or type is 'movie'
    if (!type || type === 'movie') {
      try {
        const screenplaysDir = path.join(STORAGE_BASE, 'screenplays', userId);
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
    }

    // Get storyboards if no type specified or type is 'storyboard'
    if (!type || type === 'storyboard') {
      try {
        const storyboardsDir = path.join(STORAGE_BASE, 'storyboards', userId);
        async function getStoryboards(dir) {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
              if (entry.name !== userId) {
                await getStoryboards(fullPath);
              }
            } else if (entry.name.endsWith('_storyboard.json')) {
              const stats = await getFileStats(fullPath);
              
              let sceneCount = 0;
              let metadata = null;
              try {
                const content = await fs.readFile(fullPath, 'utf8');
                const storyboardData = JSON.parse(content);
                sceneCount = storyboardData.scenes?.length || 0;
                metadata = storyboardData.metadata || { sceneCount };
              } catch (err) {
                console.error('Error reading storyboard data:', err);
              }

              const parentDir = path.basename(path.dirname(fullPath));
              const fileName = path.basename(fullPath);

              files.push({
                id: `${parentDir}/${fileName}`,
                name: parentDir.split('_')[0],
                type: 'storyboard',
                createdAt: stats.createdAt,
                size: stats.size,
                metadata
              });
            }
          }
        }

        await getStoryboards(storyboardsDir);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error('Error reading storyboards directory:', error);
        }
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
