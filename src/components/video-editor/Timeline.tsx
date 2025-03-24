import { Timeline as TimelineUI } from './Timeline/index';
import { useVideoEditorStore } from '@/lib/store/video-editor';

interface TimelineProps {
  stateManager: any; // TODO: Add proper type from @designcombo/state
}

export function Timeline({ stateManager }: TimelineProps) {
  const { selectedScene } = useVideoEditorStore();

  if (!selectedScene) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        Select a scene to show timeline
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#1A1A1A] flex flex-col">
      <TimelineUI className="flex-1" stateManager={stateManager} />
    </div>
  );
}

// Re-export for backward compatibility
export { Timeline as TimelineComponent };
