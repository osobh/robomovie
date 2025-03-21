import { Router } from 'express';
import { openai } from '../services/openai.js';
import { initializeStorage, saveScript } from '../services/storage.js';

const router = Router();

// Initialize storage directories when server starts
initializeStorage().catch(console.error);

// Route to generate a script
router.post('/generate-script', async (req, res) => {
  try {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const { title, genre, lengthMinutes, numberOfScenes, topic, userId } = req.body;

    // Validate required parameters
    if (!title || !genre || !lengthMinutes || !numberOfScenes || !topic || !userId) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: { title, genre, lengthMinutes, numberOfScenes, topic, userId }
      });
    }

    let generatedScript = '';

    const prompt1 = `You are an experienced professional screenwriter renowned for creating compelling and original movie scripts. Using your expertise, generate an engaging and creatively precise ${genre} movie script with the following details:

    Title: ${title}
    Genre: ${genre}
    Target Length: 1 minute
    Number of Scenes: ${numberOfScenes} (for a 1-minute film, assume 1-2 scenes)
    Topic/Theme: ${topic}

    Requirements:
    1. **Narrative & Structure:**  
      - Follow the pacing and narrative style typical of ${genre} films.
      - Develop a clear story arc over exactly ${numberOfScenes} scene(s).
      - Each scene should be approximately 200 words (about 3 paragraphs).
    2. **Genre-Specific Elements:**  
      - Include genre-appropriate settings, character archetypes, and plot elements.
      - Incorporate common ${genre} tropes with creative twists.
      - Maintain a consistent tone and atmosphere that fits the ${genre} style.
    3. **Screenplay Formatting:**  
      - Use standard screenplay format including scene headings (INT./EXT., location, time of day), action descriptions, dialogue, parentheticals when needed, and transitions.

    Output:
    - The script must be creative, engaging, and formatted as a professional screenplay.
    - Ensure the narrative flows smoothly across all scenes.
    Generate the movie script based on these instructions.`;

    const prompt5 = `You are an experienced professional screenwriter renowned for creating compelling and original movie scripts. Using your expertise, generate an engaging and creatively precise ${genre} movie script with the following details:

    Title: ${title}
    Genre: ${genre}
    Target Length: 5 minutes
    Number of Scenes: ${numberOfScenes} (for a 5-minute film, assume 3-4 scenes)
    Topic/Theme: ${topic}

    Requirements:
    1. **Narrative & Structure:**  
      - Follow the pacing, structure, and narrative style typical of ${genre} films.
      - Develop a coherent story arc over exactly ${numberOfScenes} scene(s).
      - Each scene should be approximately 600-700 words (roughly 4-5 paragraphs) to allow for richer detail.
    2. **Genre-Specific Elements:**  
      - Craft settings, character archetypes, and plot elements that suit the ${genre}.
      - Incorporate common ${genre} tropes with unique twists.
      - Maintain a tone and atmosphere consistent with the ${genre} style.
    3. **Screenplay Formatting:**  
      - Use standard screenplay format including scene headings, vivid action descriptions, proper dialogue formatting, and clear scene transitions.

    Output:
    - The script should be creative, engaging, and professionally formatted.
    - Ensure smooth narrative flow across all scenes.
    Generate the movie script based on these instructions.`;

    const prompt15 = `You are an experienced professional screenwriter renowned for creating compelling and original movie scripts. Using your expertise, generate an engaging and creatively precise ${genre} movie script with the following details:

    Title: ${title}
    Genre: ${genre}
    Target Length: 15 minutes
    Number of Scenes: ${numberOfScenes} (for a 15-minute film, assume 8-10 scenes)
    Topic/Theme: ${topic}

    Requirements:
    1. **Narrative & Structure:**  
      - Follow the pacing and narrative style typical of ${genre} films.
      - Develop a clear story arc across exactly ${numberOfScenes} scene(s).
      - Each scene should be detailed with approximately 800-1000 words (around 5-6 paragraphs) to capture complexity.
    2. **Genre-Specific Elements:**  
      - Craft detailed settings, character dynamics, and plot elements that fit the ${genre}.
      - Integrate common ${genre} tropes along with innovative twists.
      - Keep a consistent tone and atmospheric detail that matches the ${genre} style.
    3. **Screenplay Formatting:**  
      - Use standard screenplay format with scene headings, detailed action descriptions, dialogue (with proper character and parenthetical formatting), and clear transitions.

    Output:
    - The script must be engaging, creative, and formatted as a professional screenplay.
    - Ensure each scene contributes meaningfully to the overall narrative.
    Generate the movie script based on these instructions.`;

    const prompt30 = `You are an experienced professional screenwriter renowned for creating compelling and original movie scripts. Using your expertise, generate an engaging and creatively precise ${genre} movie script with the following details:

    Title: ${title}
    Genre: ${genre}
    Target Length: 30 minutes
    Number of Scenes: ${numberOfScenes} (for a 30-minute film, assume 15-20 scenes)
    Topic/Theme: ${topic}

    Requirements:
    1. **Narrative & Structure:**  
      - Follow the pacing, structure, and narrative style typical of ${genre} films.
      - Develop a complex, coherent story arc over exactly ${numberOfScenes} scene(s).
      - Each scene should be approximately 600-800 words (around 5-7 paragraphs) to provide rich detail.
    2. **Genre-Specific Elements:**  
      - Create detailed settings, characters, and plot twists that align with the ${genre}.
      - Incorporate familiar ${genre} tropes while introducing unique elements.
      - Maintain a consistent tone and atmosphere reflective of the ${genre} style.
    3. **Screenplay Formatting:**  
      - Use standard screenplay format including well-defined scene headings, vivid action descriptions, properly formatted dialogue, and clear transitions.

    Output:
    - The script should be creative, engaging, and formatted as a professional screenplay.
    - Ensure a smooth and meaningful narrative flow across all scenes.
    Generate the movie script based on these instructions.`;

    const prompt60 = `You are an experienced professional screenwriter renowned for creating compelling and original movie scripts. Using your expertise, generate an engaging and creatively precise ${genre} movie script with the following details:

    Title: ${title}
    Genre: ${genre}
    Target Length: 60 minutes
    Number of Scenes: ${numberOfScenes} (for a 60-minute film, assume 30-40 scenes)
    Topic/Theme: ${topic}

    Requirements:
    1. **Narrative & Structure:**  
      - Follow the pacing, structure, and narrative style typical of ${genre} films.
      - Develop a well-crafted and intricate story arc spread over exactly ${numberOfScenes} scene(s).
      - Each scene should be detailed with approximately 800-1000 words (around 6-8 paragraphs) to fully develop the narrative.
    2. **Genre-Specific Elements:**  
      - Develop detailed settings, complex character interactions, and intricate plot elements that suit the ${genre}.
      - Incorporate common ${genre} tropes and conventions, while adding innovative twists and depth.
      - Ensure a consistent tone and atmospheric detail throughout the script.
    3. **Screenplay Formatting:**  
      - Use standard screenplay format including scene headings, comprehensive action descriptions, properly formatted dialogue, and seamless transitions between scenes.

    Output:
    - The script must be creative, engaging, and formatted as a professional screenplay.
    - Ensure that every scene contributes to a cohesive and impactful narrative.
    Generate the movie script based on these instructions.`;

    // Select the appropriate prompt based on length
    let selectedPrompt;
    switch (lengthMinutes) {
      case 1:
        selectedPrompt = prompt1;
        break;
      case 5:
        selectedPrompt = prompt5;
        break;
      case 15:
        selectedPrompt = prompt15;
        break;
      case 30:
        selectedPrompt = prompt30;
        break;
      case 60:
        selectedPrompt = prompt60;
        break;
      default:
        selectedPrompt = prompt5; // Default to 5 minutes
    }

    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: selectedPrompt }],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        // Accumulate the script content
        generatedScript += content;
        // Send the chunk to the client
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Create metadata object
    const metadata = {
      title,
      genre,
      numberOfScenes,
      lengthMinutes,
      topic,
      createdAt: new Date().toISOString()
    };

    // Send completion message with metadata
    res.write(`data: ${JSON.stringify({ 
      status: 'complete',
      content: generatedScript,
      metadata
    })}\n\n`);
    
    // Send final message
    res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Error generating script:', error);
    res.status(500).json({ error: 'Failed to generate script' });
  }
});

export default router;
