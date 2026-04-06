import { ReelConfig } from '@/types';

const hookLabels: Record<string, string> = {
  'bold-statement': 'Bold statement',
  'question': 'Question',
  'controversial': 'Controversial take',
  'relatable': 'Relatable moment',
  'stat': 'Stat / fact',
};

const formatLabels: Record<string, string> = {
  'talk-to-camera': 'Talk to camera',
  'voiceover': 'Voiceover / B-roll',
  'text-only': 'Text on screen only',
};

const platformLabels: Record<string, string> = {
  'instagram': 'Instagram Reels',
  'tiktok': 'TikTok',
  'youtube-shorts': 'YouTube Shorts',
};

export function buildReelPrompt(config: ReelConfig, inspirationDesc?: string): string {
  return `You are writing a ${config.duration}-second Reel script for ${platformLabels[config.platform]}.
Hook style: ${hookLabels[config.hookStyle]}. Format: ${formatLabels[config.format]}.
Use the Relatable Reel framework: hook (first 3 seconds), open loop, value delivery, close loop, CTA.
Output in this exact format:

HOOK: [The opening hook line]

SCRIPT:
[Full script with scene/visual notes in square brackets]

CTA: [The closing call to action]

CAPTION: [Suggested caption under 150 characters]

No bullet lists in the script itself. Write it as a performer would say it.
${inspirationDesc ? `Inspiration reference: ${inspirationDesc}` : ''}`;
}
