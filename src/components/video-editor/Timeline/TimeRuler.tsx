import { useVideoEditorStore } from '@/lib/store/video-editor';
import { useTimelineStore } from '@/lib/store/timeline';

interface TimeRulerProps {
  className?: string;
}

export function TimeRuler({ className }: TimeRulerProps) {
  const { zoom } = useTimelineStore();
  const { currentFrame } = useVideoEditorStore();

  // Calculate ruler marks
  const duration = 30; // 30 seconds total
  const majorInterval = 5; // Major mark every 5 seconds
  const minorInterval = 1; // Minor mark every 1 second
  const pixelsPerSecond = 20 * zoom; // Increased base width for better visibility

  const marks = [];
  for (let i = 0; i <= duration; i += minorInterval) {
    const isMajor = i % majorInterval === 0;
    const frame = i * 30; // Convert seconds to frames
    marks.push(
      <div
        key={i}
        className="absolute top-0 flex flex-col items-center"
        style={{ left: `${i * pixelsPerSecond}px` }}
      >
        <div
          className={`
            w-px bg-gray-600
            ${isMajor ? 'h-3' : 'h-2'}
          `}
        />
        {/* Frame number */}
        <div className="text-[10px] text-gray-400 mt-1">
          {frame}
        </div>
        {/* Time in seconds */}
        {isMajor && (
          <div className="text-[10px] text-gray-500">
            {i}s
          </div>
        )}
      </div>
    );
  }

  // Playhead
  const playheadPosition = (currentFrame / 30) * pixelsPerSecond;

  const handleMouseDown = (e: React.MouseEvent) => {
    const ruler = e.currentTarget;
    const rect = ruler.getBoundingClientRect();
    const updatePlayhead = (clientX: number) => {
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const frame = Math.round((x / pixelsPerSecond) * 30);
      useVideoEditorStore.getState().setCurrentFrame(frame);
    };

    updatePlayhead(e.clientX);

    const handleMouseMove = (e: MouseEvent) => {
      updatePlayhead(e.clientX);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="relative">
      {/* Frame Numbers */}
      <div className="h-10 bg-[#1A1A1A] border-b border-[#2A2A2A] flex items-end">
        <div 
          className={`relative h-8 w-full ${className} cursor-pointer`}
          onMouseDown={handleMouseDown}
        >
          {/* Ruler Background */}
          <div className="absolute inset-0">
            {marks}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-px bg-[#1ABC9C] pointer-events-none"
            style={{ left: `${playheadPosition}px` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1ABC9C] rotate-45" />
          </div>

          {/* Current Frame Display */}
          <div className="absolute top-1 right-2 px-2 py-0.5 bg-[#2A2A2A] rounded text-xs text-white">
            Frame {currentFrame}
          </div>
        </div>
      </div>

      {/* Zoom Level */}
      <div className="absolute top-1 left-2 px-2 py-0.5 bg-[#2A2A2A] rounded text-xs text-gray-400">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
