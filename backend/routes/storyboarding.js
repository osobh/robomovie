import { Router } from 'express';
import { openai } from '../services/openai.js';
import { saveStoryboard, readStoryboard, deleteStoryboard } from '../services/storage.js';

const router = Router();

const STORYBOARD_PROMPT = `As a professional storyboard artist and script supervisor, analyze this script and create a detailed shot-by-shot breakdown. Return a JSON object with a "scenes" array, where each scene has the following structure:

{
  "scenes": [
    {
      "title": "string",
      "sceneNumber": number,
      "location": "string",
      "timeOfDay": "string",
      "characters": ["string"],
      "description": "string",
      "shots": [
        {
          "number": number,
          "angle": "string",
          "movement": "string",
          "composition": "string",
          "action": "string",
          "effects": "string",
          "lighting": "string",
          "scriptSegment": "string",  // The specific part of the script (action/description) relevant to this shot
          "dialogue": {               // Any character dialogue that occurs during this shot
            "speaker": "string",      // The character or entity speaking
            "text": "string"         // The actual dialogue text
          }
        }
      ],
      "technicalRequirements": {
        "equipment": ["string"],
        "vfx": ["string"],
        "practicalEffects": ["string"],
        "props": ["string"],
        "safety": ["string"]
      },
      "emotionalContext": {
        "characterEmotions": { "characterName": "emotionDescription" },
        "mood": "string",
        "colorPalette": ["string"],
        "soundCues": ["string"]
      }
    }
  ]
}

For each shot, break down the script content into:
1. scriptSegment: The specific action, description, or scene direction that corresponds to what we see in this shot
2. dialogue: Any character dialogue that occurs during this shot

Example shot breakdown:
{
  "number": 1,
  "angle": "Medium Shot",
  "movement": "Static",
  "action": "Focus on Sarah at table",
  "scriptSegment": "Sarah sits at a corner table, nervously tapping her fingers on her coffee cup.",
  "dialogue": null
}

{
  "number": 2,
  "angle": "Close-Up",
  "movement": "Static",
  "action": "Show Sarah checking phone",
  "scriptSegment": "(checking her phone)",
  "dialogue": {
    "speaker": "SARAH",
    "text": "He's late again..."
  }
}

Analyze the script and break it down into scenes and shots, providing detailed information for each field. Be creative but precise in your descriptions. Ensure that every shot has its corresponding script segment and any relevant dialogue.`;

router.post('/storyboarding/process-script', async (req, res) => {
  try {
    const { script, scriptId, userId } = req.body;
    console.log('Received storyboard process request:', { scriptId, userId });
    
    if (!script || !scriptId || !userId) {
      console.log('Missing required parameters:', { script: !!script, scriptId, userId });
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Remove .txt extension if present
    const cleanScriptId = scriptId.replace('.txt', '');
    console.log('Cleaned script ID:', cleanScriptId);

    // Process the script with OpenAI
    console.log('Processing script with OpenAI...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { 
          role: 'system', 
          content: STORYBOARD_PROMPT + '\n\nIMPORTANT: Your response must be a valid JSON object. Do not include any text outside of the JSON structure.' 
        },
        { 
          role: 'user', 
          content: script 
        }
      ],
      temperature: 0.7
    });

    let storyboardData;
    try {
      storyboardData = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse storyboard data');
    }

    // Save storyboard data locally
    console.log('Saving storyboard data...', {
      userId,
      scriptId: cleanScriptId,
      sceneCount: storyboardData.scenes?.length || 0
    });
    const result = await saveStoryboard(userId, cleanScriptId, storyboardData);
    console.log('Storyboard saved:', result);

    const response = {
      message: 'Storyboard generated successfully',
      filePath: result.filePath,
      scenes: storyboardData.scenes,
      metadata: result.metadata
    };
    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error processing script:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to process script' });
  }
});

// Get specific storyboard
router.get('/storyboards/:userId/:storyboardId', async (req, res) => {
  try {
    const { userId, storyboardId } = req.params;
    console.log('Reading storyboard:', { userId, storyboardId });
    
    if (!userId || !storyboardId) {
      console.log('Missing required parameters:', { userId, storyboardId });
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Decode the storyboardId which contains the full path
    const decodedId = decodeURIComponent(storyboardId);
    const [scriptDir, fileName] = decodedId.split('/');
    const storyboard = await readStoryboard(userId, scriptDir, fileName);
    console.log('Storyboard read successfully:', {
      filePath: storyboard.filePath,
      hasContent: !!storyboard.content,
      hasScenes: !!storyboard.content?.scenes
    });
    res.json(storyboard);
  } catch (error) {
    console.error('Error reading storyboard:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to read storyboard' });
  }
});

// Delete storyboard
router.delete('/storyboards/:userId/:storyboardId', async (req, res) => {
  try {
    const { userId, storyboardId } = req.params;
    console.log('Deleting storyboard:', { userId, storyboardId });
    
    if (!userId || !storyboardId) {
      console.log('Missing required parameters:', { userId, storyboardId });
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Decode the storyboardId which contains the full path
    const decodedId = decodeURIComponent(storyboardId);
    const [scriptDir, fileName] = decodedId.split('/');
    await deleteStoryboard(userId, scriptDir, fileName);
    console.log('Storyboard deleted successfully');
    res.json({ message: 'Storyboard deleted successfully' });
  } catch (error) {
    console.error('Error deleting storyboard:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to delete storyboard' });
  }
});

export default router;
