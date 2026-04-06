import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return client;
}

export interface MessageContent {
  type: 'text' | 'image';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

export function buildMessageContent(
  userPrompt: string,
  inspirationBase64?: string,
  inspirationMediaType?: string,
  inspirationUrl?: string
): MessageContent[] {
  const content: MessageContent[] = [];

  if (inspirationBase64 && inspirationMediaType) {
    if (inspirationMediaType.startsWith('image/')) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: inspirationMediaType,
          data: inspirationBase64,
        },
      });
    }
  }

  let textContent = userPrompt;
  if (inspirationUrl) {
    textContent += `\n\nThe user has provided this URL as inspiration: ${inspirationUrl}. Describe what you would expect this reference to convey in terms of style, tone, and structure, and use that as creative direction.`;
  }

  content.push({ type: 'text', text: textContent });
  return content;
}
