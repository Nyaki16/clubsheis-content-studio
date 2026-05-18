import { CaptionConfig } from '@/types';
import { buildVoicePreservedPrompt } from './voice-preservation';

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

export function buildCaptionPrompt(
  config: CaptionConfig,
  inspirationDesc?: string,
  voicePreservation?: boolean,
  sourceText?: string
): string {
  if (voicePreservation) {
    return buildVoicePreservedPrompt({
      task: `You are assembling a ${platformLabels[config.platform]} caption from the speaker's own transcript material. Post type: ${postTypeLabels[config.postType]}. Every sentence of the caption must be a direct quote from the source.`,
      sourceText: sourceText || '',
      formatInstructions: `Include hashtags: ${config.includeHashtags ? 'Yes' : 'No'}. Include CTA: ${config.includeCta ? 'Yes' : 'No'}.

Output in this format:
CAPTION:
[verbatim sentences from the source, in the order they build the idea. Open with one of the speaker's actual lines. No invented hooks. No new content.]

${config.includeHashtags ? 'HASHTAGS:\n[3-8 hashtags only, drawn from terms the speaker actually uses in the source. No generic marketing hashtags.]' : ''}

${config.includeCta ? 'CTA:\n[a verbatim action-oriented line from the source]' : ''}

ALT TEXT:
[a brief verbatim line from the source that describes the image / scene the speaker references]`,
      inspirationDesc,
    });
  }

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
