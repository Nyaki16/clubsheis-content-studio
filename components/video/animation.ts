import { spring, interpolate, Easing } from 'remotion';
import type { VideoAspectRatio, VideoColors } from '@/types';

export const FPS = 30;
export const TRANSITION_FRAMES = 12;
export const SCENE_COUNT = 5;

export const RATIO_DIMS: Record<VideoAspectRatio, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '16:9': { width: 1920, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
};

export const DEFAULT_COLORS: VideoColors = {
  background: '#ffffff',
  primaryText: '#29281c',
  accent: '#ac5739',
  emphasis: '#b6c4cd',
};

export interface SafeInsets {
  top: number;
  bottom: number;
  x: number;
}

export function safeInsets(ratio: VideoAspectRatio): SafeInsets {
  // Mobile feeds need generous top/bottom clearance for system + platform UI.
  if (ratio === '9:16') return { top: 150, bottom: 170, x: 80 };
  return { top: 100, bottom: 100, x: 100 };
}

/** Scene frame count so 5 scenes + 4 transitions fill the requested duration. */
export function sceneDuration(durationSeconds: number): number {
  const total = Math.round(durationSeconds * FPS);
  return Math.round((total + (SCENE_COUNT - 1) * TRANSITION_FRAMES) / SCENE_COUNT);
}

/** Total composition length once overlapping transitions are subtracted. */
export function compositionDuration(durationSeconds: number): number {
  return sceneDuration(durationSeconds) * SCENE_COUNT - (SCENE_COUNT - 1) * TRANSITION_FRAMES;
}

/** Heavily-damped spring entrance — smooth, no overshoot. */
export function enter(frame: number, fps: number, delay = 0) {
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return { progress: p, opacity: p, translateY: (1 - p) * 32 };
}

/** Eased count-up value for a number reveal. */
export function countUp(frame: number, start: number, value: number, dur = 48) {
  const p = interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return value * p;
}

/** 0 -> 1 draw progress for stroke-dashoffset / scale reveals. */
export function draw(frame: number, start: number, dur = 40) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
}
