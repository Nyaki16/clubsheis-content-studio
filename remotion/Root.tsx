import React from 'react';
import { Composition } from 'remotion';
import { VideoComposition } from '../components/video/VideoComposition';
import {
  compositionDuration,
  FPS,
  RATIO_DIMS,
  DEFAULT_COLORS,
} from '../components/video/animation';
import type { VideoAspectRatio } from '../types';

const DEFAULT_PROPS = {
  script: {
    title: 'Untitled',
    scenes: [
      { template: 'title' as const, headline: 'Render preview', body: '', eyebrow: 'PREVIEW' },
      { template: 'flowchart' as const, headline: 'Step', body: '', steps: ['One', 'Two', 'Three'] },
      { template: 'stat' as const, headline: 'Stat', body: '', stat: { value: 100, suffix: '%', label: 'label' } },
      { template: 'iconGrid' as const, headline: 'Grid', body: '', items: [{ icon: '✨', label: 'A' }, { icon: '⚡', label: 'B' }] },
      { template: 'particles' as const, headline: 'Done', body: '', cta: 'CTA' },
    ],
  },
  colors: DEFAULT_COLORS,
  aspectRatio: '9:16' as VideoAspectRatio,
  durationSeconds: 30,
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="video-animation"
      // Remotion's Composition expects Record<string, unknown>; our typed props
      // satisfy that shape at runtime but TS can't see the structural overlap.
      component={VideoComposition as unknown as React.ComponentType<Record<string, unknown>>}
      durationInFrames={compositionDuration(DEFAULT_PROPS.durationSeconds)}
      fps={FPS}
      width={RATIO_DIMS[DEFAULT_PROPS.aspectRatio].width}
      height={RATIO_DIMS[DEFAULT_PROPS.aspectRatio].height}
      defaultProps={DEFAULT_PROPS as unknown as Record<string, unknown>}
      calculateMetadata={({ props }) => {
        const ratio = (props.aspectRatio as VideoAspectRatio) || '9:16';
        const dims = RATIO_DIMS[ratio] || RATIO_DIMS['9:16'];
        const duration = Number(props.durationSeconds) || 30;
        return {
          durationInFrames: compositionDuration(duration),
          width: dims.width,
          height: dims.height,
        };
      }}
    />
  );
};
