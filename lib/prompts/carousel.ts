import { CarouselConfig } from '@/types';

const formatLabels: Record<string, string> = {
  'tips': 'Tips / List',
  'story': 'Story / Narrative',
  'before-after': 'Before & After',
  'how-to': 'How To / Steps',
  'quote': 'Quote-driven',
};

export function buildCarouselPrompt(config: CarouselConfig, inspirationDesc?: string): string {
  return `You are writing copy for a ${config.slideCount}-slide Instagram carousel. Format: ${formatLabels[config.slideFormat] || config.slideFormat}.
Output a JSON array with this structure for each slide:
[{ "slide": 1, "headline": "...", "body": "...", "designNote": "..." }]
The designNote field gives the designer a brief instruction (e.g. "bold headline only, no body text", "use a strong close-up image here").
The first slide headline must stop the scroll. The last slide must include a clear CTA.
${config.ctaSlide ? 'Include a dedicated CTA slide as the final slide.' : ''}
${inspirationDesc ? `Inspiration reference description: ${inspirationDesc}` : ''}

Return ONLY the JSON array, no other text.`;
}
