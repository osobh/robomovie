import { useEffect, useRef, useState } from 'react';
import { Scene } from './Scene';
import { TimelineComponent } from './Timeline';
import { useKeyboardControls } from './KeyboardControls';
import { Notification, useNotification } from './Notification';
import { useVideoEditorStore } from '@/lib/store/video-editor';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ImperativePanelHandle } from 'react-resizable-panels';
import { ToolBar } from './ToolBar';
import { dispatch } from '@designcombo/events';
import { SAMPLE_VIDEOS, SAMPLE_AUDIO } from '@/lib/data/sample-media';
import { StateManager } from '@/lib/types/timeline';

interface VideoEditorProps {
  className?: string;
}

export function VideoEditor({ className }: VideoEditorProps) {
  const timelinePanelRef = useRef<ImperativePanelHandle>(null);
  const { selectedScene, player, currentFrame } = useVideoEditorStore();
  const [editorState] = useState<StateManager>(() => ({
    size: {
      width: 1920,
      height: 1080
    },
    scale: {
      index: 0,
      unit: 1,
      zoom: 1,
      segments: 10
    },
    timeline: {
      duration: 150, // 5 seconds at 30fps
      fps: 30,
      width: 1920,
      height: 1080
    },
    player: {
      isPlaying: player.isPlaying,
      volume: player.volume,
      currentTime: currentFrame / 30
    }
  }));

  // Initialize with sample data if no scene is selected
  useEffect(() => {
    if (!selectedScene) {
      const sampleScene = {
        id: 'sample-scene',
        number: 1,
        title: 'Sample Scene'
      };
      
      // Set sample scene and media status
      useVideoEditorStore.setState((state) => ({
        selectedScene: sampleScene,
        sceneMediaStatus: {
          ...state.sceneMediaStatus,
          [sampleScene.id]: {
            video: {
              status: 'completed',
              url: SAMPLE_VIDEOS[0].url
            },
            audio: {
              status: 'completed',
              url: SAMPLE_AUDIO[0].url
            }
          }
        }
      }));
    }
  }, [selectedScene]);

  useEffect(() => {
    const screenHeight = window.innerHeight;
    const desiredHeight = 300;
    const percentage = (desiredHeight / screenHeight) * 100;
    timelinePanelRef.current?.resize(percentage);
  }, []);

  // Initialize timeline when scene is selected
  useEffect(() => {
    if (!selectedScene) return;
    
    // Initialize timeline with scene data
    dispatch('DESIGN_LOAD', {
      payload: {
        duration: 150, // 5 seconds at 30fps
        width: 1920,
        height: 1080,
        clips: [
          {
            id: 'video-clip',
            type: 'video',
            src: SAMPLE_VIDEOS[0].url,
            start: 0,
            duration: 150,
            track: 0
          },
          {
            id: 'audio-clip',
            type: 'audio',
            src: SAMPLE_AUDIO[0].url,
            start: 0,
            duration: 150,
            track: 1
          }
        ]
      },
    });
  }, [selectedScene]);

  const { notifications, show, hide } = useNotification();

  // Initialize keyboard controls with notification feedback
  useKeyboardControls({
    onAction: (action) => show(action)
  });

  // Show keyboard shortcuts tooltip
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className={className}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Notifications */}
      {notifications.map(({ message, id, index }) => (
        <Notification
          key={id}
          message={message}
          onClose={() => hide(id)}
          index={index}
        />
      ))}
      {showTooltip && (
        <div className="absolute top-4 right-4 bg-[#2A2A2A] p-4 rounded-lg shadow-lg z-50">
          <h3 className="text-white font-semibold mb-2">Keyboard Shortcuts</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>Space - Play/Pause</li>
            <li>← → - Previous/Next Frame</li>
            <li>Shift + ← → - Jump 10 Frames</li>
            <li>Home/End - Start/End</li>
            <li>↑ ↓ - Volume Up/Down</li>
            <li>[ ] - Speed Down/Up</li>
          </ul>
        </div>
      )}
      <ResizablePanelGroup direction="vertical" className="h-[calc(100vh-6rem)]">
        <ResizablePanel defaultSize={50} className="bg-[#1A1A1A] rounded-lg max-h-[50vh]">
          <div className="relative w-full h-full pl-12">
            <ToolBar />
            <Scene />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          ref={timelinePanelRef}
          defaultSize={50}
          className="min-h-[200px] bg-[#1A1A1A] rounded-lg"
        >
          <div id="timeline-container" className="w-full h-full p-4">
            {selectedScene && (
              <div className="text-white text-sm mb-2">
                Editing Scene {selectedScene.number}: {selectedScene.title}
              </div>
            )}
            <div className="w-full h-[calc(100%-2rem)] bg-[#2A2A2A] rounded-lg">
              <TimelineComponent stateManager={editorState} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
