import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import os from 'os';
import { readFile, mkdir, unlink } from 'fs/promises';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Bundle the Remotion entry once per process. Webpack build is slow (~30s
// first time); subsequent renders reuse the same bundle.
let cachedBundle: Promise<string> | null = null;

async function getBundle(): Promise<string> {
  if (!cachedBundle) {
    cachedBundle = (async () => {
      const { bundle } = await import('@remotion/bundler');
      return bundle({
        entryPoint: path.join(process.cwd(), 'remotion', 'index.ts'),
        webpackOverride: (config) => ({
          ...config,
          resolve: {
            ...config.resolve,
            alias: {
              ...(config.resolve?.alias || {}),
              '@': path.join(process.cwd()),
            },
          },
        }),
      });
    })().catch((err) => {
      cachedBundle = null;
      throw err;
    });
  }
  return cachedBundle;
}

export async function POST(req: NextRequest) {
  // Remotion rendering needs headless Chrome + ffmpeg. Vercel serverless
  // functions can't run that — guide the user to render locally.
  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        error:
          'Video rendering only runs on a local dev server. Clone the repo, run `npm install && npm run dev`, then click Download MP4 there.',
      },
      { status: 503 }
    );
  }

  let inputProps: unknown;
  try {
    inputProps = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!inputProps || typeof inputProps !== 'object') {
    return NextResponse.json({ error: 'Missing render inputs.' }, { status: 400 });
  }

  const tmpDir = path.join(os.tmpdir(), 'content-studio-renders');
  await mkdir(tmpDir, { recursive: true });
  const outPath = path.join(tmpDir, `video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp4`);

  try {
    const [{ selectComposition, renderMedia }, serveUrl] = await Promise.all([
      import('@remotion/renderer'),
      getBundle(),
    ]);

    const composition = await selectComposition({
      serveUrl,
      id: 'video-animation',
      inputProps: inputProps as Record<string, unknown>,
    });

    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: outPath,
      inputProps: inputProps as Record<string, unknown>,
    });

    const file = await readFile(outPath);
    // Clean up the temp file; we already have the bytes in memory.
    unlink(outPath).catch(() => {});

    return new Response(file as unknown as BodyInit, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="video-animation.mp4"',
        'Content-Length': String(file.length),
      },
    });
  } catch (err) {
    console.error('Render error:', err);
    unlink(outPath).catch(() => {});
    const message = err instanceof Error ? err.message : 'Render failed.';
    return NextResponse.json({ error: `Render failed: ${message}` }, { status: 500 });
  }
}
