import { CarouselConfig } from '@/types';
import { VOICE_PRESERVATION_RULES } from './voice-preservation';

const formatLabels: Record<string, string> = {
  'tips': 'Tips / List',
  'story': 'Story / Narrative',
  'before-after': 'Before & After',
  'how-to': 'How To / Steps',
  'quote': 'Quote-driven',
};

export function buildCarouselPrompt(
  config: CarouselConfig,
  inspirationDesc?: string,
  voicePreservation?: boolean,
  sourceText?: string
): string {
  const hasStyleRef = inspirationDesc && inspirationDesc.includes('style reference image');

  if (voicePreservation) {
    return `You are reformatting a piece of writing into a ${config.slideCount}-slide Instagram carousel. The piece is provided below. Your job is to break it into slides while keeping the speaker's voice 100% intact.

${VOICE_PRESERVATION_RULES}

# SOURCE TEXT — the speaker's own words. Carousel content MUST come from here.

${sourceText || '[NO SOURCE PROVIDED]'}

# CAROUSEL STRUCTURE

- Slide 1 (cover): A short headline lifted verbatim (or near-verbatim) from a strong line in the source. Plus a subtitle that's another line from the source. No invented copy.
- Slides 2 to ${Math.max(config.slideCount - 1, 3)} (content): Each slide has:
  - headline: A direct quote or short phrase pulled from the source — the punchiest line that captures the slide's idea
  - body: The speaker's own sentences from the source (2-4 sentences) that expand the headline
- Final slide (CTA): Greeting + name + handle + call-to-action.
- Alternate "content-light" and "content-dark" types after the cover for visual rhythm.

Total: ${config.slideCount} slides. Never exceed 9 slides.

${hasStyleRef ? `STYLE ANALYSIS INSTRUCTIONS:
You have been given a style reference image. Carefully analyse its visual design and extract:
- The background colour (hex), background pattern (none/grid/dots/lines)
- The primary text colour (hex), the headline colour (hex)
- The accent/highlight colour (hex), highlight style (none/box/underline)
- The CTA colour (hex)

Include a "style" object in your output capturing these.` : ''}

Output ONLY a valid JSON ${hasStyleRef ? 'object' : 'array'} with this exact structure:
${hasStyleRef ? `{
  "style": {
    "backgroundColor": "#hex",
    "backgroundPattern": "none | grid | dots | lines",
    "textColor": "#hex",
    "headlineColor": "#hex",
    "accentColor": "#hex",
    "highlightStyle": "none | box | underline",
    "ctaColor": "#hex"
  },
  "slides": [
    { "slide": 1, "type": "cover", "headline": "...", "subtitle": "...", "hashtag": "#..." },
    { "slide": 2, "type": "content-light", "headline": "...", "body": "..." },
    { "slide": 3, "type": "content-dark", "headline": "...", "body": "..." },
    { "slide": N, "type": "cta", "greeting": "Hey, I'm", "name": "[CLIENT_NAME]", "handle": "@[HANDLE]", "ctaText": "Follow for more" }
  ]
}` : `[
  { "slide": 1, "type": "cover", "headline": "...", "subtitle": "...", "hashtag": "#..." },
  { "slide": 2, "type": "content-light", "headline": "...", "body": "..." },
  { "slide": 3, "type": "content-dark", "headline": "...", "body": "..." },
  { "slide": N, "type": "cta", "greeting": "Hey, I'm", "name": "[CLIENT_NAME]", "handle": "@[HANDLE]", "ctaText": "Follow for more" }
]`}

${inspirationDesc ? `Inspiration reference: ${inspirationDesc}` : ''}

Return ONLY the JSON ${hasStyleRef ? 'object' : 'array'}. No markdown code fences, no explanation, no other text.`;
  }

  return `You are writing copy for a ${config.slideCount}-slide Instagram carousel. Format: ${formatLabels[config.slideFormat] || config.slideFormat}.

CAROUSEL STRUCTURE — EVERY content slide has TWO parts:

1. **HEADLINE**: A bold, value-adding hook (5-12 words) that makes the reader NEED to read the detail below. This is NOT a label — it's a statement, insight, or provocative claim. Think of it as something you'd stop scrolling for. Written in large bold type.

2. **BODY**: A detailed explanation (2-4 sentences, 30-80 words) that expands on the headline with real substance. Give context, examples, specifics. This is where the value lives. Written in smaller readable type below the headline.

SLIDE-BY-SLIDE RULES:

**Slide 1 (Cover):** Bold headline only (5-10 words). Curiosity gap, relatable hook, or bold claim. Also include a short subtitle (1 sentence, 10-20 words) that teases what the carousel covers. No fluff.

**Slides 2-${Math.max(config.slideCount - 1, 3)} (Content):** Each slide MUST have:
- headline: A scroll-stopping hook that delivers value on its own (5-12 words)
- body: Detailed explanation expanding on the headline (30-80 words, 2-4 sentences)
- Build an arc across slides: problem → insight → solution, or curiosity → reveal → action
- Each headline should make the reader want to swipe to the next slide
- Alternate between "content-light" and "content-dark" types for visual rhythm

**Final slide (CTA):** Greeting + name + handle + call-to-action button.

Total: ${config.slideCount} slides. Never exceed 9 slides total.

HEADLINE RULES:
- Headlines are NOT labels ("Tip 1", "Step 3"). They are insights ("Your budget is lying to you")
- Each headline should work as a standalone Instagram caption
- Use tension, contrast, specificity, or relatability
- Avoid: "game-changer", "unlock", "level up", "here's the thing", "let's talk about"

BODY RULES:
- Be specific — use examples, numbers, scenarios
- Write like you're explaining to a friend, not lecturing
- South African / UK English spelling
- No staccato fragments. Fluid, connected prose.

${hasStyleRef ? `STYLE ANALYSIS INSTRUCTIONS:
You have been given a style reference image. Carefully analyse its visual design and extract:
- The background colour (hex) — is it dark, light, colourful?
- The background pattern — grid lines, solid, gradient, texture?
- The primary text colour (hex) — the colour used for body text
- The headline colour (hex) — could be different from body text
- The accent/highlight colour (hex) — used for emphasis, buttons, highlighted text
- The highlight style — does the reference use highlighted boxes behind headlines ("box"), underlines ("underline"), or no highlight ("none")?
- Overall vibe: dark-moody, light-minimal, bold-colourful, etc.

Include a "style" object in your output that captures these visual characteristics from the reference image.` : ''}

Output ONLY a valid JSON ${hasStyleRef ? 'object' : 'array'} with this exact structure:
${hasStyleRef ? `{
  "style": {
    "backgroundColor": "#hex (dominant background colour from reference)",
    "backgroundPattern": "none | grid | dots | lines",
    "textColor": "#hex (body text colour from reference)",
    "headlineColor": "#hex (headline text colour from reference)",
    "accentColor": "#hex (highlight/accent colour from reference)",
    "highlightStyle": "none | box | underline",
    "ctaColor": "#hex (call-to-action button/text colour)"
  },
  "slides": [
    { "slide": 1, "type": "cover", "headline": "...", "subtitle": "...", "hashtag": "#..." },
    { "slide": 2, "type": "content-light", "headline": "...", "body": "..." },
    { "slide": 3, "type": "content-dark", "headline": "...", "body": "..." },
    ...
    { "slide": N, "type": "cta", "greeting": "Hey, I'm", "name": "[CLIENT_NAME]", "handle": "@[HANDLE]", "ctaText": "Follow for more" }
  ]
}` : `[
  { "slide": 1, "type": "cover", "headline": "...", "subtitle": "...", "hashtag": "#..." },
  { "slide": 2, "type": "content-light", "headline": "...", "body": "..." },
  { "slide": 3, "type": "content-dark", "headline": "...", "body": "..." },
  ...
  { "slide": N, "type": "cta", "greeting": "Hey, I'm", "name": "[CLIENT_NAME]", "handle": "@[HANDLE]", "ctaText": "Follow for more" }
]`}

Slide types must alternate: after the cover, use "content-light", then "content-dark", then "content-light", etc. The final slide is always "cta".

${config.ctaSlide ? 'Include a dedicated CTA slide as the final slide.' : ''}
${inspirationDesc ? `Inspiration reference: ${inspirationDesc}` : ''}

Return ONLY the JSON ${hasStyleRef ? 'object' : 'array'}. No markdown code fences, no explanation, no other text.`;
}
