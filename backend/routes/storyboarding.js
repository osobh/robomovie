import { Router } from 'express';
import { openai } from '../services/openai.js';
import { saveStoryboard } from '../services/storage.js';

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
          "lighting": "string"
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

Analyze the script and break it down into scenes, providing detailed information for each field. Be creative but precise in your descriptions.`;

router.post('/storyboarding/process-script', async (req, res) => {
  try {
    const { script, scriptId, userId } = req.body;
    
    if (!script || !scriptId || !userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

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
    console.log('Saving storyboard data...');
    const result = await saveStoryboard(userId, scriptId, storyboardData);

    res.json({
      message: 'Storyboard generated successfully',
      filePath: result.filePath,
      scenes: storyboardData.scenes
    });
  } catch (error) {
    console.error('Error processing script:', error);
    res.status(500).json({ error: 'Failed to process script' });
  }
});

export default router;
