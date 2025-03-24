import { useTimelineStore } from '@/lib/store/timeline';
import { Clip as ClipType } from '@/lib/types/timeline';
import { useCallback } from 'react';

import { StateManager } from '@/lib/types/timeline';

interface ClipProps {
  clip: ClipType;
  trackId: string;
  stateManager: StateManager;
}

export function Clip({ clip, trackId }: ClipProps) {
  const {
    selectedClipId,
    selectClip,
    removeClip,
    resizeClip,
    splitClip,
  } = useTimelineStore();

  const isSelected = selectedClipId === clip.id;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    selectClip(isSelected ? null : clip.id);
  }, [clip.id, isSelected, selectClip]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    removeClip(trackId, clip.id);
  }, [clip.id, trackId, removeClip]);

  const handleSplit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const clipElement = e.currentTarget as HTMLDivElement;
    const rect = clipElement.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const splitTime = clip.startTime + (clickX / rect.width) * (clip.endTime - clip.startTime);
    splitClip(clip.id, splitTime);
  }, [clip, splitClip]);

  return (
    <div
      className={`
        relative group h-full
        ${isSelected ? 'ring-2 ring-[#1ABC9C]' : ''}
        bg-[#2A2A2A] rounded-sm text-xs text-white cursor-pointer
        hover:bg-[#3A3A3A] transition-colors overflow-hidden
      `}
      title={`Double-click to split clip at playhead
Delete/Backspace to remove clip
Cmd/Ctrl + S to split clip at playhead`}
      style={{
        width: '100%',
        minWidth: '30px',
      }}
      onClick={handleClick}
      onDoubleClick={handleSplit}
    >
      {/* Clip Content */}
      <div className="relative h-full">
        {/* Background Content */}
        {clip.type === 'video' && clip.thumbnail && (
          <div className="absolute inset-0">
            <img
              src={clip.thumbnail}
              alt=""
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
          </div>
        )}
        {clip.type === 'audio' && clip.waveform && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={clip.waveform}
              alt=""
              className="w-full h-[40px] object-cover opacity-40"
            />
          </div>
        )}
        
        {/* Clip Info */}
        <div className="relative p-1.5">
          <div className="font-medium truncate text-[10px]">{clip.name}</div>
        </div>
      </div>

      {/* Clip Type Indicator */}
      <div 
        className={`
          absolute top-1 right-1 w-2 h-2 rounded-full
          ${clip.type === 'video' ? 'bg-blue-500' : ''}
          ${clip.type === 'audio' ? 'bg-green-500' : ''}
          ${clip.type === 'text' ? 'bg-yellow-500' : ''}
        `}
        title={`${clip.type.charAt(0).toUpperCase() + clip.type.slice(1)} Clip`}
      />

      {/* Resize Handles */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-[#1ABC9C] transition-all"
        title="Drag to adjust clip start time"
        onMouseDown={(e) => {
          e.stopPropagation();
          const startX = e.clientX;
          const startTime = clip.startTime;

          const handleMouseMove = (e: MouseEvent) => {
            const dx = e.clientX - startX;
            const dt = dx / 10; // 10px per second
            const newStartTime = Math.max(0, startTime + dt);
            if (newStartTime < clip.endTime) {
              resizeClip(clip.id, newStartTime, clip.endTime);
            }
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      />

      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-[#1ABC9C] transition-all"
        title="Drag to adjust clip end time"
        onMouseDown={(e) => {
          e.stopPropagation();
          const startX = e.clientX;
          const startTime = clip.endTime;

          const handleMouseMove = (e: MouseEvent) => {
            const dx = e.clientX - startX;
            const dt = dx / 10; // 10px per second
            const newEndTime = Math.max(clip.startTime, startTime + dt);
            resizeClip(clip.id, clip.startTime, newEndTime);
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      />

      {/* Delete Button */}
      <button
        className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
        title="Delete clip (Delete/Backspace)"
        onClick={handleDelete}
      >
        ×
      </button>
    </div>
  );
}
