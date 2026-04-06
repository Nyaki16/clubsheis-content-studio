import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, candidateId } = body;

    if (!jobId || !candidateId) {
      return NextResponse.json(
        { error: 'Missing jobId or candidateId' },
        { status: 400 }
      );
    }

    // In production, calls Canva MCP create-design-from-candidate
    // Placeholder:
    return NextResponse.json({
      designId: `design_${Date.now()}`,
      designUrl: `https://www.canva.com/design/${jobId}/edit`,
    });
  } catch (error) {
    console.error('Canva materialise error:', error);
    return NextResponse.json(
      { error: 'Failed to materialise design' },
      { status: 500 }
    );
  }
}
