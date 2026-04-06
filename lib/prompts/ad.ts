import { AdCreativeConfig } from '@/types';

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

export function buildAdPrompt(config: AdCreativeConfig, inspirationDesc?: string): string {
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
