import { Router } from 'express';
import { openai } from '../services/openai.js';

const router = Router();

router.post('/generate-reference', async (req, res) => {
  try {
    const { shot, scene } = req.body;
    
    if (!shot || !scene) {
      return res.status(400).json({ error: 'Missing shot or scene data' });
    }

    console.log('Reference image request:', {
      scene: {
        number: scene.sceneNumber,
        location: scene.location,
        timeOfDay: scene.timeOfDay,
        mood: scene.emotionalContext.mood,
        colors: scene.emotionalContext.colorPalette
      },
      shot: {
        number: shot.number,
        angle: shot.angle,
        movement: shot.movement,
        action: shot.action,
        lighting: shot.lighting,
        effects: shot.effects,
        scriptSegment: shot.scriptSegment,
        dialogue: shot.dialogue
      }
    });

    // Construct a single-sentence prompt
    const prompt = `A cinematic ${shot.angle} shot of ${shot.action} in ${scene.location} during ${scene.timeOfDay}, with ${shot.lighting} lighting and ${shot.effects}, capturing a ${scene.emotionalContext.mood} mood.`;

    // Log the prompt for debugging
    console.log('Generated prompt:', prompt);

    // Generate the image with base64 format
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      response_format: "b64_json"  // Get base64 instead of URL
    });

    // Log detailed response for debugging
    console.log('Original prompt:', prompt);
    console.log('DALL-E Response:', {
      data: imageResponse.data,
      revised_prompt: imageResponse.data[0]?.revised_prompt
    });

    // Verify we have base64 data before proceeding
    if (!imageResponse.data[0]?.b64_json) {
      throw new Error('No image data in DALL-E response');
    }

    // Get the base64 data and include revised prompt
    const imageData = imageResponse.data[0].b64_json;
    
    res.json({ 
      success: true,
      imageData,
      revisedPrompt: imageResponse.data[0].revised_prompt,
      message: 'Reference image generated successfully'
    });
  } catch (error) {
    console.error('Error generating reference image:', error);

    // Handle other OpenAI errors
    const errorMessage = error.response?.data?.error?.message || error.message;
    const statusCode = error.response?.status || 500;

    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Failed to generate reference image'
    });
  }
});

export default router;
