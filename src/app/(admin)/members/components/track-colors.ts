import type { Track } from '@/api/auth/types';

/** globals.css의 --track-{key}-bg / --track-{key}-text 변수 접미사. */
export const TRACK_COLOR_KEY: Record<Track, string> = {
  FRONTEND: 'frontend',
  BACKEND: 'backend',
  ANDROID: 'android',
  IOS: 'ios',
  PM: 'pm',
  DATA: 'data',
  DESIGN: 'design',
  DEVOPS: 'devops',
  PS: 'ps',
  GAME: 'game',
  SECURITY: 'security',
};
