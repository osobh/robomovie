import { Router } from "express";
import { supabase } from "../lib/supabase.js";

// Helper function to format bytes
export function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Helper function to add activity
export async function addActivity(
  userId,
  type,
  title,
  status = null,
  metadata = {}
) {
  const { data, error } = await supabase
    .from("activities")
    .insert({
      user_id: userId,
      type,
      title,
      status,
      metadata,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding activity:", error);
    return null;
  }

  return data;
}

const router = Router();

// Get recent activities
router.get("/recent-activity/:userId", async (req, res) => {
  try {
    const { data: activities, error } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", req.params.userId)
      .order("timestamp", { ascending: false })
      .limit(10);

    if (error) throw error;

    res.json(activities);
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res.status(500).json({ error: "Failed to fetch recent activities" });
  }
});

// Get dashboard statistics
router.get("/stats/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get scripts stats
    const { data: scripts, error: scriptsError } = await supabase
      .from("scripts")
      .select("id, created_at")
      .eq("user_id", userId);

    if (scriptsError) throw scriptsError;

    // Get movies stats
    const { data: movies, error: moviesError } = await supabase
      .from("movies")
      .select("id, status")
      .eq("user_id", userId);

    if (moviesError) throw moviesError;

    // Get scenes (storyboards) stats
    const { data: scenes, error: scenesError } = await supabase
      .from("scenes")
      .select("id, script_id, completed")
      .in("script_id", scripts?.map((s) => s.id) || []);

    if (scenesError) throw scenesError;

    // Calculate stats
    const scriptStats = {
      total: scripts?.length || 0,
      new:
        scripts?.filter(
          (s) =>
            new Date(s.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length || 0,
      completed: scripts?.length || 0,
    };

    const storyboardStats = {
      total: scenes?.length || 0,
      inProgress: scenes?.filter((s) => !s.completed)?.length || 0,
      completed: scenes?.filter((s) => s.completed)?.length || 0,
    };

    const videoStats = {
      total: movies?.length || 0,
      rendering: movies?.filter((m) => m.status === "processing")?.length || 0,
      completed: movies?.filter((m) => m.status === "completed")?.length || 0,
    };

    res.json({
      scripts: scriptStats,
      storyboards: storyboardStats,
      videoGeneration: videoStats,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
});

export default router;
