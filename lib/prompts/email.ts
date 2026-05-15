import { EmailSequenceConfig } from '@/types';

const goalLabels: Record<string, string> = {
  nurture: 'Nurture / educate',
  launch: 'Launch / sell',
  welcome: 'Welcome / onboard',
  're-engagement': 'Re-engagement',
  'post-webinar': 'Post-webinar follow-up',
};

export function buildEmailPrompt(config: EmailSequenceConfig, inspirationDesc?: string): string {
  return `You are writing a ${config.emailCount}-email sequence. Goal: ${goalLabels[config.sequenceGoal]}. Cadence: ${config.sendCadence}.
Final CTA / offer: ${config.offer}

For each email, write the subject line, preview text (preheader), and full body separately.

Output ONLY a valid JSON array. No markdown, no backticks, no explanation. Just the raw JSON:

[
  {
    "emailNumber": 1,
    "sendDay": "Day 0",
    "subjectLine": "...",
    "preheader": "...",
    "body": "...",
    "cta": "..."
  },
  {
    "emailNumber": 2,
    "sendDay": "Day 2",
    "subjectLine": "...",
    "preheader": "...",
    "body": "...",
    "cta": "..."
  }
]

Rules for each email:
- Subject line: 6-10 words, curiosity-driven, no clickbait, no ALL CAPS
- Preheader: 40-90 characters, complements the subject (not repeats it), adds a reason to open
- Body: Full email copy — personal, conversational, grounded. Open with a hook or story, build value, close with the CTA. Use short paragraphs. No fluff, no AI openers ("I hope this finds you well"), no long dashes
- CTA: One clear call to action per email
- Each email should build on the previous one — don't repeat the same angle
- Write in UK/SA English (favour, colour, organise)

${inspirationDesc ? `Inspiration reference: ${inspirationDesc}` : ''}`;
}
