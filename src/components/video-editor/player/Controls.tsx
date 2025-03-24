import { useVideoEditorStore } from '@/lib/store/video-editor';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

// Format time in seconds to MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

interface ControlsProps {
  video: HTMLVideoElement | null;
  onVolumeChange: (volume: number) => void;
  onPlaybackRateChange: (rate: number) => void;
}

export function Controls({ video, onVolumeChange, onPlaybackRateChange }: ControlsProps) {
  const { 
    player: { 
      isPlaying, 
      volume, 
      isMuted, 
      isFullscreen,
      playbackRate 
    },
    togglePlayback,
    toggleMute,
    toggleFullscreen,
  } = useVideoEditorStore();

  const handleFullscreen = () => {
    if (!video) return;

    if (!isFullscreen) {
      video.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    toggleFullscreen();
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent">
      {/* Progress bar */}
      <ProgressBar video={video} />
      
      {/* Controls */}
      <div className="p-3">
      <div className="flex items-center gap-3 relative">
        {/* Play/Pause */}
        <button
          onClick={togglePlayback}
          className="p-1.5 rounded-full text-white hover:bg-white/10 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </button>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-full text-white hover:bg-white/10 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-6 h-6" />
            ) : (
              <Volume2 className="w-6 h-6" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer hover:bg-white/30 transition-colors"
          />
        </div>

        {/* Time Display */}
        <div className="text-white text-sm">
          {video ? formatTime(video.currentTime) : "00:00"} / {video ? formatTime(video.duration) : "00:00"}
        </div>

        {/* Playback Rate */}
        <select
          value={playbackRate}
          onChange={(e) => onPlaybackRateChange(parseFloat(e.target.value))}
          className="bg-transparent text-white border border-white/20 rounded px-2 py-1 hover:bg-white/10 transition-colors"
        >
          <option value="0.5">0.5x</option>
          <option value="1">1x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>

        {/* Fullscreen */}
        <button
          onClick={handleFullscreen}
          className="p-1.5 rounded-full text-white hover:bg-white/10 transition-colors ml-auto"
        >
          {isFullscreen ? (
            <Minimize className="w-6 h-6" />
          ) : (
            <Maximize className="w-6 h-6" />
          )}
        </button>
      </div>
      </div>
    </div>
  );
}
