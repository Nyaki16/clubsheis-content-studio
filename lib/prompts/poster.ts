import { StaticImageConfig } from '@/types';

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

export function buildPosterPrompt(config: StaticImageConfig, inspirationDesc?: string): string {
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
