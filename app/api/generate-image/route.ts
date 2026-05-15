import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60;

interface SlideImageRequest {
  slides: {
    slideIndex: number;
    headline: string;
    body?: string;
    type: string;
  }[];
  clientName: string;
  topic: string;
  brandColour?: string;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Add GEMINI_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const body: SlideImageRequest = await request.json();
    const { slides, clientName, topic, brandColour } = body;

    if (!slides || slides.length === 0) {
      return NextResponse.json({ error: 'No slides provided' }, { status: 400 });
    }

    // Generate images sequentially to avoid rate limits
    const images: { slideIndex: number; base64: string }[] = [];
    const errors: { slideIndex: number; error: string }[] = [];

    for (const slide of slides) {
      let imagePrompt = '';

      if (slide.type === 'cover') {
        imagePrompt = `Professional, high-quality editorial photograph for a social media carousel cover slide. Theme: "${slide.headline}". Topic: ${topic}. Style: modern, aspirational, clean background with subtle depth and bokeh. Warm tones with ${brandColour || 'earthy browns and golds'}. Vertical portrait orientation. No text, no words, no logos, no watermarks anywhere in the image.`;
      } else if (slide.type === 'cta') {
        imagePrompt = `Professional lifestyle photograph for a social media call-to-action slide. Theme: motivation, connection, empowerment for ${clientName}. Style: warm, inviting, natural light, soft focus background. ${brandColour || 'Warm earth tones'}. Vertical portrait. No text, no words, no logos, no watermarks.`;
      } else {
        imagePrompt = `Professional editorial photograph for a social media carousel slide about "${slide.headline}". ${slide.body ? `Context: ${slide.body.slice(0, 80)}` : ''}. Style: modern editorial, clean composition, visual interest. ${brandColour || 'Warm earthy palette'}. Vertical portrait. No text, no words, no logos, no watermarks.`;
      }

      try {
        // Try Imagen 4 first (purpose-built for image generation)
        const response = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: imagePrompt,
          config: {
            numberOfImages: 1,
            aspectRatio: '4:5',
          },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
          const imgBytes = response.generatedImages[0].image?.imageBytes;
          if (imgBytes) {
            images.push({ slideIndex: slide.slideIndex, base64: imgBytes });
            continue;
          }
        }

        errors.push({ slideIndex: slide.slideIndex, error: 'No image data in response' });
      } catch (imgErr) {
        // Fallback: try Gemini native image generation
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: imagePrompt,
            config: {
              responseModalities: ['IMAGE'],
            },
          });

          const parts = response.candidates?.[0]?.content?.parts;
          if (parts) {
            for (const part of parts) {
              if (part.inlineData?.data) {
                images.push({ slideIndex: slide.slideIndex, base64: part.inlineData.data });
                break;
              }
            }
          }

          // Check if we got an image from the fallback
          if (!images.find(i => i.slideIndex === slide.slideIndex)) {
            errors.push({
              slideIndex: slide.slideIndex,
              error: `Fallback also failed: no image data`,
            });
          }
        } catch (fallbackErr) {
          const msg = fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error';
          errors.push({
            slideIndex: slide.slideIndex,
            error: `Both Imagen and Gemini failed: ${(imgErr instanceof Error ? imgErr.message : '')} / ${msg}`,
          });
        }
      }

      // Small delay between requests to respect rate limits
      await new Promise(r => setTimeout(r, 500));
    }

    return NextResponse.json({
      images,
      errors: errors.length > 0 ? errors : undefined,
      total: slides.length,
      generated: images.length,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Image generation failed. (${errMsg})` },
      { status: 500 }
    );
  }
}
