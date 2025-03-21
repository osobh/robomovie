import fs from 'fs/promises';
import path from 'path';

// Base storage paths
const STORAGE_BASE = path.join(process.cwd(), 'storage');
const SCRIPTS_DIR = path.join(STORAGE_BASE, 'scripts');
const SCREENPLAYS_DIR = path.join(STORAGE_BASE, 'screenplays');
const METADATA_DIR = path.join(STORAGE_BASE, 'metadata');
const STORYBOARDS_DIR = path.join(STORAGE_BASE, 'storyboards');

// Initialize storage directories
export async function initializeStorage() {
  try {
    // Create base storage directory
    await fs.mkdir(STORAGE_BASE, { recursive: true });
    // Create scripts directory
    await fs.mkdir(SCRIPTS_DIR, { recursive: true });
    // Create screenplays directory
    await fs.mkdir(SCREENPLAYS_DIR, { recursive: true });
    // Create metadata directory
    await fs.mkdir(METADATA_DIR, { recursive: true });
    // Create storyboards directory
    await fs.mkdir(STORYBOARDS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error initializing storage directories:', error);
    throw error;
  }
}

// Create user directory if it doesn't exist
async function ensureUserDirectory(userId, type = 'scripts') {
  let baseDir;
  switch (type) {
    case 'scripts':
      baseDir = SCRIPTS_DIR;
      break;
    case 'screenplays':
      baseDir = SCREENPLAYS_DIR;
      break;
    case 'metadata':
      baseDir = METADATA_DIR;
      break;
    case 'storyboards':
      baseDir = STORYBOARDS_DIR;
      break;
    default:
      baseDir = SCRIPTS_DIR;
  }
  const userDir = path.join(baseDir, userId);
  await fs.mkdir(userDir, { recursive: true });
  return userDir;
}

// Save script content and metadata to files
export async function saveScript(userId, title, content, metadata) {
  try {
    const userScriptsDir = await ensureUserDirectory(userId, 'scripts');
    const userMetadataDir = await ensureUserDirectory(userId, 'metadata');
    
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = Date.now();
    const fileName = `${sanitizedTitle}_${timestamp}.txt`;
    const metadataFileName = `${sanitizedTitle}_${timestamp}.json`;
    
    const filePath = path.join(userScriptsDir, fileName);
    const metadataPath = path.join(userMetadataDir, metadataFileName);

    // Write content to file
    await fs.writeFile(filePath, content, 'utf8');
    
    // Write metadata to separate file
    if (metadata) {
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    }

    // Log the file creation for debugging
    console.log('Script saved to:', filePath);
    console.log('Metadata saved to:', metadataPath);
    
    return {
      fileName,
      filePath: path.relative(process.cwd(), filePath),
      metadataPath: path.relative(process.cwd(), metadataPath)
    };
  } catch (error) {
    console.error('Error saving script:', error);
    throw error;
  }
}

// Read script content and metadata
export async function readScript(userId, fileName) {
  try {
    const userScriptsDir = await ensureUserDirectory(userId, 'scripts');
    const userMetadataDir = await ensureUserDirectory(userId, 'metadata');
    
    const filePath = path.join(userScriptsDir, fileName);
    const metadataFileName = fileName.replace('.txt', '.json');
    const metadataPath = path.join(userMetadataDir, metadataFileName);
    
    const content = await fs.readFile(filePath, 'utf8');
    
    let metadata = null;
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(metadataContent);
    } catch (error) {
      console.log('No metadata found for script:', fileName);
    }
    
    return {
      content,
      metadata
    };
  } catch (error) {
    console.error('Error reading script:', error);
    throw error;
  }
}

// Save screenplay content
export async function saveScreenplay(userId, title, content) {
  try {
    const userDir = await ensureUserDirectory(userId, 'screenplays');
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${sanitizedTitle}_${Date.now()}.txt`;
    const filePath = path.join(userDir, fileName);

    // Write content to file
    await fs.writeFile(filePath, content, 'utf8');

    return {
      fileName,
      filePath,
      relativePath: path.relative(process.cwd(), filePath)
    };
  } catch (error) {
    console.error('Error saving screenplay:', error);
    throw error;
  }
}

// List user's scripts with metadata
export async function listUserScripts(userId) {
  try {
    const userScriptsDir = await ensureUserDirectory(userId, 'scripts');
    const userMetadataDir = await ensureUserDirectory(userId, 'metadata');
    
    const files = await fs.readdir(userScriptsDir);
    
    const scriptsWithMetadata = await Promise.all(files.map(async (fileName) => {
      const filePath = path.join(userScriptsDir, fileName);
      const stats = await fs.stat(filePath);
      
      // Try to get metadata
      let metadata = null;
      try {
        const metadataPath = path.join(userMetadataDir, fileName.replace('.txt', '.json'));
        const metadataContent = await fs.readFile(metadataPath, 'utf8');
        metadata = JSON.parse(metadataContent);
      } catch (error) {
        // Metadata not found, continue without it
      }
      
      return {
        id: fileName,
        name: fileName.replace(/(_\d+)?\.txt$/, ''),
        type: 'script',
        createdAt: stats.birthtime,
        size: stats.size,
        metadata
      };
    }));
    
    return scriptsWithMetadata;
  } catch (error) {
    console.error('Error listing scripts:', error);
    throw error;
  }
}

// Delete a script and its metadata
// Save storyboard data
export async function saveStoryboard(userId, scriptId, storyboardData) {
  try {
    const userDir = await ensureUserDirectory(userId, 'storyboards');
    const fileName = `${scriptId}_storyboard.json`;
    const filePath = path.join(userDir, fileName);

    // Write storyboard data to file
    await fs.writeFile(filePath, JSON.stringify(storyboardData, null, 2), 'utf8');

    return {
      fileName,
      filePath: path.relative(process.cwd(), filePath)
    };
  } catch (error) {
    console.error('Error saving storyboard:', error);
    throw error;
  }
}

export async function deleteScript(userId, fileName) {
  try {
    const userScriptsDir = await ensureUserDirectory(userId, 'scripts');
    const userMetadataDir = await ensureUserDirectory(userId, 'metadata');
    
    const filePath = path.join(userScriptsDir, fileName);
    const metadataPath = path.join(userMetadataDir, fileName.replace('.txt', '.json'));
    
    await fs.unlink(filePath);
    
    try {
      await fs.unlink(metadataPath);
    } catch (error) {
      // Metadata file might not exist, ignore error
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting script:', error);
    throw error;
  }
}
