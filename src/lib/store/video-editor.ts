import { create } from 'zustand';
import Timeline from '@designcombo/timeline';
import type { PlayerRef } from '@remotion/player';

export interface Asset {
  id: string;
  type: 'video' | 'audio' | 'image';
  url: string;
  name: string;
}

interface VideoPlayerState {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  duration: number;
  playbackRate: number;
}

interface SceneMediaStatus {
  video: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    url?: string;
    error?: string;
  };
  audio: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    url?: string;
    error?: string;
  };
}

interface AssemblyStatus {
  status: 'idle' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputUrl?: string;
  error?: string;
}

interface VideoEditorState {
  timeline: Timeline | null;
  playerRef: PlayerRef | null;
  selectedScene: {
    id: string;
    number: number;
    title: string;
    generator?: 'runway' | 'pika';
    comments?: string;
  } | null;
  editorAssets: Asset[];
  currentFrame: number;
  player: VideoPlayerState;
  sceneMediaStatus: Record<string, SceneMediaStatus>;
  assemblyStatus: AssemblyStatus;
  // Actions
  setTimeline: (timeline: Timeline | null) => void;
  setPlayerRef: (playerRef: PlayerRef | null) => void;
  setSelectedScene: (scene: { 
    id: string; 
    number: number; 
    title: string;
    generator?: 'runway' | 'pika';
    comments?: string;
  } | null) => void;
  addAsset: (asset: Asset) => void;
  removeAsset: (assetId: string) => void;
  setCurrentFrame: (frame: number) => void;
  // Media status actions
  setSceneVideoStatus: (sceneId: string, status: SceneMediaStatus['video']) => void;
  setSceneAudioStatus: (sceneId: string, status: SceneMediaStatus['audio']) => void;
  clearSceneStatus: (sceneId: string) => void;
  // Assembly actions
  setAssemblyStatus: (status: Partial<AssemblyStatus>) => void;
  resetAssemblyStatus: () => void;
  // Player controls
  togglePlayback: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  setPlaybackRate: (rate: number) => void;
}

const defaultAssemblyStatus: AssemblyStatus = {
  status: 'idle',
  progress: 0
};

export const useVideoEditorStore = create<VideoEditorState>((set) => ({
  timeline: null,
  playerRef: null,
  selectedScene: null,
  editorAssets: [],
  currentFrame: 0,
  player: {
    isPlaying: false,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    duration: 0,
    playbackRate: 1,
  },
  sceneMediaStatus: {},
  assemblyStatus: defaultAssemblyStatus,
  
  setTimeline: (timeline) => set({ timeline }),
  setPlayerRef: (playerRef) => set({ playerRef }),
  setSelectedScene: (scene) => {
    if (scene) {
      // Initialize with sample media status
      set((state) => ({
        selectedScene: scene,
        sceneMediaStatus: {
          ...state.sceneMediaStatus,
          [scene.id]: {
            video: {
              status: 'completed',
              url: 'https://cdn.designcombo.dev/videos/demo-video-1.mp4'
            },
            audio: {
              status: 'completed',
              url: 'https://cdn.designcombo.dev/audio/Hope.mp3'
            }
          }
        }
      }));
    } else {
      set({ selectedScene: null });
    }
  },
  addAsset: (asset) => set((state) => ({
    editorAssets: [...state.editorAssets, asset]
  })),
  removeAsset: (assetId) => set((state) => ({
    editorAssets: state.editorAssets.filter((asset) => asset.id !== assetId)
  })),
  setCurrentFrame: (frame) => set({ currentFrame: frame }),
  
  // Media status actions
  setSceneVideoStatus: (sceneId, videoStatus) => set((state) => ({
    sceneMediaStatus: {
      ...state.sceneMediaStatus,
      [sceneId]: {
        ...state.sceneMediaStatus[sceneId],
        video: videoStatus
      }
    }
  })),
  
  setSceneAudioStatus: (sceneId, audioStatus) => set((state) => ({
    sceneMediaStatus: {
      ...state.sceneMediaStatus,
      [sceneId]: {
        ...state.sceneMediaStatus[sceneId],
        audio: audioStatus
      }
    }
  })),
  
  clearSceneStatus: (sceneId) => set((state) => ({
    sceneMediaStatus: Object.fromEntries(
      Object.entries(state.sceneMediaStatus).filter(([id]) => id !== sceneId)
    )
  })),
  
  // Assembly actions
  setAssemblyStatus: (status) => set((state) => ({
    assemblyStatus: { ...state.assemblyStatus, ...status }
  })),
  
  resetAssemblyStatus: () => set({
    assemblyStatus: defaultAssemblyStatus
  }),
  
  // Player controls
  togglePlayback: () => set((state) => ({
    player: { ...state.player, isPlaying: !state.player.isPlaying }
  })),
  setVolume: (volume) => set((state) => ({
    player: { ...state.player, volume: Math.max(0, Math.min(1, volume)) }
  })),
  toggleMute: () => set((state) => ({
    player: { ...state.player, isMuted: !state.player.isMuted }
  })),
  toggleFullscreen: () => set((state) => ({
    player: { ...state.player, isFullscreen: !state.player.isFullscreen }
  })),
  setPlaybackRate: (rate) => set((state) => ({
    player: { ...state.player, playbackRate: rate }
  })),
}));
