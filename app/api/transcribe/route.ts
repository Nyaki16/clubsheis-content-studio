import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 300;

const TRANSCRIBE_PROMPT = `You are transcribing audio for a content creator who repurposes their spoken material into written content.

Rules:
- Transcribe verbatim. Keep the speaker's exact words, fillers, repeats, and quirks ("right?", "you know what I mean", "listen…"). They are part of the voice and matter for downstream content generation.
- Use UK / South African English spelling.
- Do not summarise, paraphrase, or "clean up" the speech. Do not add quote marks unless the speaker explicitly says them.
- If there are clear speaker changes, label them as "Speaker 1:", "Speaker 2:" etc. on new lines. Otherwise just produce one continuous transcript.
- Punctuate naturally so the transcript reads like a clean transcription, but do not invent sentences that the speaker did not say.
- Output ONLY the transcript text. No preamble, no headings, no commentary.`;

function decodeGoogleDocId(url: string): string | null {
  // Match Google Docs / Drive URLs and extract the document ID
  const patterns = [
    /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function stripHtml(html: string): string {
  // Remove script/style entirely
  let s = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, '');
  // Convert block elements to newlines
  s = s.replace(/<\/(p|div|h[1-6]|li|br|tr)>/gi, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  // Strip remaining tags
  s = s.replace(/<[^>]+>/g, '');
  // Decode common entities
  s = s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Collapse whitespace
  s = s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return s;
}

async function fetchDocText(url: string): Promise<string> {
  const docId = decodeGoogleDocId(url);
  if (docId) {
    // Try Google Docs export as plain text (only works if "anyone with the link" can view)
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
    const r = await fetch(exportUrl, { redirect: 'follow' });
    if (r.ok) {
      const text = await r.text();
      if (text.trim().length > 0 && !text.includes('<HTML>')) return text.trim();
    }
    throw new Error(
      'Could not read this Google Doc. Make sure sharing is set to "Anyone with the link can view", then paste the link again.'
    );
  }
  // Generic URL — fetch and strip HTML
  const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 ClubSheIsContentStudio' } });
  if (!r.ok) throw new Error(`Could not fetch the link (HTTP ${r.status}).`);
  const ct = r.headers.get('content-type') || '';
  const body = await r.text();
  if (ct.includes('text/html') || /<html/i.test(body)) {
    return stripHtml(body);
  }
  return body.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode } = body as { mode?: 'audio' | 'doc' };

    if (mode === 'doc') {
      const { url } = body as { url?: string };
      if (!url || !url.trim()) {
        return NextResponse.json({ error: 'Please paste a link.' }, { status: 400 });
      }
      let trimmed = url.trim();
      if (!/^https?:\/\//i.test(trimmed)) trimmed = `https://${trimmed}`;
      const text = await fetchDocText(trimmed);
      if (!text || text.length < 20) {
        return NextResponse.json(
          { error: 'No readable text was found at that link.' },
          { status: 400 }
        );
      }
      return NextResponse.json({ text });
    }

    if (mode === 'audio') {
      const { base64, mimeType } = body as { base64?: string; mimeType?: string };
      if (!base64 || !mimeType) {
        return NextResponse.json({ error: 'Missing audio data.' }, { status: 400 });
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: 'Gemini API key not configured.' },
          { status: 500 }
        );
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { inlineData: { mimeType, data: base64 } },
          { text: TRANSCRIBE_PROMPT },
        ],
      });
      const text = response.text || '';
      if (!text.trim()) {
        return NextResponse.json(
          { error: 'Could not transcribe the audio. The file may be empty or unsupported.' },
          { status: 500 }
        );
      }
      return NextResponse.json({ text });
    }

    return NextResponse.json({ error: 'Invalid mode. Use "audio" or "doc".' }, { status: 400 });
  } catch (error) {
    console.error('Transcribe error:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
