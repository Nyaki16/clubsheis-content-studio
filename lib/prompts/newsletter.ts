import { NewsletterConfig } from '@/types';

const lengthWords: Record<string, string> = {
  short: '~400',
  medium: '~700',
  long: '~1000',
};

export function buildNewsletterPrompt(config: NewsletterConfig, inspirationDesc?: string): string {
  return `You are writing a ${lengthWords[config.length]}-word newsletter with ${config.sectionCount} sections.
Subject line angle: ${config.subjectLineAngle}
CTA: ${config.cta}
Structure: Subject line | Preview text | Opening (personal, grounded, no fluff) | Sections | CTA section | Sign-off

Format the output clearly with these headers:
SUBJECT LINE:
PREVIEW TEXT:
OPENING:
SECTION 1: [title]
...
CTA:
SIGN-OFF:

${inspirationDesc ? `Inspiration reference: ${inspirationDesc}` : ''}`;
}
