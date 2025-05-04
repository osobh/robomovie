import { useNavigate } from "react-router-dom";
import { Plus, Upload, Layout } from "lucide-react";

interface QuickAccessButton {
  label: string;
  icon: React.ElementType;
  action: () => void;
  color: string;
}

interface QuickAccessButtonsProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function QuickAccessButtons({ fileInputRef }: QuickAccessButtonsProps) {
  const navigate = useNavigate();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const buttons: QuickAccessButton[] = [
    {
      label: "New Script",
      icon: Plus,
      action: () => navigate("/script"),
      color: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    },
    {
      label: "Upload Script",
      icon: Upload,
      action: handleUploadClick,
      color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    },
    {
      label: "Go to Storyboards",
      icon: Layout,
      action: () => navigate("/storyboard"),
      color: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
    },
  ];

  return (
    <div className="flex flex-wrap gap-4 mb-8">
      {buttons.map((button) => (
        <button
          key={button.label}
          onClick={button.action}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${button.color}`}
        >
          <button.icon className="w-5 h-5" />
          <span className="font-medium">{button.label}</span>
        </button>
      ))}
    </div>
  );
}
