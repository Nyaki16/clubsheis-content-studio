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
For each email output clearly in this format:

EMAIL 1
Send day: [day]
Subject line: [subject]
Preview text: [preview]
Body:
[full body]
CTA: [cta]

EMAIL 2
...and so on.

${inspirationDesc ? `Inspiration reference: ${inspirationDesc}` : ''}`;
}
