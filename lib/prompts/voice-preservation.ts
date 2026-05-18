/**
 * Shared voice-preservation rules used by every content-type builder when a
 * source transcript is supplied. The rules are deliberately strict: when the
 * user gives us a transcript, every text-generating feature must lift the
 * speaker's actual words. No rewriting, no paraphrasing, no AI flourishes.
 */

export const VOICE_PRESERVATION_RULES = `# VOICE PRESERVATION MODE — ABSOLUTE RULES

A SOURCE TRANSCRIPT is provided below. It is the only acceptable source of words, phrasing, sentence structure, and ideas for this output. You are NOT writing new copy. You are reformatting the speaker's own words into the requested format.

Hard rules — every single one is non-negotiable:

1. Verbatim only. Every sentence in the output must be a direct quote (or near-verbatim — light cleanup of stutters, "um", repeated words) from the source transcript. If the source does not contain a sentence, do not invent one.
2. No paraphrasing. Do not "say the same thing in a clearer way". If the speaker's exact words are not usable, omit that idea entirely rather than rewriting it.
3. No new content. No new claims, examples, statistics, analogies, framings, hooks, taglines, or CTAs unless they appear in the source. The output's substance must be 100% from the source.
4. Match sentence length and rhythm exactly. Long winding sentences stay long. Short hits stay short. Do not chop the speaker's sentences into bullets unless the format STRICTLY requires bullets — in which case each bullet is still a verbatim sentence from the source.
5. Keep their fillers, quirks and signatures. "Right?", "You know what I mean?", "Listen…", "OK so", "the thing is" — these are voice, not noise. Keep them.
6. Use the speaker's vocabulary, only. No synonyms. If they say "money", do not write "income" or "revenue". If they say "babe", do not write "girl" or "friend".
7. Preserve the messaging exactly. Do not reframe the argument. Do not soften it. Do not add caveats the speaker did not add. Do not make it more "balanced".
8. UK / South African English — and match the speaker's spelling and dialect.
9. No AI tells. These phrases are banned regardless of format: "in today's world", "imagine if", "picture this", "the truth is", "here's the thing", "it's not X, it's Y", "let's be real", "buckle up", "scroll-stopping", "game-changer", "unlock", "level up", "transform your", "elevate your", "the secret to", "the key to", "the ultimate", "the perfect", "you deserve", "dive in", "let's talk about", "ready to". Do not use them.
10. No staccato marketing fragments. No em dashes (—). No corporate filler.

Connective tissue — minimal. Required format scaffolding (a label like "Subject:" or "CTA:" or "HOOK:", a greeting like "Hey," a sign-off like "—Name") can be added. Anything beyond that must be a verbatim line from the source. When in doubt, use a quote.

If you find yourself writing a sentence that is not in the source, stop and pull a real one instead.`;

/**
 * Wrap a format-specific instruction block with the strict voice-preservation
 * preamble, the source transcript, and a closing reminder. Used by every
 * content-type builder's voice-preserved branch.
 */
export function buildVoicePreservedPrompt(opts: {
  task: string;
  sourceText: string;
  formatInstructions: string;
  inspirationDesc?: string;
}): string {
  return `${opts.task}

${VOICE_PRESERVATION_RULES}

# SOURCE TRANSCRIPT — the only acceptable source of words for this output

${opts.sourceText || '[NO SOURCE PROVIDED — output a single line saying the transcript is missing and stop.]'}

# FORMAT INSTRUCTIONS

${opts.formatInstructions}

${opts.inspirationDesc ? `Inspiration reference: ${opts.inspirationDesc}\n\n` : ''}Final reminder: every sentence in the output must trace back to a real sentence in the source. If you cannot find a real one, omit. Do not invent.`;
}
