// Track Types
export interface BaseTrack {
  id: string;
  name: string;
  isLocked: boolean;
  isVisible: boolean;
  order: number;
}

export interface VideoTrack extends BaseTrack {
  type: 'video';
  clips: VideoClip[];
}

export interface AudioTrack extends BaseTrack {
  type: 'audio';
  clips: AudioClip[];
  volume: number;
}

export interface TextTrack extends BaseTrack {
  type: 'text';
  clips: TextClip[];
}

export type Track = VideoTrack | AudioTrack | TextTrack;

// Clip Types
export interface BaseClip {
  id: string;
  trackId: string;
  startTime: number;
  endTime: number;
  name: string;
}

export interface VideoClip extends BaseClip {
  type: 'video';
  source: string;
  thumbnail?: string;
}

export interface AudioClip extends BaseClip {
  type: 'audio';
  source: string;
  volume: number;
  waveform?: string;
}

export interface TextClip extends BaseClip {
  type: 'text';
  content: string;
  style: {
    fontSize: number;
    fontFamily: string;
    color: string;
    alignment: 'left' | 'center' | 'right';
  };
}

export type Clip = VideoClip | AudioClip | TextClip;

// Timeline State
export interface TimelineState {
  tracks: Track[];
  selectedTrackId: string | null;
  selectedClipId: string | null;
  zoom: number;
  scrollPosition: number;
  snapToGrid: boolean;
  gridSize: number;
}

// Helper Types
export type TrackType = 'video' | 'audio' | 'text';
export type ClipType = 'video' | 'audio' | 'text';

// Type Guards
export const isVideoTrack = (track: Track): track is VideoTrack => track.type === 'video';
export const isAudioTrack = (track: Track): track is AudioTrack => track.type === 'audio';
export const isTextTrack = (track: Track): track is TextTrack => track.type === 'text';

export const isVideoClip = (clip: Clip): clip is VideoClip => clip.type === 'video';
export const isAudioClip = (clip: Clip): clip is AudioClip => clip.type === 'audio';
export const isTextClip = (clip: Clip): clip is TextClip => clip.type === 'text';

// Type Mapping
export type TrackClipMap = {
  video: VideoClip;
  audio: AudioClip;
  text: TextClip;
};

export type TrackTypeMap = {
  video: VideoTrack;
  audio: AudioTrack;
  text: TextTrack;
};

// Helper Functions
export function getTrackType<T extends Track>(track: T): T['type'] {
  return track.type;
}

// StateManager Type
export interface StateManager {
  size: {
    width: number;
    height: number;
  };
  scale: {
    index: number;
    unit: number;
    zoom: number;
    segments: number;
  };
  timeline: {
    duration: number;
    fps: number;
    width: number;
    height: number;
  };
  player: {
    isPlaying: boolean;
    volume: number;
    currentTime: number;
  };
}

export function getClipsForTrack<T extends Track>(track: T): T extends VideoTrack 
  ? VideoClip[] 
  : T extends AudioTrack 
  ? AudioClip[] 
  : T extends TextTrack 
  ? TextClip[] 
  : never {
  return track.clips as unknown as T extends VideoTrack 
    ? VideoClip[] 
    : T extends AudioTrack 
    ? AudioClip[] 
    : T extends TextTrack 
    ? TextClip[] 
    : never;
}

export function createEmptyClipsArray<T extends TrackType>(): TrackClipMap[T][] {
  return [];
}
