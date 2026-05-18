import { NewsletterConfig } from '@/types';
import { buildVoicePreservedPrompt } from './voice-preservation';

const lengthWords: Record<string, string> = {
  short: '~400',
  medium: '~700',
  long: '~1000',
};

const sectionsForLength: Record<string, string> = {
  short: '2-3',
  medium: '3-4',
  long: '4-5',
};

const styleDescriptions: Record<string, string> = {
  editorial: 'Clean editorial style — serif headlines, generous whitespace, text-focused with subtle accent colours. Think Substack or premium newsletters.',
  'product-launch': 'Product-first layout — hero image/product shot at top, benefit-driven sections with feature callouts, bold CTA buttons. Think Apple or beauty brand launches.',
  minimal: 'Minimal and modern — no heavy graphics, clean typography, lots of breathing room. Single-column, focused on readability.',
  bold: 'Bold and high-energy — strong colour blocks, large headlines, dynamic sections with contrasting backgrounds. Think fitness or coaching brands.',
};

export function buildNewsletterPrompt(
  config: NewsletterConfig,
  inspirationDesc?: string,
  voicePreservation?: boolean,
  sourceText?: string
): string {
  const style = config.style || 'editorial';
  const hasImages = config.productImages && config.productImages.length > 0;
  const imageCount = hasImages ? config.productImages!.length : 0;

  const ctaUrl = config.ctaUrl?.trim() || '#';

  if (voicePreservation) {
    return buildVoicePreservedPrompt({
      task: `You are reformatting the speaker's own transcript material into a ${lengthWords[config.length]}-word newsletter with ${sectionsForLength[config.length]} sections. You are NOT writing a new newsletter. Every sentence of the newsletter body must be a direct quote from the source transcript.`,
      sourceText: sourceText || '',
      formatInstructions: `Subject line angle: ${config.subjectLineAngle}
CTA: ${config.cta}
CTA URL: ${ctaUrl}
${hasImages ? `The user has uploaded ${imageCount} product/feature image(s). Place them strategically. Reference as IMAGE_1, IMAGE_2, etc.` : ''}

Output ONLY a valid JSON object. No markdown, no backticks, no explanation. Raw JSON only:

{
  "subjectLine": "...",
  "preheader": "...",
  "sections": [
    {
      "type": "hero",
      "headline": "...",
      "body": "...",
      "imageSlot": null or 1,
      "ctaText": null or "...",
      "ctaUrl": "${ctaUrl}"
    },
    {
      "type": "content",
      "headline": "...",
      "body": "...",
      "imageSlot": null or 2,
      "ctaText": null,
      "ctaUrl": null
    },
    {
      "type": "cta",
      "headline": "...",
      "body": "...",
      "imageSlot": null,
      "ctaText": "${config.cta || 'Learn More'}",
      "ctaUrl": "${ctaUrl}"
    }
  ],
  "signOff": "...",
  "signOffName": "..."
}

Voice-preserved field rules:
- subjectLine: a short verbatim line lifted from the source (6-10 words). Pick the punchiest one. Do not invent.
- preheader: another verbatim line from the source (40-90 chars).
- Each section headline: a verbatim sentence or phrase pulled from the source.
- Each section body: verbatim sentences from the source, in the order the speaker built the argument. No paraphrasing. No new content.
- ctaText: keep within the speaker's vocabulary. If they have an actual CTA phrase in the source, use it. Otherwise pick a verbatim short line that reads like an invitation.
- signOff and signOffName: connective tissue allowed (a short sign-off line, then the speaker's name).
- For any section that has a ctaText, set ctaUrl to "${ctaUrl}". Sections without a CTA must keep ctaUrl as null.
- If images are available, assign imageSlot (1-indexed) to the sections where they belong.`,
      inspirationDesc,
    });
  }

  return `You are writing a ${lengthWords[config.length]}-word newsletter with ${sectionsForLength[config.length]} sections.
Subject line angle: ${config.subjectLineAngle}
CTA: ${config.cta}
CTA URL: ${ctaUrl}
Email style: ${styleDescriptions[style]}
${hasImages ? `The user has uploaded ${imageCount} product/feature image(s). Place them strategically in the sections where they add the most impact. Reference them as IMAGE_1, IMAGE_2, etc.` : 'No product images provided — the design will be text-focused with accent colours.'}

Output ONLY a valid JSON object. No markdown, no backticks, no explanation. Raw JSON only:

{
  "subjectLine": "...",
  "preheader": "...",
  "sections": [
    {
      "type": "hero",
      "headline": "...",
      "body": "...",
      "imageSlot": null or 1,
      "ctaText": null or "...",
      "ctaUrl": "${ctaUrl}"
    },
    {
      "type": "content",
      "headline": "Section title...",
      "body": "2-3 paragraphs of real value...",
      "imageSlot": null or 2,
      "ctaText": null,
      "ctaUrl": null
    },
    {
      "type": "cta",
      "headline": "Closing hook...",
      "body": "Final push...",
      "imageSlot": null,
      "ctaText": "${config.cta || 'Learn More'}",
      "ctaUrl": "${ctaUrl}"
    }
  ],
  "signOff": "Warm sign-off line",
  "signOffName": "Name"
}

Section types: "hero" (opening with big headline), "content" (value section), "feature" (product/benefit callout), "testimonial" (social proof quote), "cta" (closing action).

Rules:
- Subject line: 6-10 words, curiosity-driven, no clickbait, no ALL CAPS
- Preheader: 40-90 chars, complements subject, adds reason to open
- Hero section: scroll-stopping headline, 1-2 sentence hook
- Content sections: lead with value, not fluff. Short paragraphs. Use line breaks between paragraphs.
- If images are available, assign imageSlot (1-indexed) to the sections where they belong
- CTA section: one clear, compelling action
- For any section that has a ctaText, set ctaUrl to "${ctaUrl}". Sections without a CTA must keep ctaUrl as null.
- Write in UK/SA English (favour, colour, organise)
- No AI openers ("I hope this finds you well"), no long dashes
- Every section must earn its place — if it doesn't add value, cut it

${inspirationDesc ? `Inspiration reference: ${inspirationDesc}` : ''}`;
}
