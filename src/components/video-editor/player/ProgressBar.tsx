import { useEffect, useRef, useState } from 'react';
import { useVideoEditorStore } from '@/lib/store/video-editor';

interface ProgressBarProps {
  video: HTMLVideoElement | null;
}

export function ProgressBar({ video }: ProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const { setCurrentFrame } = useVideoEditorStore();

  useEffect(() => {
    if (!video) return;

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);

      // Update buffered amount
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleTimeUpdate);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleTimeUpdate);
    };
  }, [video]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!video || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    
    const time = percentage * video.duration;
    video.currentTime = time;
    
    // Update frame number (assuming 30fps)
    setCurrentFrame(Math.round(time * 30));
  };

  return (
    <div 
      ref={progressBarRef}
      className="h-1.5 bg-white/10 cursor-pointer group relative hover:h-2 transition-all"
      onClick={handleSeek}
    >
      {/* Buffered progress */}
      <div 
        className="absolute h-full bg-white/20"
        style={{ width: `${buffered}%` }}
      />
      
      {/* Playback progress */}
      <div 
        className="absolute h-full bg-[#1ABC9C] group-hover:bg-[#1ABC9C]/90 transition-all"
        style={{ width: `${progress}%` }}
      >
        {/* Handle */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#1ABC9C] rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg" />
      </div>
    </div>
  );
}
