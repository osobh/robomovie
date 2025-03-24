import { useVideoEditorStore } from '@/lib/store/video-editor';
import { 
  Save, 
  Download, 
  Library, 
  ZoomIn, 
  ZoomOut, 
  Clock,
  Play,
  Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MenuList() {
  const { 
    selectedScene,
    player: { isPlaying },
    currentFrame,
    togglePlayback 
  } = useVideoEditorStore();

  if (!selectedScene) return null;

  const formatTime = (frame: number) => {
    const seconds = Math.floor(frame / 30);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-0 left-0 right-0 h-12 bg-[#1A1A1A] border-b border-[#2A2A2A] flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-400">Scene {selectedScene.number}</span>
        <span className="text-sm text-white">{selectedScene.title}</span>
      </div>

      <div className="flex items-center space-x-2">
        {/* Media Library */}
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
          onClick={() => {}}
        >
          <Library className="w-4 h-4 mr-1" />
          Media
        </Button>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1 px-2 border-l border-r border-[#2A2A2A]">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={() => {}}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-400">100%</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={() => {}}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Time Display */}
        <div className="flex items-center space-x-2 px-2 border-r border-[#2A2A2A]">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-white font-mono">{formatTime(currentFrame)}</span>
        </div>

        {/* Playback Controls */}
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
          onClick={() => togglePlayback()}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>

        {/* Export Controls */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={() => {}}
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={() => {}}
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MenuList;
