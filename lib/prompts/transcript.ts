import { TranscriptConfig, TranscriptFormat } from '@/types';

const formatLabels: Record<TranscriptFormat, string> = {
  carousel: 'CAROUSEL',
  reel: 'REEL SCRIPT',
  caption: 'CAPTION',
  newsletter: 'NEWSLETTER SECTION',
  email: 'EMAIL',
  summary: 'SUMMARY DOC',
};

const formatBrief: Record<TranscriptFormat, string> = {
  carousel:
    'A multi-slide Instagram carousel. Output as a JSON array of slides — [{"slide":1,"headline":"…","body":"…"}, …]. Each slide must be built around a verbatim or near-verbatim line from the transcript.',
  reel:
    'A short-form video script. Sections: Hook (a real line lifted from the transcript), Script (verbatim sentences from the transcript in the order they build the argument), CTA, Caption.',
  caption:
    'A social caption. Open with one of the speaker\'s actual lines. Build the rest from their phrasing. Hashtags last only if appropriate.',
  newsletter:
    'A complete newsletter section. Mostly built from the speaker\'s own sentences with light connective tissue between them. Include a 50+ word direct quote as a pull-block where you can.',
  email:
    'A complete email. Sections: Subject line in their voice, Preheader, Body (≥60% verbatim or near-verbatim transcript material), CTA.',
  summary:
    'A summary in the speaker\'s voice — not a corporate executive summary. Use their words. Bullet only if the speaker would.',
};

const SHARED_RULES = `# RULES FOR REPURPOSING (CRITICAL)

- Quote, don't rewrite. When the speaker has already said it well, lift the sentence verbatim. Do not "improve" it.
- No AI tells. Avoid "in today's world", "imagine if", "the truth is", "it's not X, it's Y", "let's be real", "buckle up". If the speaker doesn't talk like that, do not write like that.
- Match sentence length and rhythm. If they speak in long winding sentences, do not chop them into bullet points unless the format demands it. If they speak in short hits, keep it short.
- Keep their fillers and quirks when they are part of the voice. "Right?" "You know what I mean?" "Listen…" — these are signatures, not problems to fix.
- Preserve the messaging exactly. Do not reframe the argument. Do not soften it. Do not add nuance the speaker did not add.
- No new claims, examples, statistics, or framings. Everything must come from the transcript itself.
- UK / South African English (use the speaker's spelling).`;

/**
 * Analysis-only prompt — produces voice analysis, key moments, key insights. No pieces.
 * Fast and small (under a few thousand tokens).
 */
export function buildTranscriptAnalysisPrompt(transcript: string, keyThemes?: string): string {
  return `# YOUR TASK
Read the transcript below and produce ONLY three sections: voice analysis, key moments, and key insights. Do not produce any other content. Do not produce carousels, reels, captions, newsletters, emails, or summaries.

${SHARED_RULES}

# TRANSCRIPT

${transcript || '[NO TRANSCRIPT PROVIDED — output a single line asking the user to paste the transcript and stop.]'}

${keyThemes ? `\n# THEMES TO PRIORITISE\n${keyThemes}\n` : ''}

# OUTPUT STRUCTURE — use these EXACT headings, in this order

=== VOICE ANALYSIS ===
Two or three sentences capturing the speaker's tone, sentence rhythm, and signature words/phrases.

=== KEY MOMENTS ===
Three to five standout passages. For each, give the verbatim quote in quotation marks, then one short line of context.

=== KEY INSIGHTS ===
Three to five core ideas the speaker is making, each in one or two sentences using their own framing.

Stop after KEY INSIGHTS.`;
}

/**
 * Single-piece prompt — produces one piece of one format with a specified variation index.
 */
export function buildTranscriptPiecePrompt(
  transcript: string,
  format: TranscriptFormat,
  variationIndex: number,
  totalForFormat: number,
  keyThemes?: string,
  inspirationDesc?: string
): string {
  const label = formatLabels[format];
  const brief = formatBrief[format];
  const isVariant = totalForFormat > 1;
  const hookGuidance = variationIndex === 1
    ? 'Pull a strong key moment from the transcript as the entry point.'
    : `This is variation ${variationIndex} of ${totalForFormat}. Use a DIFFERENT key moment, quote, and angle than ${label} variations 1 through ${variationIndex - 1} would. Different opening line. Different focal point.`;

  return `# YOUR TASK
Produce ONE piece — ${label} ${isVariant ? `#${variationIndex} of ${totalForFormat}` : ''} — repurposed from the transcript below.

The single most important rule: keep the speaker's voice intact. Lift their own words, sentences, phrases and rhythm wherever possible. Pull direct quotes verbatim. Do not paraphrase what already works.

${SHARED_RULES}

# THIS PIECE

Format: ${label}
Brief: ${brief}
Hook angle: ${hookGuidance}

# TRANSCRIPT

${transcript || '[NO TRANSCRIPT PROVIDED — output a single line asking the user to paste the transcript and stop.]'}

${keyThemes ? `\n# THEMES TO PRIORITISE\n${keyThemes}\n` : ''}

# OUTPUT STRUCTURE

Output exactly this single block, with the heading on its own line:

=== ${label} #${variationIndex} ===
[the piece itself, following the brief above]

Do NOT output voice analysis, key moments, key insights, or any other format. Output ONLY the single ${label} #${variationIndex} block.${inspirationDesc ? `\n\nInspiration reference: ${inspirationDesc}` : ''}`;
}

/**
 * Legacy combined prompt — kept for backward compatibility. The client now uses the
 * split prompts (analysis + per-piece) for faster, parallel generation.
 */
export function buildTranscriptPrompt(config: TranscriptConfig, inspirationDesc?: string): string {
  const transcript = (config.transcriptText || '').trim();

  const requested = (Object.entries(config.outputCounts || {}) as [TranscriptFormat, number][])
    .filter(([, count]) => typeof count === 'number' && count > 0);

  const requestList = requested
    .map(([format, count]) => `- ${count} × ${formatLabels[format]}`)
    .join('\n');

  const outputBlocks = requested
    .map(([format, count]) => {
      const label = formatLabels[format];
      const brief = formatBrief[format];
      const variations = Array.from({ length: count }, (_, i) => i + 1)
        .map((n) => `=== ${label} #${n} ===\n[${brief}]\n[Hook angle: must be different from all other ${label} pieces in this output. Pull a different key moment or quote from the transcript as the entry point.]`)
        .join('\n\n');
      return variations;
    })
    .join('\n\n');

  return `# YOUR TASK
Repurpose the transcript below into the following individual pieces:

${requestList || '- (None selected)'}

The single most important rule: keep the speaker's voice intact.

${SHARED_RULES}

# TRANSCRIPT

${transcript || '[NO TRANSCRIPT PROVIDED]'}

${config.keyThemes ? `\n# THEMES TO PRIORITISE\n${config.keyThemes}\n` : ''}

# OUTPUT STRUCTURE

=== VOICE ANALYSIS ===
2-3 sentences.

=== KEY MOMENTS ===
3-5 verbatim quotes with one line of context each.

=== KEY INSIGHTS ===
3-5 core ideas.

${outputBlocks}${inspirationDesc ? `\n\nInspiration reference: ${inspirationDesc}` : ''}`;
}
