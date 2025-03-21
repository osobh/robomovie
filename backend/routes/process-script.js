import { Router } from 'express';
import { saveScript } from '../services/storage.js';

const router = Router();

router.post('/process-script', async (req, res) => {
  console.log('Process Script Request Received:', {
    body: req.body,
    headers: req.headers
  });

  try {
    const {
      scriptContent,
      userId,
      title,
      genre,
      numberOfScenes,
      lengthMinutes,
      scriptId
    } = req.body;

    // Validate and sanitize parameters
    const validationErrors = [];
    const sanitizedParams = {};

    // Validate and sanitize string parameters
    const stringParams = {
      scriptContent,
      userId,
      title,
      genre,
      scriptId
    };

    Object.entries(stringParams).forEach(([key, value]) => {
      if (!value || typeof value !== 'string') {
        validationErrors.push(`${key} must be a non-empty string`);
      } else {
        sanitizedParams[key] = value.trim();
        if (!sanitizedParams[key]) {
          validationErrors.push(`${key} cannot be empty or just whitespace`);
        }
      }
    });

    // Validate and sanitize numeric parameters
    const numericParams = {
      numberOfScenes,
      lengthMinutes
    };

    Object.entries(numericParams).forEach(([key, value]) => {
      const num = Number(value);
      if (isNaN(num) || num <= 0) {
        validationErrors.push(`${key} must be a positive number`);
      } else {
        sanitizedParams[key] = num;
      }
    });

    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({
        error: 'Invalid parameters',
        details: validationErrors
      });
    }

    console.log('Parameters validated and sanitized successfully:', {
      ...sanitizedParams,
      scriptContent: `${sanitizedParams.scriptContent.slice(0, 100)}...`
    });

    // Process the script into scenes
    const scenes = [];
    const scriptLines = scriptContent.split('\n');
    let currentScene = {
      number: 1,
      content: [],
      location: '',
      time: ''
    };

    console.log('Processing script into scenes...');

    for (const line of scriptLines) {
      // Look for scene headers (INT./EXT.)
      if (line.trim().match(/^(INT\.|EXT\.)/i)) {
        if (currentScene.content.length > 0) {
          scenes.push({ ...currentScene });
          currentScene = {
            number: scenes.length + 1,
            content: [],
            location: '',
            time: ''
          };
        }
        // Extract location and time from scene header
        const headerParts = line.split('-').map(part => part.trim());
        currentScene.location = headerParts[0] || '';
        currentScene.time = headerParts[1] || '';
      }
      currentScene.content.push(line);
    }

    // Add the last scene
    if (currentScene.content.length > 0) {
      scenes.push(currentScene);
    }

    console.log('Script processed into scenes:', {
      totalScenes: scenes.length,
      scenePreview: scenes.map(scene => ({
        number: scene.number,
        location: scene.location,
        time: scene.time,
        contentLength: scene.content.length
      }))
    });

    // Return the processed scenes
    res.json({
      success: true,
      scenes,
      metadata: {
        title,
        genre,
        numberOfScenes,
        lengthMinutes,
        scriptId
      }
    });

  } catch (error) {
    console.error('Error processing script:', error);
    res.status(500).json({
      error: 'Failed to process script',
      details: error.message
    });
  }
});

export default router;
