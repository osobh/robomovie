import { formatDistanceToNow } from "date-fns";

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

interface ActivityTimelineProps {
  activities: Activity[];
  isLoading: boolean;
}

const ACTIVITY_ICONS = {
  "script-upload": "📝",
  "storyboard-complete": "🎬",
  "video-rendering": "⏳",
  "video-complete": "✅",
} as const;

const ACTIVITY_LABELS = {
  "script-upload": "Uploaded script",
  "storyboard-complete": "Completed storyboard for",
  "video-rendering": "Started rendering video",
  "video-complete": "Completed video",
} as const;

function ActivityItem({ activity }: { activity: Activity }) {
  const icon = ACTIVITY_ICONS[activity.type];
  const label = ACTIVITY_LABELS[activity.type];
  const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
  });

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-800 last:border-0">
      <div className="text-xl">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-300">
          {label}{" "}
          <span className="font-medium text-white">"{activity.title}"</span>
        </p>
        <p className="text-sm text-gray-500">{timeAgo}</p>
        {activity.status && (
          <p className="text-sm text-gray-400 mt-1">{activity.status}</p>
        )}
      </div>
    </div>
  );
}

export function ActivityTimeline({
  activities,
  isLoading,
}: ActivityTimelineProps) {
  if (isLoading) {
    return (
      <div className="bg-[#1A1A1A] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse flex items-start gap-3 py-3 border-b border-gray-800 last:border-0"
            >
              <div className="w-6 h-6 bg-gray-700 rounded" />
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-700 rounded w-1/4 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="bg-[#1A1A1A] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Recent Activity
        </h2>
        <p className="text-gray-400">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
      <div className="space-y-1">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}
