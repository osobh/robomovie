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

// Save storyboard data
export async function saveStoryboard(userId, scriptId, storyboardData) {
  try {
    console.log('Creating storyboard directory for user:', userId);
    const userDir = await ensureUserDirectory(userId, 'storyboards');
    const timestamp = Date.now();
    
    // Clean up scriptId by removing .txt extension
    const cleanScriptId = scriptId.replace('.txt', '');
    const fileName = `${cleanScriptId}_${timestamp}_storyboard.json`;
    
    // Create a directory for this storyboard
    const storyboardDir = path.join(userDir, cleanScriptId);
    await fs.mkdir(storyboardDir, { recursive: true });
    console.log('Created storyboard directory:', storyboardDir);
    
    const filePath = path.join(storyboardDir, fileName);
    console.log('Storyboard file path:', filePath);

    // Add metadata to storyboard data
    const enrichedData = {
      ...storyboardData,
      metadata: {
        scriptId,
        createdAt: new Date().toISOString(),
        sceneCount: storyboardData.scenes?.length || 0,
        userId
      }
    };
    console.log('Enriched storyboard data:', {
      scriptId,
      sceneCount: enrichedData.metadata.sceneCount,
      createdAt: enrichedData.metadata.createdAt
    });

    // Write storyboard data to file
    console.log('Writing storyboard data to file...');
    await fs.writeFile(filePath, JSON.stringify(enrichedData, null, 2), 'utf8');
    console.log('Storyboard data written successfully');

    const result = {
      fileName,
      filePath: path.relative(process.cwd(), filePath),
      metadata: enrichedData.metadata
    };
    console.log('Returning storyboard save result:', result);
    return result;
  } catch (error) {
    console.error('Error saving storyboard:', error);
    throw error;
  }
}

// Read storyboard data
export async function readStoryboard(userId, scriptDir, fileName) {
  try {
    console.log('Reading storyboard:', { userId, scriptDir, fileName });
    const userDir = await ensureUserDirectory(userId, 'storyboards');
    const storyboardDir = path.join(userDir, scriptDir);
    const filePath = path.join(storyboardDir, fileName);
    console.log('Reading storyboard:', { userDir, scriptDir, fileName, filePath });
    
    console.log('Reading storyboard file...');
    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content);
    console.log('Storyboard data parsed successfully:', {
      hasScenes: !!data.scenes,
      sceneCount: data.scenes?.length || 0,
      hasMetadata: !!data.metadata
    });
    
    const result = {
      content: data,
      filePath: path.relative(process.cwd(), filePath)
    };
    console.log('Returning storyboard read result:', {
      filePath: result.filePath,
      hasContent: !!result.content
    });
    return result;
  } catch (error) {
    console.error('Error reading storyboard:', error);
    throw error;
  }
}

// Delete storyboard
export async function deleteStoryboard(userId, scriptDir, fileName) {
  try {
    console.log('Deleting storyboard:', { userId, scriptDir, fileName });
    const userDir = await ensureUserDirectory(userId, 'storyboards');
    const storyboardDir = path.join(userDir, scriptDir);
    const filePath = path.join(storyboardDir, fileName);
    console.log('Deleting storyboard:', { userDir, scriptDir, fileName, filePath });
    
    console.log('Deleting storyboard file...');
    await fs.unlink(filePath);
    
    // Try to remove the storyboard directory if it's empty
    try {
      await fs.rmdir(storyboardDir);
      console.log('Removed empty storyboard directory:', storyboardDir);
    } catch (err) {
      // Directory might not be empty or might not exist, ignore error
      console.log('Could not remove storyboard directory (might not be empty):', storyboardDir);
    }
    
    console.log('Storyboard file deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting storyboard:', error);
    throw error;
  }
}

// Delete script and metadata
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
