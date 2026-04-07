import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildUniversalSystemPrompt } from '@/lib/prompts/system';
import { buildCarouselPrompt } from '@/lib/prompts/carousel';
import { buildReelPrompt } from '@/lib/prompts/reel';
import { buildNewsletterPrompt } from '@/lib/prompts/newsletter';
import { buildEmailPrompt } from '@/lib/prompts/email';
import { buildAdPrompt } from '@/lib/prompts/ad';
import { buildCaptionPrompt } from '@/lib/prompts/caption';
import { buildPosterPrompt } from '@/lib/prompts/poster';
import { buildTranscriptPrompt } from '@/lib/prompts/transcript';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;

  try {
    const body = await request.json();
    const { client, topic, tone, typeConfig, inspirationBase64, inspirationMediaType, inspirationUrl } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const systemPrompt = buildUniversalSystemPrompt(client);

    // Build the type-specific prompt
    let typePrompt = '';
    const inspirationDesc = inspirationUrl
      ? `The user provided this URL as inspiration: ${inspirationUrl}`
      : undefined;

    switch (type) {
      case 'carousel':
        typePrompt = buildCarouselPrompt(typeConfig, inspirationDesc);
        break;
      case 'reel':
        typePrompt = buildReelPrompt(typeConfig, inspirationDesc);
        break;
      case 'newsletter':
        typePrompt = buildNewsletterPrompt(typeConfig, inspirationDesc);
        break;
      case 'email-sequence':
        typePrompt = buildEmailPrompt(typeConfig, inspirationDesc);
        break;
      case 'ad-creative':
        typePrompt = buildAdPrompt(typeConfig, inspirationDesc);
        break;
      case 'caption':
        typePrompt = buildCaptionPrompt(typeConfig, inspirationDesc);
        break;
      case 'static-image':
        typePrompt = buildPosterPrompt(typeConfig, inspirationDesc);
        break;
      case 'transcript':
        typePrompt = buildTranscriptPrompt(typeConfig, inspirationDesc);
        break;
      default:
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    // If tone contains a brand voice profile (multiline), inject it prominently
    let toneNote = '';
    if (tone && tone !== client.tone) {
      if (tone.includes('BRAND VOICE PROFILE')) {
        toneNote = `\n\n${tone}`;
      } else {
        toneNote = `\n\nTone adjustment requested: ${tone}`;
      }
    }

    const userMessage = `${typePrompt}${toneNote}\n\nTopic / Brief:\n${topic}`;

    // Build message content with optional image
    const content: Anthropic.MessageCreateParams['messages'][0]['content'] = [];

    if (inspirationBase64 && inspirationMediaType && inspirationMediaType.startsWith('image/')) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: inspirationMediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: inspirationBase64,
        },
      });
    }

    if (inspirationBase64 && inspirationMediaType === 'application/pdf') {
      content.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: inspirationBase64,
        },
      } as Anthropic.DocumentBlockParam);
    }

    content.push({ type: 'text', text: userMessage });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const generatedText = textBlock ? textBlock.text : '';

    return NextResponse.json({ content: generatedText });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Something went wrong on our end. Your brief is saved — tap Retry to try again.' },
      { status: 500 }
    );
  }
}
