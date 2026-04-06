import { CaptionConfig } from '@/types';

const postTypeLabels: Record<string, string> = {
  informational: 'Informational',
  promotional: 'Promotional',
  engagement: 'Engagement / Question',
  'behind-the-scenes': 'Behind the scenes',
  testimonial: 'Testimonial share',
};

const platformLabels: Record<string, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  twitter: 'Twitter/X',
  tiktok: 'TikTok',
};

export function buildCaptionPrompt(config: CaptionConfig, inspirationDesc?: string): string {
  return `You are writing a ${platformLabels[config.platform]} caption. Post type: ${postTypeLabels[config.postType]}.
Include hashtags: ${config.includeHashtags ? 'Yes' : 'No'}. Include CTA: ${config.includeCta ? 'Yes' : 'No'}.

Output in this format:
CAPTION:
[caption text]

${config.includeHashtags ? 'HASHTAGS:\n[hashtags]' : ''}

${config.includeCta ? 'CTA:\n[call to action line]' : ''}

ALT TEXT:
[alt text suggestion for the accompanying image]

${inspirationDesc ? `Inspiration reference: ${inspirationDesc}` : ''}`;
}
