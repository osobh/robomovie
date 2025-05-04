import { Link } from "react-router-dom";
import { Plus, Upload, Layout } from "lucide-react";

interface QuickAccessButton {
  label: string;
  icon: React.ElementType;
  route: string;
  color: string;
}

const buttons: QuickAccessButton[] = [
  {
    label: "New Script",
    icon: Plus,
    route: "/generate-script",
    color: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  },
  {
    label: "Upload Script",
    icon: Upload,
    route: "/upload-scripts",
    color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  },
  {
    label: "Go to Storyboards",
    icon: Layout,
    route: "/storyboards",
    color: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
  },
];

export function QuickAccessButtons() {
  return (
    <div className="flex flex-wrap gap-4 mb-8">
      {buttons.map((button) => (
        <Link
          key={button.route}
          to={button.route}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${button.color}`}
        >
          <button.icon className="w-5 h-5" />
          <span className="font-medium">{button.label}</span>
        </Link>
      ))}
    </div>
  );
}
