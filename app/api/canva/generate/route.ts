import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { designType, clientName, brandColour, brandKitId, slideCount, firstSlideHeadline } = body;

    const query = [
      `${clientName} brand ${designType}.`,
      slideCount ? `${slideCount} slides.` : '',
      firstSlideHeadline ? `Headline: ${firstSlideHeadline}.` : '',
      `Brand colour: ${brandColour}.`,
      `Style: clean, editorial, bold typography. Black and white with ${brandColour} accent.`,
      `No stock photo clichés. Typography-led design.`,
    ]
      .filter(Boolean)
      .join(' ');

    // Call Canva MCP generate-design
    // This would use the Canva MCP client in production
    // For now, return a placeholder that the frontend handles gracefully
    const canvaMcpUrl = process.env.CANVA_MCP_URL;

    if (!canvaMcpUrl) {
      return NextResponse.json(
        { error: 'Canva MCP not configured' },
        { status: 503 }
      );
    }

    // In production, this calls the Canva MCP server
    // The actual implementation depends on the MCP client setup
    // Placeholder response structure:
    return NextResponse.json({
      jobId: `job_${Date.now()}`,
      candidateId: `candidate_${Date.now()}`,
      thumbnailUrl: null,
      query,
      brandKitId,
    });
  } catch (error) {
    console.error('Canva generate error:', error);
    return NextResponse.json(
      { error: 'Canva generation failed' },
      { status: 500 }
    );
  }
}
