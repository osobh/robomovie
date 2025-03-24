import { useEffect } from 'react';
import { useVideoEditorStore } from '@/lib/store/video-editor';

interface UseKeyboardControlsProps {
  onAction?: (action: string) => void;
}

export function useKeyboardControls({ onAction }: UseKeyboardControlsProps = {}) {
  const { 
    player: { 
      isPlaying,
      volume,
      playbackRate 
    }, 
    currentFrame, 
    togglePlayback, 
    setCurrentFrame,
    setVolume,
    setPlaybackRate 
  } = useVideoEditorStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const actions: Record<string, () => void> = {
        Space: () => {
          togglePlayback();
          onAction?.(isPlaying ? 'Paused' : 'Playing');
        },
        ArrowLeft: () => {
          const frames = event.shiftKey ? 10 : 1;
          setCurrentFrame(Math.max(0, currentFrame - frames));
          onAction?.(`Moved back ${frames} frame${frames > 1 ? 's' : ''}`);
        },
        ArrowRight: () => {
          const frames = event.shiftKey ? 10 : 1;
          setCurrentFrame(Math.min(150, currentFrame + frames));
          onAction?.(`Moved forward ${frames} frame${frames > 1 ? 's' : ''}`);
        },
        Home: () => {
          setCurrentFrame(0);
          onAction?.('Jumped to start');
        },
        End: () => {
          setCurrentFrame(150);
          onAction?.('Jumped to end');
        },
        ArrowUp: () => {
          const newVolume = Math.min(1, volume + 0.1);
          setVolume(newVolume);
          onAction?.(`Volume: ${Math.round(newVolume * 100)}%`);
        },
        ArrowDown: () => {
          const newVolume = Math.max(0, volume - 0.1);
          setVolume(newVolume);
          onAction?.(`Volume: ${Math.round(newVolume * 100)}%`);
        },
        BracketLeft: () => {
          const rates = [0.5, 1, 1.5, 2];
          const currentIndex = rates.indexOf(playbackRate);
          const newRate = rates[Math.max(0, currentIndex - 1)] || rates[0];
          setPlaybackRate(newRate);
          onAction?.(`Speed: ${newRate}x`);
        },
        BracketRight: () => {
          const rates = [0.5, 1, 1.5, 2];
          const currentIndex = rates.indexOf(playbackRate);
          const newRate = rates[Math.min(rates.length - 1, currentIndex + 1)] || rates[rates.length - 1];
          setPlaybackRate(newRate);
          onAction?.(`Speed: ${newRate}x`);
        },
      };

      if (event.code in actions) {
        event.preventDefault();
        actions[event.code]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    currentFrame,
    isPlaying,
    volume,
    playbackRate,
    togglePlayback,
    setCurrentFrame,
    setVolume,
    setPlaybackRate,
    onAction
  ]);
}
