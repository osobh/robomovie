import { Router } from 'express';

const router = Router();

// Add theatre routes here
router.get('/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Implement movie retrieval logic
    res.json({ message: 'Movie details retrieved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve movie' });
  }
});

export default router;
