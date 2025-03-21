import { Router } from 'express';
import { openai } from '../services/openai.js';
import { supabase } from '../services/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const STORYBOARD_PROMPT = `As a professional storyboard artist and script supervisor, analyze this script and create a detailed shot-by-shot breakdown. For each scene, provide:

1. Scene Overview:
   - Scene number and title
   - Location description
   - Time of day
   - Key characters present
   - Emotional tone/atmosphere

2. Shot List:
   - Shot number
   - Camera angle (e.g., wide, medium, close-up)
   - Camera movement (if any)
   - Shot composition
   - Key action/dialogue
   - Visual effects requirements
   - Lighting notes

3. Technical Requirements:
   - Special equipment needed
   - VFX notes
   - Practical effects
   - Key props or set pieces
   - Safety considerations

4. Emotional Context:
   - Character emotional states
   - Scene mood
   - Color palette suggestions
   - Musical/sound cues

Format the response as a structured JSON object that can be easily parsed and stored.`;

router.post('/process-script', async (req, res) => {
  try {
    const { script, scriptId, userId } = req.body;
    
    if (!script || !scriptId || !userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Generate a unique folder ID for this storyboard
    const folderId = uuidv4();
    
    // Process the script with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { 
          role: 'system', 
          content: STORYBOARD_PROMPT 
        },
        { 
          role: 'user', 
          content: script 
        }
      ],
      response_format: { type: "json_object" }
    });

    const storyboardData = JSON.parse(completion.choices[0].message.content);

    // Save storyboard data to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('storyboards')
      .upload(
        `${userId}/${folderId}/storyboard.json`,
        JSON.stringify(storyboardData, null, 2),
        {
          contentType: 'application/json',
          cacheControl: '3600'
        }
      );

    if (storageError) {
      throw storageError;
    }

    // Save reference in the database
    const { error: dbError } = await supabase
      .from('scenes')
      .insert(storyboardData.scenes.map(scene => ({
        script_id: scriptId,
        name: scene.title,
        scene_number: scene.sceneNumber,
        location: scene.location,
        time_of_day: scene.timeOfDay,
        characters: scene.characters,
        description: scene.description,
        frame_count: scene.shots.length,
        tone: scene.emotionalContext.mood,
        technical_notes: JSON.stringify(scene.technicalRequirements),
        storyboard_folder_id: folderId
      })));

    if (dbError) {
      throw dbError;
    }

    res.json({
      message: 'Storyboard generated successfully',
      folderId,
      scenes: storyboardData.scenes
    });
  } catch (error) {
    console.error('Error processing script:', error);
    res.status(500).json({ error: 'Failed to process script' });
  }
});

export default router;
