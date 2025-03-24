import { create } from 'zustand';
import { nanoid } from 'nanoid';
import {
  Track,
  Clip,
  TimelineState,
  TrackType,
  VideoTrack,
  AudioTrack,
  TextTrack,
  VideoClip,
  AudioClip,
  TextClip,
  isVideoTrack,
  isAudioTrack,
  isTextTrack,
  isVideoClip,
  isAudioClip,
  isTextClip,
} from '../types/timeline';

interface TimelineStore extends TimelineState {
  // Track Actions
  addTrack: (type: TrackType, name: string) => void;
  removeTrack: (trackId: string) => void;
  reorderTrack: (trackId: string, newOrder: number) => void;
  toggleTrackLock: (trackId: string) => void;
  toggleTrackVisibility: (trackId: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;

  // Clip Actions
  addClip: (trackId: string, clipData: Partial<VideoClip | AudioClip | TextClip>) => void;
  removeClip: (trackId: string, clipId: string) => void;
  moveClip: (clipId: string, newTrackId: string, newStartTime: number) => void;
  resizeClip: (clipId: string, newStartTime: number, newEndTime: number) => void;
  splitClip: (clipId: string, time: number) => void;
  updateClipStyle: (clipId: string, style: Partial<TextClip['style']>) => void;

  // Timeline Controls
  setZoom: (zoom: number) => void;
  setScrollPosition: (position: number) => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  selectTrack: (trackId: string | null) => void;
  selectClip: (clipId: string | null) => void;
}

function createDefaultTrack(type: TrackType, name: string, order: number): Track {
  const baseTrack = {
    id: nanoid(),
    name,
    isLocked: false,
    isVisible: true,
    order,
    type,
  };

  switch (type) {
    case 'video':
      return {
        ...baseTrack,
        type: 'video',
        clips: [] as VideoClip[],
      } as VideoTrack;
    case 'audio':
      return {
        ...baseTrack,
        type: 'audio',
        clips: [] as AudioClip[],
        volume: 1,
      } as AudioTrack;
    case 'text':
      return {
        ...baseTrack,
        type: 'text',
        clips: [] as TextClip[],
      } as TextTrack;
  }
}

function createClipForTrack(track: Track, clipData: Partial<VideoClip | AudioClip | TextClip>): Clip {
  const baseClip = {
    id: nanoid(),
    trackId: track.id,
    name: clipData.name || 'New Clip',
    startTime: clipData.startTime || 0,
    endTime: clipData.endTime || 5000,
    type: track.type,
  };

  switch (track.type) {
    case 'video':
      return {
        ...baseClip,
        source: (clipData as Partial<VideoClip>).source || '',
        thumbnail: (clipData as Partial<VideoClip>).thumbnail,
      } as VideoClip;
    case 'audio':
      return {
        ...baseClip,
        source: (clipData as Partial<AudioClip>).source || '',
        volume: (clipData as Partial<AudioClip>).volume || 1,
      } as AudioClip;
    case 'text':
      return {
        ...baseClip,
        content: (clipData as Partial<TextClip>).content || '',
        style: {
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#FFFFFF',
          alignment: 'center',
          ...(clipData as Partial<TextClip>).style,
        },
      } as TextClip;
  }
}

function updateTrackClips<T extends Track>(track: T, clips: T['clips']): T {
  return { ...track, clips };
}

export const useTimelineStore = create<TimelineStore>((set) => ({
  // Initial State
  tracks: [] as Track[],
  selectedTrackId: null,
  selectedClipId: null,
  zoom: 1,
  scrollPosition: 0,
  snapToGrid: true,
  gridSize: 10,

  // Track Actions
  addTrack: (type, name) => set((state) => ({
    tracks: [...state.tracks, createDefaultTrack(type, name, state.tracks.length)]
  })),

  removeTrack: (trackId) => set((state) => ({
    tracks: state.tracks.filter((track) => track.id !== trackId)
  })),

  reorderTrack: (trackId, newOrder) => set((state) => ({
    tracks: state.tracks.map((track) => {
      if (track.id === trackId) {
        return { ...track, order: newOrder };
      }
      if (track.order >= newOrder) {
        return { ...track, order: track.order + 1 };
      }
      return track;
    }).sort((a, b) => a.order - b.order)
  })),

  toggleTrackLock: (trackId) => set((state) => ({
    tracks: state.tracks.map((track) =>
      track.id === trackId ? { ...track, isLocked: !track.isLocked } : track
    )
  })),

  toggleTrackVisibility: (trackId) => set((state) => ({
    tracks: state.tracks.map((track) =>
      track.id === trackId ? { ...track, isVisible: !track.isVisible } : track
    )
  })),

  setTrackVolume: (trackId, volume) => set((state) => ({
    tracks: state.tracks.map((track) =>
      track.id === trackId && isAudioTrack(track)
        ? { ...track, volume }
        : track
    )
  })),

  // Clip Actions
  addClip: (trackId, clipData) => set((state) => {
    const track = state.tracks.find((t) => t.id === trackId);
    if (!track) return state;

    const newClip = createClipForTrack(track, clipData);

    return {
      tracks: state.tracks.map((t) => {
        if (t.id !== trackId) return t;
        if (isVideoTrack(t) && isVideoClip(newClip)) {
          return updateTrackClips(t, [...t.clips, newClip]);
        }
        if (isAudioTrack(t) && isAudioClip(newClip)) {
          return updateTrackClips(t, [...t.clips, newClip]);
        }
        if (isTextTrack(t) && isTextClip(newClip)) {
          return updateTrackClips(t, [...t.clips, newClip]);
        }
        return t;
      })
    };
  }),

  removeClip: (trackId, clipId) => set((state) => ({
    tracks: state.tracks.map((track) => {
      if (track.id !== trackId) return track;
      const filteredClips = track.clips.filter((clip) => clip.id !== clipId);
      if (isVideoTrack(track)) return updateTrackClips(track, filteredClips as VideoClip[]);
      if (isAudioTrack(track)) return updateTrackClips(track, filteredClips as AudioClip[]);
      if (isTextTrack(track)) return updateTrackClips(track, filteredClips as TextClip[]);
      return track;
    })
  })),

  moveClip: (clipId, newTrackId, newStartTime) => set((state) => {
    let clipToMove: Clip | undefined;
    let oldTrackId: string | undefined;

    state.tracks.forEach((track) => {
      const clip = track.clips.find((c) => c.id === clipId);
      if (clip) {
        clipToMove = clip;
        oldTrackId = track.id;
      }
    });

    if (!clipToMove || !oldTrackId) return state;

    const newTrack = state.tracks.find((t) => t.id === newTrackId);
    if (!newTrack || newTrack.type !== clipToMove.type) return state;

    const duration = clipToMove.endTime - clipToMove.startTime;
    const newEndTime = newStartTime + duration;

    const updatedClip = {
      ...clipToMove,
      trackId: newTrackId,
      startTime: newStartTime,
      endTime: newEndTime,
    };

    return {
      tracks: state.tracks.map((track) => {
        if (track.id === oldTrackId) {
          const filteredClips = track.clips.filter((c) => c.id !== clipId);
          if (isVideoTrack(track)) return updateTrackClips(track, filteredClips as VideoClip[]);
          if (isAudioTrack(track)) return updateTrackClips(track, filteredClips as AudioClip[]);
          if (isTextTrack(track)) return updateTrackClips(track, filteredClips as TextClip[]);
          return track;
        }
        if (track.id === newTrackId) {
          if (isVideoTrack(track) && isVideoClip(updatedClip)) {
            return updateTrackClips(track, [...track.clips, updatedClip]);
          }
          if (isAudioTrack(track) && isAudioClip(updatedClip)) {
            return updateTrackClips(track, [...track.clips, updatedClip]);
          }
          if (isTextTrack(track) && isTextClip(updatedClip)) {
            return updateTrackClips(track, [...track.clips, updatedClip]);
          }
        }
        return track;
      })
    };
  }),

  resizeClip: (clipId, newStartTime, newEndTime) => set((state) => ({
    tracks: state.tracks.map((track) => {
      const updatedClips = track.clips.map((clip) =>
        clip.id === clipId
          ? { ...clip, startTime: newStartTime, endTime: newEndTime }
          : clip
      );
      if (isVideoTrack(track)) return updateTrackClips(track, updatedClips as VideoClip[]);
      if (isAudioTrack(track)) return updateTrackClips(track, updatedClips as AudioClip[]);
      if (isTextTrack(track)) return updateTrackClips(track, updatedClips as TextClip[]);
      return track;
    })
  })),

  splitClip: (clipId, time) => set((state) => {
    let clipToSplit: Clip | undefined;
    let trackId: string | undefined;

    state.tracks.forEach((track) => {
      const clip = track.clips.find((c) => c.id === clipId);
      if (clip) {
        clipToSplit = clip;
        trackId = track.id;
      }
    });

    if (!clipToSplit || !trackId || time <= clipToSplit.startTime || time >= clipToSplit.endTime) {
      return state;
    }

    const firstHalf = {
      ...clipToSplit,
      endTime: time,
    };

    const secondHalf = {
      ...clipToSplit,
      id: nanoid(),
      startTime: time,
    };

    return {
      tracks: state.tracks.map((track) => {
        if (track.id !== trackId) return track;
        const newClips = [
          ...track.clips.filter((c) => c.id !== clipId),
          firstHalf,
          secondHalf,
        ];
        if (isVideoTrack(track)) return updateTrackClips(track, newClips as VideoClip[]);
        if (isAudioTrack(track)) return updateTrackClips(track, newClips as AudioClip[]);
        if (isTextTrack(track)) return updateTrackClips(track, newClips as TextClip[]);
        return track;
      })
    };
  }),

  updateClipStyle: (clipId, style) => set((state) => ({
    tracks: state.tracks.map((track) => {
      if (!isTextTrack(track)) return track;
      const updatedClips = track.clips.map((clip) =>
        clip.id === clipId && isTextClip(clip)
          ? { ...clip, style: { ...clip.style, ...style } }
          : clip
      );
      return updateTrackClips(track, updatedClips);
    })
  })),

  // Timeline Controls
  setZoom: (zoom) => set({ zoom }),
  setScrollPosition: (position) => set({ scrollPosition: position }),
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  setGridSize: (size) => set({ gridSize: size }),
  selectTrack: (trackId) => set({ selectedTrackId: trackId }),
  selectClip: (clipId) => set({ selectedClipId: clipId }),
}));
