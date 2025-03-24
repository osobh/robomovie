import { Asset } from '@/lib/store/video-editor';

export const SAMPLE_VIDEOS: Asset[] = [
  {
    id: 'video1',
    type: 'video',
    url: 'https://cdn.designcombo.dev/videos/demo-video-1.mp4',
    name: 'Demo Video 1'
  },
  {
    id: 'video2',
    type: 'video',
    url: 'https://cdn.designcombo.dev/videos/demo-video-2.mp4',
    name: 'Demo Video 2'
  }
];

export const SAMPLE_AUDIO: Asset[] = [
  {
    id: 'audio1',
    type: 'audio',
    url: 'https://cdn.designcombo.dev/audio/Hope.mp3',
    name: 'Hope'
  },
  {
    id: 'audio2',
    type: 'audio',
    url: 'https://cdn.designcombo.dev/audio/Piano%20Moment.mp3',
    name: 'Piano Moment'
  }
];
