import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, sampleContent } = body;

    if (!name || !sampleContent) {
      return NextResponse.json(
        { error: 'Name and sample content are required' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      // Return a basic analysis without AI
      return NextResponse.json({
        name,
        description: `Brand voice for ${name}`,
        voiceProfile: `Write in the voice and style of ${name}. Match their tone, sentence structure, vocabulary choices, and personality based on the sample content provided.`,
        sampleContent,
      });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: `You are a brand voice analyst. You study writing samples and extract a precise, actionable brand voice profile that another AI can use to replicate the voice perfectly.

Output a JSON object with these fields:
- description: A one-sentence summary of this voice (e.g. "Warm, direct, and slightly irreverent with a focus on practical advice")
- voiceProfile: A detailed 3-5 paragraph instruction set for an AI to replicate this exact voice. Include specifics about: tone, sentence length patterns, vocabulary preferences, rhetorical devices used, how they open and close pieces, what they avoid, their relationship with the reader, and any distinctive quirks.

Return ONLY valid JSON, no markdown fences.`,
      messages: [
        {
          role: 'user',
          content: `Analyse this writing sample from "${name}" and extract their brand voice:\n\n${sampleContent.slice(0, 8000)}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const rawText = textBlock ? textBlock.text : '';

    let analysis;
    try {
      analysis = JSON.parse(rawText);
    } catch {
      analysis = {
        description: `Brand voice for ${name}`,
        voiceProfile: rawText,
      };
    }

    return NextResponse.json({
      name,
      description: analysis.description,
      voiceProfile: analysis.voiceProfile,
      sampleContent,
    });
  } catch (error) {
    console.error('Brand voice analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyse brand voice' },
      { status: 500 }
    );
  }
}
