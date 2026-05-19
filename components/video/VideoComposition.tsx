import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import type { VideoAspectRatio, VideoColors, VideoScript } from '@/types';
import { SceneRouter } from './scenes';
import { sceneDuration, safeInsets, TRANSITION_FRAMES, DEFAULT_COLORS } from './animation';

export interface VideoCompositionProps {
  script: VideoScript;
  colors: VideoColors;
  aspectRatio: VideoAspectRatio;
  durationSeconds: number;
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  script,
  colors,
  aspectRatio,
  durationSeconds,
}) => {
  const palette = colors || DEFAULT_COLORS;
  const safe = safeInsets(aspectRatio);
  const scenes = (script?.scenes || []).slice(0, 5);
  const dur = sceneDuration(durationSeconds);

  if (scenes.length === 0) {
    return <AbsoluteFill style={{ backgroundColor: palette.background }} />;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: palette.background }}>
      <TransitionSeries>
        {scenes.flatMap((scene, i) => {
          const sequence = (
            <TransitionSeries.Sequence key={`scene-${i}`} durationInFrames={dur}>
              <SceneRouter scene={scene} palette={palette} safe={safe} />
            </TransitionSeries.Sequence>
          );
          if (i === scenes.length - 1) return [sequence];
          return [
            sequence,
            <TransitionSeries.Transition
              key={`transition-${i}`}
              timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
              presentation={fade()}
            />,
          ];
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
