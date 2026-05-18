import { StaticImageConfig } from '@/types';
import { buildVoicePreservedPrompt } from './voice-preservation';

const purposeLabels: Record<string, string> = {
  announcement: 'Announcement',
  quote: 'Quote',
  promotion: 'Promotion / Offer',
  event: 'Event',
  testimonial: 'Testimonial',
};

const formatLabels: Record<string, string> = {
  '1:1': 'Square (1:1)',
  '4:5': 'Portrait (4:5)',
  '9:16': 'Story (9:16)',
  '16:9': 'Landscape (16:9)',
};

export function buildPosterPrompt(
  config: StaticImageConfig,
  inspirationDesc?: string,
  voicePreservation?: boolean,
  sourceText?: string
): string {
  if (voicePreservation) {
    return buildVoicePreservedPrompt({
      task: `You are assembling copy for a ${formatLabels[config.format]} ${purposeLabels[config.imagePurpose]} graphic from the speaker's own transcript material. Every line on the graphic must be a direct quote from the source.`,
      sourceText: sourceText || '',
      formatInstructions: `${config.textToFeature ? `Text the user wants featured: "${config.textToFeature}" — only use this if it appears verbatim in the source. Otherwise pick the closest real line.\n\n` : ''}Output in this format:
HEADLINE: [max 8 words — a verbatim phrase lifted directly from the source]
SUBHEADLINE: [max 15 words — a verbatim sentence from the source]
SUPPORTING TEXT: [optional, max 20 words — verbatim from the source]
CTA: [if applicable, a verbatim short action line from the source]
DESIGN DIRECTION: [brief note for designer on layout / feel — connective tissue, this is the only field that can be original]`,
      inspirationDesc,
    });
  }

  return `You are writing copy for a ${formatLabels[config.format]} ${purposeLabels[config.imagePurpose]} graphic.
${config.textToFeature ? `Text the user wants featured: "${config.textToFeature}"` : ''}

Output in this format:
HEADLINE: [max 8 words]
SUBHEADLINE: [max 15 words]
SUPPORTING TEXT: [optional, max 20 words]
CTA: [if applicable]
DESIGN DIRECTION: [brief note for the designer on layout, imagery, and feel]

${inspirationDesc ? `Inspiration reference: ${inspirationDesc}` : ''}`;
}
