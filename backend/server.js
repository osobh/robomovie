import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import uploadRoutes from './routes/upload.js';
import generateScriptRoutes from './routes/generate-script.js';
import storyboardingRoutes from './routes/storyboarding.js';
import movieEditingRoutes from './routes/movie-editing.js';
import audioIntegrationRoutes from './routes/audio-integration.js';
import theatreRoutes from './routes/theatre.js';
import dashboardRoutes from './routes/dashboard.js';
import statsRoutes from './routes/stats.js';
import filesRoutes from './routes/files.js';
import scriptsRoutes from './routes/scripts.js';

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', uploadRoutes);
app.use('/api', generateScriptRoutes);
app.use('/api', storyboardingRoutes);
app.use('/api', movieEditingRoutes);
app.use('/api', audioIntegrationRoutes);
app.use('/api', theatreRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', statsRoutes);
app.use('/api', filesRoutes);
app.use('/api', scriptsRoutes); // Add scripts routes

// Health check endpoint
app.use('/api/health', (req, res) => {
  res.sendStatus(200);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
