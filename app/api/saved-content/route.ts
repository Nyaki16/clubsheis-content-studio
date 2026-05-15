import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const SECTION = 'saved_content';

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json([]);

  const { searchParams } = new URL(request.url);
  const clientName = searchParams.get('client');
  const contentType = searchParams.get('contentType');

  const { data, error } = await supabase
    .from('dashboard_data')
    .select('id, data, created_at')
    .eq('section', SECTION)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('Saved content read error:', error);
    return NextResponse.json([]);
  }

  let items = (data || []).map((row) => ({
    id: row.id,
    title: row.data?.title || 'Untitled',
    contentType: row.data?.contentType || 'unknown',
    clientName: row.data?.clientName || '',
    brandColour: row.data?.brandColour || '',
    content: row.data?.content || '',
    rawJson: row.data?.rawJson || undefined,
    slideImages: row.data?.slideImages || undefined,
    productImages: row.data?.productImages || undefined,
    createdAt: row.data?.createdAt || row.created_at,
  }));

  if (clientName) items = items.filter((i) => i.clientName === clientName);
  if (contentType) items = items.filter((i) => i.contentType === contentType);

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { title, contentType, clientName, brandColour, content, rawJson, slideImages, productImages } = body;

    if (!content || !contentType) {
      return NextResponse.json({ error: 'Content and content type required' }, { status: 400 });
    }

    const data = {
      title: (title || '').trim() || `${contentType} for ${clientName || 'unknown'}`,
      contentType,
      clientName: clientName || '',
      brandColour: brandColour || '',
      content,
      rawJson: rawJson || undefined,
      slideImages: slideImages || undefined,
      productImages: productImages || undefined,
      createdAt: new Date().toISOString(),
    };

    const { data: row, error } = await supabase
      .from('dashboard_data')
      .insert({ client_id: null, period_id: null, section: SECTION, data })
      .select('id, data, created_at')
      .single();

    if (error) {
      console.error('Saved content insert error:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({
      id: row.id,
      ...row.data,
      createdAt: row.data?.createdAt || row.created_at,
    }, { status: 201 });
  } catch (err) {
    console.error('Save error:', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
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
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const { error } = await supabase
      .from('dashboard_data')
      .delete()
      .eq('id', id)
      .eq('section', SECTION);

    if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { id, title, content } = body as { id?: string; title?: string; content?: string };
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const { data: existing, error: readErr } = await supabase
      .from('dashboard_data')
      .select('data')
      .eq('id', id)
      .eq('section', SECTION)
      .single();
    if (readErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = {
      ...existing.data,
      ...(title !== undefined ? { title } : {}),
      ...(content !== undefined ? { content } : {}),
      updatedAt: new Date().toISOString(),
    };

    const { error: updateErr } = await supabase
      .from('dashboard_data')
      .update({ data: updated })
      .eq('id', id)
      .eq('section', SECTION);
    if (updateErr) return NextResponse.json({ error: 'Failed to update' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
