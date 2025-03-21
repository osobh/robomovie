import { Router } from 'express';
import { join } from 'path';
import fs from 'fs/promises';

const router = Router();

// Helper function to get directory size
async function getDirectorySize(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    const stats = await Promise.all(
      files.map(file => fs.stat(join(dirPath, file)))
    );
    return stats.reduce((acc, { size }) => acc + size, 0);
  } catch (error) {
    console.error('Error calculating directory size:', error);
    return 0;
  }
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const uploadsDir = join(__dirname, '..', 'uploads');
    const moviesDir = join(__dirname, '..', 'movies');
    const audioDir = join(__dirname, '..', 'audio');

    // Ensure directories exist
    await Promise.all([
      fs.mkdir(uploadsDir, { recursive: true }),
      fs.mkdir(moviesDir, { recursive: true }),
      fs.mkdir(audioDir, { recursive: true })
    ]);

    // Get file counts and sizes
    const [scripts, movies, audioFiles] = await Promise.all([
      fs.readdir(uploadsDir),
      fs.readdir(moviesDir),
      fs.readdir(audioDir)
    ]);

    // Calculate total audio duration (mock calculation - 3 minutes per audio file)
    const audioMinutes = audioFiles.length * 3;

    // Mock processing time (10 minutes per movie)
    const processingTime = movies.length * 10 / 60;

    res.json({
      totalScripts: scripts.length,
      completedMovies: movies.length,
      audioMinutes,
      processingTime: Math.round(processingTime * 100) / 100
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get recent files
router.get('/files', async (req, res) => {
  try {
    const uploadsDir = join(__dirname, '..', 'uploads');
    const moviesDir = join(__dirname, '..', 'movies');

    // Ensure directories exist
    await Promise.all([
      fs.mkdir(uploadsDir, { recursive: true }),
      fs.mkdir(moviesDir, { recursive: true })
    ]);

    // Get all files from both directories
    const [scriptFiles, movieFiles] = await Promise.all([
      fs.readdir(uploadsDir),
      fs.readdir(moviesDir)
    ]);

    // Process script files
    const scripts = await Promise.all(
      scriptFiles.map(async (filename) => {
        const stats = await fs.stat(join(uploadsDir, filename));
        return {
          id: filename.split('-')[0],
          name: filename.split('-').slice(1).join('-'),
          type: 'script',
          createdAt: stats.birthtime,
          size: formatBytes(stats.size)
        };
      })
    );

    // Process movie files
    const movies = await Promise.all(
      movieFiles.map(async (filename) => {
        const stats = await fs.stat(join(moviesDir, filename));
        return {
          id: filename.split('-')[0],
          name: filename.split('-').slice(1).join('-'),
          type: 'movie',
          createdAt: stats.birthtime,
          size: formatBytes(stats.size)
        };
      })
    );

    // Combine and sort by creation date
    const allFiles = [...scripts, ...movies].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json(allFiles);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

export default router;
