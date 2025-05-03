import { Router } from "express";
import { openai } from "../services/openai.js";

const router = Router();

router.post("/generate-reference", async (req, res) => {
  try {
    const { shot, scene } = req.body;

    if (!shot || !scene) {
      return res.status(400).json({ error: "Missing shot or scene data" });
    }

    // Extract only the necessary data for image generation
    const shotData = {
      scene: {
        location: scene.location,
        timeOfDay: scene.timeOfDay,
        mood: scene.emotionalContext?.mood || "",
      },
      shot: {
        angle: shot.angle,
        lighting: shot.lighting,
        effects: shot.effects,
        action: shot.action,
      },
    };

    console.log("Reference image request:", shotData);

    // Construct a detailed prompt utilizing GPT-Image-1's larger context window
    const prompt = `
Scene Description:
Location: ${shotData.scene.location || "unspecified location"}
Time of Day: ${shotData.scene.timeOfDay || "daytime"}
${shotData.scene.mood ? `Mood: ${shotData.scene.mood}` : ""}

Shot Technical Details:
- Camera Angle: ${shotData.shot.angle || "standard"} shot
- Lighting Setup: ${shotData.shot.lighting || "natural"} lighting
- Visual Effects: ${shotData.shot.effects || "no"} effects

Action Description:
${shotData.shot.action || "standard scene"}

Additional Context:
This is a cinematic shot for a professional film production. The image should maintain high production value and cinematic quality, with attention to composition, depth, and visual storytelling.
`.trim();

    // Log the prompt for debugging
    console.log("Generated prompt:", prompt);

    // Generate the image with GPT-Image-1
    const imageResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      size: "1024x1024",
      quality: "high",
      output_format: "webp",
      output_compression: 85,
      background: "auto",
      moderation: "auto",
    });

    // Log response for debugging (excluding the actual image data)
    console.log("GPT-Image-1 Response:", {
      success: !!imageResponse.data,
      timestamp: new Date().toISOString(),
    });

    // GPT-Image-1 returns base64 data in b64_json property
    const base64ImageData = imageResponse.data[0]?.b64_json;
    if (!base64ImageData) {
      throw new Error("No image data in response");
    }

    // Log response structure for debugging (excluding the actual base64 data)
    console.log("GPT-Image-1 Response structure:", {
      hasData: !!imageResponse.data,
      firstResult: imageResponse.data[0]
        ? Object.keys(imageResponse.data[0])
        : null,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      imageData: base64ImageData,
      contentType: "image/webp",
      message: "Reference image generated successfully",
      format: "webp",
      quality: "high",
      size: "1024x1024",
    });
  } catch (error) {
    console.error("Error generating reference image:", error);

    let errorMessage = "Failed to generate reference image";
    let statusCode = 500;

    // Handle specific GPT-Image-1 errors
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;

      // Check for moderation flags
      if (apiError.code === "content_moderation") {
        errorMessage = "Content moderation flagged the request";
        statusCode = 400;
      }
      // Check for rate limits
      else if (apiError.code === "rate_limit_exceeded") {
        errorMessage = "Rate limit exceeded, please try again later";
        statusCode = 429;
      }
      // Handle other API errors
      else {
        errorMessage = apiError.message || errorMessage;
        statusCode = error.response.status || statusCode;
      }
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details:
        error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
