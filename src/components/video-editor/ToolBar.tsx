import { 
  MousePointer2, 
  Scissors, 
  Type, 
  Square, 
  Wand2 
} from 'lucide-react';
import { useState } from 'react';

type Tool = 'select' | 'cut' | 'text' | 'shape' | 'effects';

interface ToolButtonProps {
  icon: React.ReactNode;
  shortcut: string;
  isActive: boolean;
  onClick: () => void;
}

function ToolButton({ icon, shortcut, isActive, onClick }: ToolButtonProps) {
  return (
    <button
      className={`
        relative group p-2 rounded-lg transition-colors
        ${isActive ? 'bg-[#2A2A2A] text-[#1ABC9C]' : 'text-gray-400 hover:bg-[#2A2A2A] hover:text-white'}
      `}
      onClick={onClick}
    >
      {icon}
      {/* Tooltip */}
      <div className="absolute left-full ml-2 px-2 py-1 bg-[#2A2A2A] rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {shortcut}
      </div>
    </button>
  );
}

export function ToolBar() {
  const [activeTool, setActiveTool] = useState<Tool>('select');

  return (
    <div className="absolute left-0 top-12 bottom-0 w-12 bg-[#1A1A1A] border-r border-[#2A2A2A] flex flex-col items-center gap-1 p-2">
      <ToolButton
        icon={<MousePointer2 className="w-5 h-5" />}
        shortcut="V"
        isActive={activeTool === 'select'}
        onClick={() => setActiveTool('select')}
      />
      <ToolButton
        icon={<Scissors className="w-5 h-5" />}
        shortcut="C"
        isActive={activeTool === 'cut'}
        onClick={() => setActiveTool('cut')}
      />
      <ToolButton
        icon={<Type className="w-5 h-5" />}
        shortcut="T"
        isActive={activeTool === 'text'}
        onClick={() => setActiveTool('text')}
      />
      <ToolButton
        icon={<Square className="w-5 h-5" />}
        shortcut="S"
        isActive={activeTool === 'shape'}
        onClick={() => setActiveTool('shape')}
      />
      <ToolButton
        icon={<Wand2 className="w-5 h-5" />}
        shortcut="E"
        isActive={activeTool === 'effects'}
        onClick={() => setActiveTool('effects')}
      />
    </div>
  );
}
