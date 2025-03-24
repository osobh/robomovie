import { useRef, useEffect, useState } from 'react';
import { useVideoEditorStore } from '@/lib/store/video-editor';
import { Controls } from './Controls';
import { LoadingSpinner } from './LoadingSpinner';

interface VideoPlayerProps {
  src?: string;
  poster?: string;
  className?: string;
}

export function VideoPlayer({ src, poster, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const { 
    player: { 
      isPlaying, 
      volume, 
      isMuted, 
      playbackRate 
    },
    currentFrame,
    setCurrentFrame,
    togglePlayback,
    setVolume,
    setPlaybackRate,
  } = useVideoEditorStore();

  // Handle play/pause
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  // Handle volume/mute
  useEffect(() => {
    if (!videoRef.current) return;
    
    videoRef.current.volume = volume;
    videoRef.current.muted = isMuted;
  }, [volume, isMuted]);

  // Handle playback rate
  useEffect(() => {
    if (!videoRef.current) return;
    
    videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Handle frame seeking
  useEffect(() => {
    if (!videoRef.current) return;
    
    const time = currentFrame / 30; // assuming 30fps
    if (Math.abs(videoRef.current.currentTime - time) > 0.1) {
      videoRef.current.currentTime = time;
    }
  }, [currentFrame]);

  // Update frame based on video time
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const frame = Math.round(videoRef.current.currentTime * 30);
    if (frame !== currentFrame) {
      setCurrentFrame(frame);
    }
  };

  // Handle loading and buffering states
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsBuffering(false);
      setIsLoading(false);
    };
    const handleLoadedData = () => setIsLoading(false);

    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('loadeddata', handleLoadedData);

    return () => {
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {(isLoading || isBuffering) && <LoadingSpinner />}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="max-w-full max-h-full w-auto h-auto object-contain"
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => togglePlayback()}
        />
      </div>
      <Controls
        video={videoRef.current}
        onVolumeChange={setVolume}
        onPlaybackRateChange={setPlaybackRate}
      />
    </div>
  );
}
