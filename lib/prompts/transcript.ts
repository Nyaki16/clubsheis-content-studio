import { TranscriptConfig } from '@/types';

const formatLabels: Record<string, string> = {
  carousel: 'Carousel',
  reel: 'Reel Script',
  caption: 'Caption',
  newsletter: 'Newsletter section',
  email: 'Email',
  summary: 'Summary doc',
};

export function buildTranscriptPrompt(config: TranscriptConfig, inspirationDesc?: string): string {
  const formats = config.outputFormats.map(f => formatLabels[f] || f).join(', ');

  return `You have been given a transcript from a masterclass or session.
Extract the core ideas and repurpose them into the following formats: ${formats}

For each format, produce a complete, publication-ready piece, not a summary or outline.
${config.keyThemes ? `Key themes to prioritise: ${config.keyThemes}` : ''}

Output each format under a clear heading:

=== CAROUSEL ===
[If selected: JSON array of slides]

=== REEL SCRIPT ===
[If selected: Hook, Script, CTA, Caption]

=== CAPTION ===
[If selected: Full caption with hashtags]

=== NEWSLETTER SECTION ===
[If selected: Full newsletter section]

=== EMAIL ===
[If selected: Complete email with subject, preview, body, CTA]

=== SUMMARY DOC ===
[If selected: Executive summary of key points]

Only output the formats that were requested.

${inspirationDesc ? `Inspiration reference: ${inspirationDesc}` : ''}`;
}
