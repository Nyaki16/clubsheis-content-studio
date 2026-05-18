import { NewsletterConfig } from '@/types';

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
    return `# TRANSCRIPT → NEWSLETTER / BLOG

You are transforming a meeting or masterclass transcript into a newsletter that doubles as a blog article. Your job is not to summarise like a journalist. Your job is to capture what was actually said, in the way it was actually said, and reshape it into something readable for people who weren't in the room — while keeping the speaker's voice fully intact.

## SCOPE NOTE — this format overrides the strict verbatim-only rule

A newsletter is long-form and needs connective prose, so for THIS task the global "every sentence must be a verbatim quote" rule does NOT apply. Instead: keep the speaker's voice fully intact — their words, vocabulary, sentence rhythm, slang, specifics — and reshape it into a readable arc. Lift direct quotes where they hit, used sparingly, only when the speaker's exact wording beats any paraphrase. Everything else is still built from what the speaker actually said. No invented content, no new claims, no smoothing specifics into generic wisdom.

## INPUTS

- The transcript is in the SOURCE TRANSCRIPT block below.
- Session title / topic angle: ${config.subjectLineAngle || '(infer from the transcript)'}
- CTA / next step: ${config.cta || '(none given — sign off the way the speaker would)'}
- CTA URL: ${ctaUrl}
- Speaker and audience context: see the system prompt for the client. If unclear, infer from the transcript.

## BEFORE YOU WRITE

1. Read the full transcript end to end before writing a single word. Don't draft as you go.
2. Identify the speaker's verbal fingerprint: words they repeat, how they open thoughts, the phrases they use to land a point, sentence rhythm, how they use humour, how they handle tension, the kind of stories they tell, how they bring in faith/data/personal life if they do. Note specific repeated phrases verbatim — these go into the newsletter unchanged.
3. Map the arc of the session: what was the through-line? Where did it start, where did it land? What shift was the speaker trying to create in the room?
4. Pull out the 3-5 main lessons or moments someone who wasn't there needs to walk away with. Not 8. Not 12. The non-negotiables.
5. Find the inspirational sections — the parts that made the room go quiet, or laugh, or write things down. Quote these directly where possible, lightly cleaned of filler.
6. Find the specific receipts: numbers, names, examples, stories, "this one time" moments. Keep them. Do not generalise them into smooth abstractions. If they said "I lost R40k on that launch," do not write "they experienced a significant financial setback."

## STRUCTURE — map to the JSON sections below

- subjectLine: one line. Specific. Sounds like the speaker would actually say it. Not "5 Lessons From X" unless that's genuinely how they'd phrase it. Curiosity over cleverness.
- preheader: a short line that adds a reason to open. The speaker's voice, not a marketer's.
- "hero" section — the opening hook. Drop the reader into a moment, a question, or a line from the session. Not "In yesterday's masterclass, [Speaker] taught us about…". Start the way the speaker would start a story over coffee. The hero headline is the title; the hero body is the hook plus the setup of what this session was really about, framed the way the speaker framed it (2-3 short paragraphs).
- "content" section(s) — the main body. The 3-5 lessons, woven in. Do NOT write a numbered list of takeaways. Write a reflective piece where the lessons emerge through the speaker's own examples, phrasing and logic. A numbered structure is allowed only if the session genuinely fits it, and the language inside each point must still sound spoken. Keep the specific stories, names, receipts and direct quotes. Use as many "content" sections as the arc needs (aim for 2-4). Each headline is a subheading in the speaker's voice — not "Key Insight #2".
- "cta" section — the reflective close. Translate the session for the reader who wasn't there: what does this mean for their own life or business? Still in the speaker's voice, not yours. Ask the question the speaker would ask. Land where the session landed. Then the CTA.
- signOff / signOffName: however the speaker would actually sign off.

## VOICE RULES — non-negotiable

- Match the speaker's sentence length and rhythm. Short punchy lines if they speak that way; let it ramble if the ramble lands.
- Keep their contractions, slang, cultural references. Don't sand them down.
- Keep filler that is actually voice ("look," "honestly," "okay so," "the thing is"). Strip filler that is just noise ("um," "uh," "like like").
- No AI tells. Banned: "in today's fast-paced world," "let's dive in," "unpack," "powerful insights," "game-changing," "transformative journey," "in conclusion," "remember," neat parallel structures of three, and any sentence that could have been written by anyone about anything. ("Key takeaways" as a heading is fine only if the speaker actually said it.)
- No em-dash (—) overuse. If the speaker doesn't pause like that, don't write like that.
- No symmetry for symmetry's sake. Real talk is uneven. Let it be uneven.
- Faith, swearing, vulnerability, humour — if it's in the transcript, it stays (unless told otherwise).
- First person stays first person. If the speaker said "I," do not translate it to "we" or "you".

## LENGTH

Total body ~600-1,000 words across all sections, unless the session genuinely demands more. Tighter is usually better. Short paragraphs, lots of white space.

# SOURCE TRANSCRIPT

${sourceText || '[NO TRANSCRIPT PROVIDED — output a single line saying the transcript is missing and stop.]'}

# OUTPUT

Output ONLY a valid JSON object. No markdown, no backticks, no explanation. Raw JSON only:

{
  "subjectLine": "...",
  "preheader": "...",
  "imageSuggestion": "...",
  "sections": [
    { "type": "hero", "headline": "...", "body": "...", "imageSlot": ${hasImages ? 'null or 1' : 'null'}, "ctaText": null, "ctaUrl": null },
    { "type": "content", "headline": "...", "body": "...", "imageSlot": ${hasImages ? 'null or 2' : 'null'}, "ctaText": null, "ctaUrl": null },
    { "type": "cta", "headline": "...", "body": "...", "imageSlot": null, "ctaText": "${config.cta || 'Read more'}", "ctaUrl": "${ctaUrl}" }
  ],
  "signOff": "...",
  "signOffName": "..."
}

JSON rules:
- imageSuggestion: one or two sentences describing a hero image that would suit the piece — drawn from a real moment, object or scene in the transcript. Describe it, do not generate it. If nothing relevant fits, use an empty string "".
- Use 2-4 "content" sections between the hero and the cta, as the arc needs.
- "body" fields hold the prose. Use \\n\\n between paragraphs. Keep paragraphs short.
- Only the final "cta" section carries ctaText and ctaUrl. Every other section keeps both as null.
${hasImages ? `- The user uploaded ${imageCount} image(s). Assign imageSlot (1-indexed) to the sections where each image best belongs.` : '- No images uploaded — keep every imageSlot null.'}

## BEFORE YOU FINALISE — check yourself

- If I read this out loud, does it sound like the speaker talking, or like an article about the speaker?
- Did I keep the specifics — names, numbers, stories — or smooth them into generic wisdom?
- Would someone who was in the session recognise it as a real reflection of what happened?
- Did I sneak in any AI phrases, neat triplets, or "in conclusion" energy?

If any answer is wrong, rewrite that section before returning the JSON.${inspirationDesc ? `\n\nInspiration reference: ${inspirationDesc}` : ''}`;
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
