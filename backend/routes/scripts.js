import { Router } from 'express';
import { saveScript, deleteScript } from '../services/storage.js';

const router = Router();

// Save script endpoint
router.post('/scripts/save', async (req, res) => {
  try {
    const { userId, title, content, metadata } = req.body;

    // Validate required parameters
    if (!userId || !title || !content) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: { userId, title, content }
      });
    }

    // Save script and metadata
    const result = await saveScript(userId, title, content, metadata);
    res.json(result);
  } catch (error) {
    console.error('Error saving script:', error);
    res.status(500).json({ error: 'Failed to save script' });
  }
});

// Delete script endpoint
router.delete('/scripts/delete/:userId/:fileId', async (req, res) => {
  try {
    const { userId, fileId } = req.params;

    // Validate required parameters
    if (!userId || !fileId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: { userId, fileId }
      });
    }

    // Delete script and metadata
    await deleteScript(userId, fileId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting script:', error);
    res.status(500).json({ error: 'Failed to delete script' });
  }
});

export default router;
