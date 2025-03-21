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

    // Log received parameters
    console.log('Received Parameters:', {
      scriptContent: scriptContent ? `${scriptContent.slice(0, 100)}...` : null,
      userId,
      title,
      genre,
      numberOfScenes,
      lengthMinutes,
      scriptId
    });

    // Validate required parameters
    const requiredParams = {
      scriptContent,
      userId,
      title,
      genre,
      numberOfScenes,
      lengthMinutes,
      scriptId
    };

    const missingParams = Object.entries(requiredParams)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingParams.length > 0) {
      console.error('Missing required parameters:', missingParams);
      return res.status(400).json({
        error: 'Missing required parameters',
        missingParams
      });
    }

    // Type validation
    if (typeof scriptContent !== 'string' || !scriptContent.trim()) {
      console.error('Invalid scriptContent:', { type: typeof scriptContent });
      return res.status(400).json({ error: 'Invalid script content' });
    }

    if (typeof userId !== 'string' || !userId.trim()) {
      console.error('Invalid userId:', { type: typeof userId });
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (typeof title !== 'string' || !title.trim()) {
      console.error('Invalid title:', { type: typeof title });
      return res.status(400).json({ error: 'Invalid title' });
    }

    if (typeof genre !== 'string' || !genre.trim()) {
      console.error('Invalid genre:', { type: typeof genre });
      return res.status(400).json({ error: 'Invalid genre' });
    }

    if (isNaN(numberOfScenes) || numberOfScenes <= 0) {
      console.error('Invalid numberOfScenes:', { value: numberOfScenes });
      return res.status(400).json({ error: 'Invalid number of scenes' });
    }

    if (isNaN(lengthMinutes) || lengthMinutes <= 0) {
      console.error('Invalid lengthMinutes:', { value: lengthMinutes });
      return res.status(400).json({ error: 'Invalid length in minutes' });
    }

    if (typeof scriptId !== 'string' || !scriptId.trim()) {
      console.error('Invalid scriptId:', { type: typeof scriptId });
      return res.status(400).json({ error: 'Invalid script ID' });
    }

    console.log('All parameters validated successfully');

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
