'use client';

import { Player } from '@remotion/player';
import type { VideoAspectRatio, VideoColors, VideoScript } from '@/types';
import { VideoComposition } from './VideoComposition';
import { RATIO_DIMS, FPS, compositionDuration } from './animation';

interface Props {
  script: VideoScript;
  colors: VideoColors;
  aspectRatio: VideoAspectRatio;
  durationSeconds: number;
}

export default function VideoPreview({ script, colors, aspectRatio, durationSeconds }: Props) {
  const dims = RATIO_DIMS[aspectRatio];

  return (
    <Player
      component={VideoComposition}
      inputProps={{ script, colors, aspectRatio, durationSeconds }}
      durationInFrames={compositionDuration(durationSeconds)}
      fps={FPS}
      compositionWidth={dims.width}
      compositionHeight={dims.height}
      style={{ width: '100%', height: '100%' }}
      controls
      loop
      autoPlay
      acknowledgeRemotionLicense
    />
  );
}
