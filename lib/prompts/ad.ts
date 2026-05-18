import { AdCreativeConfig } from '@/types';
import { buildVoicePreservedPrompt } from './voice-preservation';

const formatLabels: Record<string, string> = {
  'single-image': 'Single image ad',
  'video': 'Video ad script',
  'carousel': 'Carousel ad',
  'story': 'Story ad',
};

const objectiveLabels: Record<string, string> = {
  awareness: 'Awareness',
  'lead-gen': 'Lead gen',
  conversion: 'Conversion / Sales',
};

export function buildAdPrompt(
  config: AdCreativeConfig,
  inspirationDesc?: string,
  voicePreservation?: boolean,
  sourceText?: string
): string {
  if (voicePreservation) {
    return buildVoicePreservedPrompt({
      task: `You are assembling ${config.variationCount} ad creative variation(s) for ${config.platforms.join(', ')} — ${formatLabels[config.adFormat]} format. Objective: ${objectiveLabels[config.objective]}. Every line of ad copy must be a direct quote from the speaker's transcript below.`,
      sourceText: sourceText || '',
      formatInstructions: `For each variation output in this format:

VARIATION 1
Primary text: [verbatim sentence(s) from the source]
Headline: [a verbatim short line from the source]
Description: [verbatim from the source]
CTA button text: [verbatim short action line from the source, or the platform-required CTA name if the source has none]
Creative direction: [brief note for designer — connective tissue, this is the only field that can be original]

VARIATION 2
...and so on.

Each variation must use a DIFFERENT passage of the source. Do not reuse the same lines across variations. If the source does not contain enough distinct material for ${config.variationCount} variations, output fewer.`,
      inspirationDesc,
    });
  }

  return `You are writing ${config.variationCount} ad creative variation(s) for ${config.platforms.join(', ')} — ${formatLabels[config.adFormat]} format. Objective: ${objectiveLabels[config.objective]}.
For each variation output in this format:

VARIATION 1
Primary text: [text]
Headline: [headline]
Description: [description]
CTA button text: [cta]
Creative direction: [what visual or video should accompany this]

VARIATION 2
...and so on.

${inspirationDesc ? `Inspiration reference: ${inspirationDesc}` : ''}`;
}
