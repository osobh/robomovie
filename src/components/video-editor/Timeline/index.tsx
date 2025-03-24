import { useTimelineStore } from '@/lib/store/timeline';
import { Track } from '@/components/video-editor/Timeline/Track';
import { TimeRuler } from '@/components/video-editor/Timeline/TimeRuler';
import { useTimelineShortcuts } from '@/lib/hooks/use-timeline-shortcuts';
import { Film, Volume2, Type, ZoomIn, ZoomOut } from 'lucide-react';
import { StateManager } from '@/lib/types/timeline';

interface TimelineProps {
  className?: string;
  stateManager: StateManager;
}

export function Timeline({ className, stateManager }: TimelineProps) {
  const { tracks, zoom } = useTimelineStore();
  
  // Enable keyboard shortcuts
  useTimelineShortcuts();

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Timeline Controls */}
      <div className="flex items-center justify-between p-2 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              className="p-1.5 text-xs bg-[#2A2A2A] text-gray-400 rounded hover:bg-[#3A3A3A] transition-colors"
              onClick={() => useTimelineStore.getState().addTrack('video', 'Video Track')}
              title="Add Video Track (V)"
            >
              <Film className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 text-xs bg-[#2A2A2A] text-gray-400 rounded hover:bg-[#3A3A3A] transition-colors"
              onClick={() => useTimelineStore.getState().addTrack('audio', 'Audio Track')}
              title="Add Audio Track (A)"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 text-xs bg-[#2A2A2A] text-gray-400 rounded hover:bg-[#3A3A3A] transition-colors"
              onClick={() => useTimelineStore.getState().addTrack('text', 'Text Track')}
              title="Add Text Track (T)"
            >
              <Type className="w-4 h-4" />
            </button>
          </div>
          <div className="h-4 w-px bg-[#2A2A2A]" />
          <div className="flex items-center gap-2">
            <button
              className="p-1.5 text-xs bg-[#2A2A2A] text-gray-400 rounded hover:bg-[#3A3A3A] transition-colors"
              onClick={() => useTimelineStore.getState().setZoom(Math.max(0.5, zoom - 0.5))}
              title="Zoom Out (Cmd/Ctrl + -)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 text-xs bg-[#2A2A2A] text-gray-400 rounded hover:bg-[#3A3A3A] transition-colors"
              onClick={() => useTimelineStore.getState().setZoom(Math.min(2, zoom + 0.5))}
              title="Zoom In (Cmd/Ctrl + =)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Time Ruler */}
      <TimeRuler />

      {/* Tracks Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1">
        {tracks.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            No tracks added. Click the buttons above to add tracks.
          </div>
        ) : (
          tracks
            .sort((a, b) => a.order - b.order)
            .map((track) => (
              <Track
                key={track.id}
                track={track}
                stateManager={stateManager}
              />
            ))
        )}
        </div>
      </div>
    </div>
  );
}
