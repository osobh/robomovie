import { useEffect } from 'react';
import { useTimelineStore } from '@/lib/store/timeline';
import { useVideoEditorStore } from '@/lib/store/video-editor';

export function useTimelineShortcuts() {
  const { selectedClipId, removeClip, splitClip } = useTimelineStore();
  const { currentFrame, setCurrentFrame } = useVideoEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        // Navigation
        case 'ArrowLeft': {
          e.preventDefault();
          if (e.shiftKey) {
            // Shift + Left Arrow: Jump back 1 second (30 frames)
            setCurrentFrame(Math.max(0, currentFrame - 30));
          } else {
            // Left Arrow: Previous frame
            setCurrentFrame(Math.max(0, currentFrame - 1));
          }
          break;
        }

        case 'ArrowRight': {
          e.preventDefault();
          if (e.shiftKey) {
            // Shift + Right Arrow: Jump forward 1 second (30 frames)
            setCurrentFrame(currentFrame + 30);
          } else {
            // Right Arrow: Next frame
            setCurrentFrame(currentFrame + 1);
          }
          break;
        }

        case 'Home': {
          e.preventDefault();
          // Home: Jump to start
          setCurrentFrame(0);
          break;
        }

        case 'End': {
          e.preventDefault();
          // End: Jump to end (5 seconds for now)
          setCurrentFrame(150);
          break;
        }

        // Clip Operations
        case 'Delete':
        case 'Backspace': {
          e.preventDefault();
          // Delete selected clip
          if (selectedClipId) {
            const track = useTimelineStore.getState().tracks.find(track =>
              track.clips.some(clip => clip.id === selectedClipId)
            );
            if (track) {
              removeClip(track.id, selectedClipId);
            }
          }
          break;
        }

        case 's': {
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            // Cmd/Ctrl + S: Split clip at playhead
            if (selectedClipId) {
              splitClip(selectedClipId, currentFrame / 30);
            }
          }
          break;
        }

        // Zoom Controls
        case '-': {
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            // Cmd/Ctrl + -: Zoom out
            const { zoom } = useTimelineStore.getState();
            useTimelineStore.getState().setZoom(Math.max(0.5, zoom - 0.5));
          }
          break;
        }

        case '=': {
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            // Cmd/Ctrl + =: Zoom in
            const { zoom } = useTimelineStore.getState();
            useTimelineStore.getState().setZoom(Math.min(2, zoom + 0.5));
          }
          break;
        }

        case '0': {
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            // Cmd/Ctrl + 0: Reset zoom
            useTimelineStore.getState().setZoom(1);
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFrame, selectedClipId, setCurrentFrame, removeClip, splitClip]);
}
