import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildUniversalSystemPrompt } from '@/lib/prompts/system';
import type { SelectedClient } from '@/types';

export const maxDuration = 60;

const HOOK_DESCRIPTIONS: Record<string, string> = {
  'subject-line':
    'an email subject line that gets opened — under 65 characters, specific, intriguing, never clickbait, no emojis unless the brand uses them, no title case unless natural',
  'reel-hook':
    'a reel/short video opening line that hooks the viewer in the first two seconds — under 15 words, punchy, lifted from the speaker\'s actual phrasing where possible',
  'caption-hook':
    'an opening line for a social caption — short, specific, makes you want to read on, lifted from the source where possible',
  'carousel-hook':
    'a cover-slide headline for a carousel — under 12 words, sharp, lifted from the source where possible',
  'general':
    'a strong hook — short, specific, intriguing, lifted from the source where possible',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      topic,
      count = 5,
      hookType = 'subject-line',
      client,
      tone,
    } = body as {
      topic?: string;
      count?: number;
      hookType?: string;
      client?: SelectedClient;
      tone?: string;
    };

    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { error: 'Add source content (paste, audio, or doc link) before suggesting hooks.' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const systemPrompt = client ? buildUniversalSystemPrompt(client) : '';
    const desc = HOOK_DESCRIPTIONS[hookType] || HOOK_DESCRIPTIONS.general;

    const userPrompt = `Below is the source content the user is working with — could be a transcript, raw notes, or a brief.

Pull ${count} hook options from it. Each hook is ${desc}.

Hard rules:
- Use the speaker's / source's actual words and phrasing wherever possible. Do not paraphrase into AI-speak.
- Each option must have a DIFFERENT angle and entry point. No near-duplicates.
- Each hook stands alone — no setup needed.
- No "Are you ready to…", no "In a world where…", no "It's not X, it's Y", no "Let's be real". If those tells appear, replace them.
- No emojis unless the brand voice clearly uses them.
${tone ? `\nTone context: ${tone}\n` : ''}

Output STRICT JSON only — no prose, no markdown, no code fences:
{"hooks": ["…", "…", "…"]}

SOURCE CONTENT:
${topic}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const raw = textBlock && 'text' in textBlock ? textBlock.text : '{}';

    let hooks: string[] = [];
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(m ? m[0] : raw);
      if (Array.isArray(parsed.hooks)) {
        hooks = parsed.hooks.filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0);
      }
    } catch {
      // Fallback: split by lines and clean
      hooks = raw
        .split('\n')
        .map((l) => l.trim().replace(/^[-*"\d.)\s]+/, '').replace(/[",]+$/, '').trim())
        .filter((l) => l && !l.startsWith('{') && !l.startsWith('}') && !/^hooks/i.test(l) && l.length < 200);
    }

    if (hooks.length === 0) {
      return NextResponse.json({ error: 'No hooks could be generated from this content.' }, { status: 500 });
    }

    return NextResponse.json({ hooks });
  } catch (err) {
    console.error('Suggest hooks error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate hooks.' },
      { status: 500 }
    );
  }
}
