import { useEffect, useRef, useMemo } from 'react';
import { useVideoEditorStore } from '@/lib/store/video-editor';
import { VideoPlayer } from './player';
import { SAMPLE_VIDEOS } from '@/lib/data/sample-media';

interface SceneCompositionProps {
  width: number;
  height: number;
}

export function SceneComposition({ width, height }: SceneCompositionProps) {
  const { 
    selectedScene, 
    player: { isPlaying }, 
    currentFrame, 
    setCurrentFrame 
  } = useVideoEditorStore();
  
  const animationFrameRef = useRef<number>();

  // Calculate video dimensions to maintain 16:9 aspect ratio
  const videoDimensions = useMemo(() => {
    const aspectRatio = 16 / 9;
    const containerRatio = width / height;

    if (containerRatio > aspectRatio) {
      // Container is wider than video
      const videoHeight = height;
      const videoWidth = height * aspectRatio;
      return {
        width: videoWidth,
        height: videoHeight,
        left: (width - videoWidth) / 2,
        top: 0
      };
    } else {
      // Container is taller than video
      const videoWidth = width;
      const videoHeight = width / aspectRatio;
      return {
        width: videoWidth,
        height: videoHeight,
        left: 0,
        top: (height - videoHeight) / 2
      };
    }
  }, [width, height]);

  // Get video source for the selected scene
  const videoSrc = useMemo(() => {
    if (!selectedScene) return undefined;
    
    // Try to get video URL from scene media status
    const sceneMediaStatus = useVideoEditorStore.getState().sceneMediaStatus[selectedScene.id];
    if (sceneMediaStatus?.video?.url) {
      return sceneMediaStatus.video.url;
    }
    
    // Fall back to sample video for testing
    return SAMPLE_VIDEOS[0].url;
  }, [selectedScene]);

  useEffect(() => {
    let lastTime = 0;
    const fps = 30;
    const frameTime = 1000 / fps;

    const animate = (currentTime: number) => {
      if (!lastTime) lastTime = currentTime;
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= frameTime) {
        setCurrentFrame(currentFrame >= 150 ? 0 : currentFrame + 1);
        lastTime = currentTime;
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, setCurrentFrame, currentFrame]);

  if (!selectedScene) {
    return (
      <div 
        style={{ 
          width, 
          height,
          backgroundColor: '#000',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
        className="flex items-center justify-center"
      >
        <div className="text-white">No scene selected</div>
      </div>
    );
  }

  return (
    <div
      style={{
        width,
        height,
        position: 'absolute',
        top: 0,
        left: 0,
      }}
      className="bg-black"
    >
      <div
        style={{
          position: 'absolute',
          width: videoDimensions.width,
          height: videoDimensions.height,
          left: videoDimensions.left,
          top: videoDimensions.top,
        }}
      >
        <VideoPlayer
          src={videoSrc}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
