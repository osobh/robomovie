import fs from 'fs/promises';
import path from 'path';

const STORAGE_BASE = path.join(process.cwd(), 'storage');
const SCRIPTS_DIR = path.join(STORAGE_BASE, 'scripts');
const SCREENPLAYS_DIR = path.join(STORAGE_BASE, 'screenplays');
const STORYBOARDS_DIR = path.join(STORAGE_BASE, 'storyboards');

// Get user's script and movie counts
export async function getUserStats(userId) {
  try {
    // Initialize counts
    let scriptCount = 0;
    let movieCount = 0;

    // Count scripts
    try {
      const userScriptsDir = path.join(SCRIPTS_DIR, userId);
      const scriptFiles = await fs.readdir(userScriptsDir);
      scriptCount = scriptFiles.length;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error counting scripts:', error);
      }
      // Directory doesn't exist yet, keep count at 0
    }

    // Count completed movies (screenplays)
    try {
      const userScreenplaysDir = path.join(SCREENPLAYS_DIR, userId);
      const movieFiles = await fs.readdir(userScreenplaysDir);
      movieCount = movieFiles.length;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error counting movies:', error);
      }
      // Directory doesn't exist yet, keep count at 0
    }

    // Count storyboards
    let storyboardCount = 0;
    try {
      const userStoryboardsDir = path.join(STORYBOARDS_DIR, userId);
      const storyboardDirs = await fs.readdir(userStoryboardsDir);
      
      // Count JSON files in each storyboard directory
      for (const dir of storyboardDirs) {
        const storyboardDir = path.join(userStoryboardsDir, dir);
        const stats = await fs.stat(storyboardDir);
        if (stats.isDirectory()) {
          const files = await fs.readdir(storyboardDir);
          storyboardCount += files.filter(file => file.endsWith('_storyboard.json')).length;
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error counting storyboards:', error);
      }
      // Directory doesn't exist yet, keep count at 0
    }

    return {
      scriptCount,
      movieCount,
      storyboardCount
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      scriptCount: 0,
      movieCount: 0,
      storyboardCount: 0
    };
  }
}
