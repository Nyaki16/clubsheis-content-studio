import { ReelConfig } from '@/types';
import { buildVoicePreservedPrompt } from './voice-preservation';

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

export function buildReelPrompt(
  config: ReelConfig,
  inspirationDesc?: string,
  voicePreservation?: boolean,
  sourceText?: string
): string {
  if (voicePreservation) {
    return buildVoicePreservedPrompt({
      task: `You are assembling a ${config.duration}-second Reel script for ${platformLabels[config.platform]} from the speaker's own transcript material. Every line of dialogue must be a direct quote from the source.`,
      sourceText: sourceText || '',
      formatInstructions: `Hook style: ${hookLabels[config.hookStyle]}. Format: ${formatLabels[config.format]}.

Output in this exact format:

HOOK: [The opening line — a verbatim sentence pulled from the source, ideally one of its strongest opening lines.]

SCRIPT:
[The full script, built ONLY from verbatim sentences from the source, in the order the speaker built the argument. Visual / B-roll notes can be added in square brackets between lines — those are connective tissue, not new copy. The spoken lines themselves must be lifted directly.]

CTA: [A verbatim closing line from the source. If the source contains no clear CTA, lift the speaker's most action-oriented sentence.]

CAPTION: [Under 150 characters. A verbatim line from the source that sums it up. Do not write a new caption.]

No marketing scaffolding. No "scroll-stopping". No invented hooks. If the source doesn't say it, do not say it.`,
      inspirationDesc,
    });
  }

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
