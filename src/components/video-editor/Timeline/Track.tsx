import { useTimelineStore } from '@/lib/store/timeline';
import { Track as TrackType } from '@/lib/types/timeline';
import { Volume2, VolumeX, Eye, EyeOff, Lock, Unlock, Trash2, Headphones, Film, Type } from 'lucide-react';
import { Clip } from './Clip';

import { StateManager } from '@/lib/types/timeline';

interface TrackProps {
  track: TrackType;
  stateManager: StateManager;
}

export function Track({ track, stateManager }: TrackProps) {
  const {
    selectedTrackId,
    selectTrack,
    toggleTrackLock,
    toggleTrackVisibility,
    setTrackVolume,
    removeTrack,
  } = useTimelineStore();

  const isSelected = selectedTrackId === track.id;

  return (
    <div
      className={`
        flex items-center gap-2 p-2 rounded
        ${isSelected ? 'bg-[#3A3A3A]' : 'bg-[#2A2A2A]'}
        ${track.isLocked ? 'opacity-50' : ''}
        ${!track.isVisible ? 'opacity-30' : ''}
        hover:bg-[#3A3A3A] transition-colors cursor-pointer
      `}
      onClick={() => selectTrack(isSelected ? null : track.id)}
    >
      {/* Track Info */}
      <div className="flex-1 flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-[#1ABC9C]" />
        <span className="text-sm text-white">{track.name}</span>
      </div>

      {/* Track Controls */}
      <div className="flex items-center gap-2">
        {/* Mute/Solo Controls */}
        <div className="flex items-center gap-1">
          <button
            className="p-1 hover:bg-[#4A4A4A] rounded transition-colors"
            title="Mute track"
            onClick={(e) => {
              e.stopPropagation();
              if ('volume' in track) {
                setTrackVolume(track.id, track.volume > 0 ? 0 : 1);
              }
            }}
          >
            {'volume' in track && track.volume === 0 ? (
              <VolumeX className="w-4 h-4 text-gray-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            className="p-1 hover:bg-[#4A4A4A] rounded transition-colors"
            title="Solo track"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement solo functionality
            }}
          >
            <Headphones className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Volume Slider (Audio Tracks Only) */}
        {'volume' in track && (
          <div className="flex items-center gap-1" title="Adjust track volume">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={track.volume}
              onChange={(e) => setTrackVolume(track.id, parseFloat(e.target.value))}
              className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer hover:bg-gray-500 transition-colors"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Visibility Toggle */}
        <button
          className="p-1 hover:bg-[#4A4A4A] rounded transition-colors"
          title="Toggle track visibility"
          onClick={(e) => {
            e.stopPropagation();
            toggleTrackVisibility(track.id);
          }}
        >
          {track.isVisible ? (
            <Eye className="w-4 h-4 text-gray-400" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Lock Toggle */}
        <button
          className="p-1 hover:bg-[#4A4A4A] rounded transition-colors"
          title="Toggle track lock"
          onClick={(e) => {
            e.stopPropagation();
            toggleTrackLock(track.id);
          }}
        >
          {track.isLocked ? (
            <Lock className="w-4 h-4 text-gray-400" />
          ) : (
            <Unlock className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Delete Track */}
        <button
          className="p-1 hover:bg-red-500/20 rounded transition-colors"
          title="Delete track"
          onClick={(e) => {
            e.stopPropagation();
            removeTrack(track.id);
          }}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>

      {/* Clips Container */}
      <div className="relative flex-1 min-h-[80px] ml-4">
        <div className="absolute inset-0 bg-[#1A1A1A] rounded">
          {track.clips.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-gray-500">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                  {track.type === 'video' && <Film className="w-4 h-4 text-gray-400" />}
                  {track.type === 'audio' && <Volume2 className="w-4 h-4 text-gray-400" />}
                  {track.type === 'text' && <Type className="w-4 h-4 text-gray-400" />}
                </div>
                Drop {track.type} clips here
              </div>
            </div>
          ) : (
            <div className="flex gap-1 p-2 h-full">
              {track.clips.map((clip) => (
                <div 
                  key={clip.id}
                  className="relative group"
                  style={{ width: `${(clip.endTime - clip.startTime) * 20}px` }}
                >
                  <Clip
                    clip={clip}
                    trackId={track.id}
                    stateManager={stateManager}
                  />
                  {/* Clip Duration */}
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/50 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {((clip.endTime - clip.startTime) / 30).toFixed(1)}s
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
