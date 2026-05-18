import { EmailSequenceConfig } from '@/types';
import { buildVoicePreservedPrompt } from './voice-preservation';

const goalLabels: Record<string, string> = {
  nurture: 'Nurture / educate',
  launch: 'Launch / sell',
  welcome: 'Welcome / onboard',
  're-engagement': 'Re-engagement',
  'post-webinar': 'Post-webinar follow-up',
};

export function buildEmailPrompt(
  config: EmailSequenceConfig,
  inspirationDesc?: string,
  voicePreservation?: boolean,
  sourceText?: string
): string {
  if (voicePreservation) {
    return buildVoicePreservedPrompt({
      task: `You are assembling a ${config.emailCount}-email sequence from the speaker's own transcript material. Goal: ${goalLabels[config.sequenceGoal]}. Cadence: ${config.sendCadence}. Every sentence of every email body must be a direct quote from the source.`,
      sourceText: sourceText || '',
      formatInstructions: `Final CTA / offer: ${config.offer}

Output ONLY a valid JSON array. No markdown, no backticks, no explanation. Just the raw JSON:

[
  {
    "emailNumber": 1,
    "sendDay": "Day 0",
    "subjectLine": "...",
    "preheader": "...",
    "body": "...",
    "cta": "..."
  }
]

Voice-preserved field rules:
- subjectLine: a verbatim short line from the source (6-10 words). Pick the punchiest, most opening-line-like sentence.
- preheader: another verbatim line from the source (40-90 chars). Must add reason to open, not repeat the subject.
- body: full email body, built ONLY from verbatim sentences from the source. A brief greeting line ("Hey," / "Hi friend,") and a brief sign-off are allowed as connective tissue. Everything between must be verbatim. Keep paragraph breaks aligned with the speaker's natural pauses.
- cta: a verbatim action-oriented line from the source. If the speaker has a literal CTA phrase, use it. If not, lift the closest invitation line they actually say.
- Each subsequent email pulls from a DIFFERENT section of the source than the previous one. Do not reuse the same passages across emails.
- If the source does not contain enough material for ${config.emailCount} distinct emails, return fewer emails rather than inventing content.`,
      inspirationDesc,
    });
  }

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
