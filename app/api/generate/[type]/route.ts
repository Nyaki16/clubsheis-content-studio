import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildUniversalSystemPrompt } from '@/lib/prompts/system';
import { buildCarouselPrompt } from '@/lib/prompts/carousel';
import { buildReelPrompt } from '@/lib/prompts/reel';
import { buildNewsletterPrompt } from '@/lib/prompts/newsletter';
import { buildVideoScriptPrompt } from '@/lib/prompts/video';
import { buildAdPrompt } from '@/lib/prompts/ad';
import { buildCaptionPrompt } from '@/lib/prompts/caption';
import { buildPosterPrompt } from '@/lib/prompts/poster';
import {
  buildTranscriptPrompt,
  buildTranscriptAnalysisPrompt,
  buildTranscriptPiecePrompt,
} from '@/lib/prompts/transcript';
import type { TranscriptFormat } from '@/types';

export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;

  try {
    const body = await request.json();
    const {
      client,
      topic,
      tone,
      typeConfig,
      inspirationBase64,
      inspirationMediaType,
      inspirationUrl,
      // Transcript split-mode fields:
      transcriptMode,
      transcriptText,
      transcriptKeyThemes,
      transcriptFormat,
      variationIndex,
      totalForFormat,
      // Voice preservation — when generating a carousel from a transcript piece,
      // pass the source text and a flag so the prompt lifts content verbatim.
      voicePreservation,
      sourceText,
    } = body;

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
    const hasImage = !!inspirationBase64 && !!inspirationMediaType;
    const inspirationDesc = inspirationUrl
      ? `The user provided this URL as inspiration: ${inspirationUrl}`
      : hasImage
        ? 'The user uploaded a style reference image. Study its visual layout, typography hierarchy, colour palette, spacing, and overall vibe. Match these design choices in your copy structure — mirror how the reference uses headlines vs body text, how much text per slide, and the tone/energy of the writing.'
        : undefined;

    switch (type) {
      case 'carousel':
        typePrompt = buildCarouselPrompt(typeConfig, inspirationDesc, voicePreservation, sourceText);
        break;
      case 'reel':
        typePrompt = buildReelPrompt(typeConfig, inspirationDesc, voicePreservation, sourceText);
        break;
      case 'newsletter':
        typePrompt = buildNewsletterPrompt(typeConfig, inspirationDesc, voicePreservation, sourceText);
        break;
      case 'video-animation':
        typePrompt = buildVideoScriptPrompt(typeConfig);
        break;
      case 'ad-creative':
        typePrompt = buildAdPrompt(typeConfig, inspirationDesc, voicePreservation, sourceText);
        break;
      case 'caption':
        typePrompt = buildCaptionPrompt(typeConfig, inspirationDesc, voicePreservation, sourceText);
        break;
      case 'static-image':
        typePrompt = buildPosterPrompt(typeConfig, inspirationDesc, voicePreservation, sourceText);
        break;
      case 'transcript':
        if (transcriptMode === 'analysis') {
          typePrompt = buildTranscriptAnalysisPrompt(transcriptText || '', transcriptKeyThemes);
        } else if (transcriptMode === 'piece') {
          typePrompt = buildTranscriptPiecePrompt(
            transcriptText || '',
            transcriptFormat as TranscriptFormat,
            Number(variationIndex) || 1,
            Number(totalForFormat) || 1,
            transcriptKeyThemes,
            inspirationDesc
          );
        } else {
          typePrompt = buildTranscriptPrompt(typeConfig, inspirationDesc);
        }
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

    // For transcript split modes the prompt already contains everything; don't append the topic
    const isTranscriptSplit = type === 'transcript' && (transcriptMode === 'analysis' || transcriptMode === 'piece');
    const userMessage = isTranscriptSplit
      ? `${typePrompt}${toneNote}`
      : `${typePrompt}${toneNote}\n\nTopic / Brief:\n${topic}`;

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

    // Tighter token budgets for split mode (one piece is small)
    const transcriptMaxTokens = transcriptMode === 'analysis' ? 2000 : transcriptMode === 'piece' ? 3000 : 16000;
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: type === 'transcript' ? transcriptMaxTokens : 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const generatedText = textBlock ? textBlock.text : '';

    return NextResponse.json({ content: generatedText });
  } catch (error) {
    console.error('Generation error:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Something went wrong on our end. Your brief is saved — tap Retry to try again. (${errMsg})` },
      { status: 500 }
    );
  }
}
