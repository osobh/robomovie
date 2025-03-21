import { Router } from 'express';
import { openai } from '../services/openai.js';

const router = Router();

router.post('/process-scenes', async (req, res) => {
  try {
    const { script } = req.body;
    
    const prompt = `Analyze this script and break it down into detailed scenes. For each scene, provide:
    1. Scene number
    2. Location and time of day
    3. Key characters present
    4. Detailed description of the action
    5. Suggested number of frames needed (estimate based on action complexity)
    6. Key emotional tone or atmosphere
    7. Technical considerations (lighting, camera angles, special effects)

    Format the response as a JSON array of scenes.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { 
          role: 'user', 
          content: prompt + '\n\nScript:\n' + script 
        }
      ],
      response_format: { type: "json_object" }
    });

    const scenes = JSON.parse(completion.choices[0].message.content);
    res.json(scenes);
  } catch (error) {
    console.error('Error processing scenes:', error);
    res.status(500).json({ error: 'Failed to process scenes' });
  }
});

export default router;
