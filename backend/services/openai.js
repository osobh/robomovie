import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

if (!process.env.OPENAI_API_KEY) {
  console.error(`
    Error: OPENAI_API_KEY is not set in environment variables.
    Please ensure the following:
    1. A .env file exists in the correct directory (../.env relative to this file).
    2. The .env file contains a line like: OPENAI_API_KEY=your_api_key_here
    3. The dotenv package is correctly installed and configured.
    4. Restart the server after making changes to the .env file.
  `);
  process.exit(1);
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
