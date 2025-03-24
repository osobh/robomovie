import { useVideoEditorStore } from '@/lib/store/video-editor';
import { 
  Settings, 
  Volume2, 
  Film,
  Type,
  Palette,
  Wand2,
  SlidersHorizontal,
  Layers,
  ChevronDown,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ControlPanelProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function ControlPanel({ title, icon, children }: ControlPanelProps) {
  return (
    <div className="mb-4 border-b border-[#2A2A2A] pb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm text-white">{title}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>
      {children}
    </div>
  );
}

export function ControlList() {
  const { selectedScene, sceneMediaStatus } = useVideoEditorStore();

  if (!selectedScene) return null;

  const mediaStatus = sceneMediaStatus[selectedScene.id];

  return (
    <div className="absolute top-12 right-0 w-72 h-[calc(100%-48px)] bg-[#1A1A1A] border-l border-[#2A2A2A] overflow-y-auto">
      <div className="p-4">
        {/* Media Status */}
        <ControlPanel 
          title="Media Status" 
          icon={<Layers className="w-4 h-4 text-[#1ABC9C]" />}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[#1ABC9C]" />
                <span className="text-sm text-gray-400">Video</span>
              </div>
              <span className="text-sm text-white">{mediaStatus?.video.status || 'pending'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#1ABC9C]" />
                <span className="text-sm text-gray-400">Audio</span>
              </div>
              <span className="text-sm text-white">{mediaStatus?.audio.status || 'pending'}</span>
            </div>
          </div>
        </ControlPanel>

        {/* Text Controls */}
        <ControlPanel 
          title="Text" 
          icon={<Type className="w-4 h-4 text-[#1ABC9C]" />}
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-[#2A2A2A] text-white border-[#3A3A3A] hover:bg-[#3A3A3A]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Text
          </Button>
        </ControlPanel>

        {/* Color Controls */}
        <ControlPanel 
          title="Colors" 
          icon={<Palette className="w-4 h-4 text-[#1ABC9C]" />}
        >
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 cursor-pointer hover:opacity-80"
              />
            ))}
          </div>
        </ControlPanel>

        {/* Effects */}
        <ControlPanel 
          title="Effects" 
          icon={<Wand2 className="w-4 h-4 text-[#1ABC9C]" />}
        >
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-[#2A2A2A] text-white border-[#3A3A3A] hover:bg-[#3A3A3A]"
            >
              Browse Effects
            </Button>
          </div>
        </ControlPanel>

        {/* Transitions */}
        <ControlPanel 
          title="Transitions" 
          icon={<SlidersHorizontal className="w-4 h-4 text-[#1ABC9C]" />}
        >
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-[#2A2A2A] text-white border-[#3A3A3A] hover:bg-[#3A3A3A]"
            >
              Browse Transitions
            </Button>
          </div>
        </ControlPanel>

        {/* Settings */}
        <ControlPanel 
          title="Settings" 
          icon={<Settings className="w-4 h-4 text-[#1ABC9C]" />}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Generator</label>
              <div className="text-sm text-white">{selectedScene.generator || 'runway'}</div>
            </div>
            {selectedScene.comments && (
              <div>
                <label className="text-xs text-gray-400 block mb-1">Comments</label>
                <div className="text-sm text-white">{selectedScene.comments}</div>
              </div>
            )}
          </div>
        </ControlPanel>
      </div>
    </div>
  );
}

export default ControlList;
