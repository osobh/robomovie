import { useState, useEffect, useCallback } from "react";
import { FileText, Film, Layout, AlertCircle } from "lucide-react";
import { useServerStatus } from "@/lib/hooks/use-server-status";
import { useAuth } from "@/lib/auth";
import { UploadCard } from "@/components/upload-card";
import { GenerateScriptCard } from "@/components/generate-script-card";
import { QuickAccessButtons } from "@/components/quick-access-buttons";
import { StatusCard } from "@/components/status-card";
import { ActivityTimeline } from "@/components/activity-timeline";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface DetailedStats {
  scripts: {
    total: number;
    new: number;
    completed: number;
  };
  storyboards: {
    total: number;
    inProgress: number;
    completed: number;
  };
  videoGeneration: {
    total: number;
    rendering: number;
    completed: number;
  };
}

interface Activity {
  id: string;
  type:
    | "script-upload"
    | "storyboard-complete"
    | "video-rendering"
    | "video-complete";
  title: string;
  timestamp: string;
  status?: string;
  metadata?: {
    fileSize?: string;
    duration?: string;
    progress?: number;
    error?: string;
  };
}

export function Dashboard() {
  const { user } = useAuth();
  const isServerRunning = useServerStatus();
  const [stats, setStats] = useState<DetailedStats>({
    scripts: {
      total: 0,
      new: 0,
      completed: 0,
    },
    storyboards: {
      total: 0,
      inProgress: 0,
      completed: 0,
    },
    videoGeneration: {
      total: 0,
      rendering: 0,
      completed: 0,
    },
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!isServerRunning || !user) return;

    try {
      const response = await fetch(
        `${API_URL}/api/dashboard/recent-activity/${user.id}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch recent activities");
      }
      const data = await response.json();
      setActivities(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError("Failed to load recent activities");
    } finally {
      setIsLoadingActivities(false);
    }
  }, [isServerRunning, user, setActivities, setError, setIsLoadingActivities]);

  const fetchDashboardData = useCallback(async () => {
    if (!isServerRunning || !user) return;

    try {
      const statsResponse = await fetch(
        `${API_URL}/api/dashboard/stats/${user.id}`
      );
      if (!statsResponse.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      const dashboardStats = await statsResponse.json();
      setStats(dashboardStats);
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    }
  }, [isServerRunning, user, setStats, setError]);

  useEffect(() => {
    fetchDashboardData();
    fetchActivities();
  }, [fetchDashboardData, fetchActivities]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-[#FFA500]">Dashboard</h1>
        <p className="text-lg text-gray-300 mt-2">
          Overview of your movie creation progress
        </p>
      </div>

      {!isServerRunning && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-md text-yellow-500 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Server is not running. Please start the server to view dashboard data.
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-md text-red-500 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <QuickAccessButtons />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatusCard
          title="Scripts"
          stats={stats.scripts}
          icon={FileText}
          color="border-[#1ABC9C]"
        />
        <StatusCard
          title="Storyboards"
          stats={stats.storyboards}
          icon={Layout}
          color="border-purple-500"
        />
        <StatusCard
          title="Video Generation"
          stats={stats.videoGeneration}
          icon={Film}
          color="border-[#FFA500]"
        />
      </div>

      <ActivityTimeline
        activities={activities}
        isLoading={isLoadingActivities}
      />

      {/* Script Management Cards */}
      <div className="space-y-6">
        <UploadCard
          onUploadComplete={(files) => {
            console.log("Files uploaded successfully:", files);
            fetchDashboardData();
          }}
        />
        <GenerateScriptCard />
      </div>
    </div>
  );
}
