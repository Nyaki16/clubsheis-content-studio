import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// Store brand voices in the existing dashboard_data table
// section = 'brand_voice', period_id = null, client_id = null
// data JSONB = { name, group, description, sampleContent, voiceProfile, createdAt }

const SECTION = 'brand_voice';

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json([]);

  const { data, error } = await supabase
    .from('dashboard_data')
    .select('id, data')
    .eq('section', SECTION)
    .is('period_id', null);

  if (error) {
    console.error('Supabase read error:', error);
    return NextResponse.json([]);
  }

  const voices = (data || []).map((row) => ({
    id: row.id,
    name: row.data?.name || '',
    group: row.data?.group || 'Custom',
    description: row.data?.description || '',
    sampleContent: row.data?.voiceProfile || row.data?.sampleContent || '',
  }));

  return NextResponse.json(voices);
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { name, group, description, sampleContent } = body;

    if (!name || !sampleContent) {
      return NextResponse.json({ error: 'Name and sample content are required' }, { status: 400 });
    }

    const voiceData = {
      name,
      group: group || 'Custom',
      description: description || '',
      sampleContent,
      voiceProfile: sampleContent,
      createdAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('dashboard_data')
      .insert({
        client_id: null,
        period_id: null,
        section: SECTION,
        data: voiceData,
      })
      .select('id, data')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save brand voice' }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      name: data.data?.name,
      group: data.data?.group,
      description: data.data?.description,
      sampleContent: data.data?.voiceProfile,
    }, { status: 201 });
  } catch (err) {
    console.error('Save error:', err);
    return NextResponse.json({ error: 'Failed to save brand voice' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('dashboard_data')
      .delete()
      .eq('id', id)
      .eq('section', SECTION);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete brand voice' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete brand voice' }, { status: 500 });
  }
}
