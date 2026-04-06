import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { designId, format } = body;

    if (!designId) {
      return NextResponse.json(
        { error: 'Missing designId' },
        { status: 400 }
      );
    }

    // In production, calls Canva MCP export-design
    // Placeholder:
    return NextResponse.json({
      downloadUrl: `https://export.canva.com/${designId}.${(format || 'png').toLowerCase()}`,
    });
  } catch (error) {
    console.error('Canva export error:', error);
    return NextResponse.json(
      { error: 'Failed to export design' },
      { status: 500 }
    );
  }
}
