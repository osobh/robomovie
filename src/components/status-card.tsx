import { LucideIcon } from "lucide-react";

interface StatusCardProps {
  title: string;
  stats: {
    total: number;
    inProgress?: number;
    new?: number;
    rendering?: number;
    completed: number;
  };
  icon: LucideIcon;
  color: string;
}

export function StatusCard({
  title,
  stats,
  icon: Icon,
  color,
}: StatusCardProps) {
  const getProgressColor = (type: string) => {
    switch (type) {
      case "completed":
        return "text-green-500";
      case "inProgress":
      case "rendering":
        return "text-yellow-500";
      case "new":
        return "text-blue-500";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className={`bg-[#1A1A1A] rounded-lg p-6 border-l-4 ${color}`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-lg ${color.replace("border", "bg")}/10`}>
          <Icon className={`w-6 h-6 ${color.replace("border", "text")}`} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-gray-400">Total: {stats.total}</p>
        </div>
      </div>

      <div className="space-y-2">
        {stats.new !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">New</span>
            <span className={`text-sm font-medium ${getProgressColor("new")}`}>
              {stats.new}
            </span>
          </div>
        )}

        {stats.inProgress !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">In Progress</span>
            <span
              className={`text-sm font-medium ${getProgressColor(
                "inProgress"
              )}`}
            >
              {stats.inProgress}
            </span>
          </div>
        )}

        {stats.rendering !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Rendering</span>
            <span
              className={`text-sm font-medium ${getProgressColor("rendering")}`}
            >
              {stats.rendering}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Completed</span>
          <span
            className={`text-sm font-medium ${getProgressColor("completed")}`}
          >
            {stats.completed}
          </span>
        </div>
      </div>
    </div>
  );
}
