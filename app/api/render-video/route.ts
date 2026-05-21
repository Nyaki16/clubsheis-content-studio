import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
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

// Async job pattern: render in the background and let the client poll.
// Render.com's gateway hangs up after 30s waiting for response headers,
// which is shorter than any real render — so a synchronous response
// model can't work there. POST kicks off the job and returns a jobId;
// GET ?jobId=X reports status; GET ?jobId=X&download=1 streams the MP4.

type JobStatus = 'rendering' | 'ready' | 'error';
interface RenderJob {
  status: JobStatus;
  filePath?: string;
  error?: string;
  startedAt: number;
  finishedAt?: number;
}

// Module-level Map persists across requests within the same Node process.
// Lost on container restart, which is fine for occasional renders.
const jobs: Map<string, RenderJob> = (globalThis as unknown as {
  __renderJobs?: Map<string, RenderJob>;
}).__renderJobs ?? new Map();
(globalThis as unknown as { __renderJobs?: Map<string, RenderJob> }).__renderJobs = jobs;

const ONE_HOUR = 60 * 60 * 1000;
function pruneOldJobs() {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (now - job.startedAt > ONE_HOUR) {
      if (job.filePath) unlink(job.filePath).catch(() => {});
      jobs.delete(id);
    }
  }
}

async function runRender(jobId: string, inputProps: Record<string, unknown>) {
  const tmpDir = path.join(os.tmpdir(), 'content-studio-renders');
  await mkdir(tmpDir, { recursive: true });
  const outPath = path.join(tmpDir, `${jobId}.mp4`);

  try {
    const [{ selectComposition, renderMedia }, serveUrl] = await Promise.all([
      import('@remotion/renderer'),
      getBundle(),
    ]);

    const composition = await selectComposition({
      serveUrl,
      id: 'video-animation',
      inputProps,
    });

    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: outPath,
      inputProps,
    });

    jobs.set(jobId, {
      ...(jobs.get(jobId) as RenderJob),
      status: 'ready',
      filePath: outPath,
      finishedAt: Date.now(),
    });
  } catch (err) {
    console.error(`[render-video] job ${jobId} failed:`, err);
    unlink(outPath).catch(() => {});
    jobs.set(jobId, {
      ...(jobs.get(jobId) as RenderJob),
      status: 'error',
      error: err instanceof Error ? err.message : 'Render failed.',
      finishedAt: Date.now(),
    });
  }
}

export async function POST(req: NextRequest) {
  // Remotion rendering needs headless Chrome + ffmpeg. Vercel serverless
  // functions can't run that — guide the user to use Render.com (deployed)
  // or localhost.
  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        error:
          'This Vercel deployment can\'t render video. Use the Render.com URL or run `npm run dev` locally.',
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

  pruneOldJobs();

  const jobId = randomUUID();
  jobs.set(jobId, { status: 'rendering', startedAt: Date.now() });

  // Fire and forget — runRender updates the job entry when it finishes.
  runRender(jobId, inputProps as Record<string, unknown>);

  return NextResponse.json({ jobId });
}

export async function GET(req: NextRequest) {
  if (process.env.VERCEL) {
    return NextResponse.json({ error: 'Renderer not available on Vercel.' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');
  const download = searchParams.get('download') === '1';

  if (!jobId) {
    return NextResponse.json({ error: 'jobId required.' }, { status: 400 });
  }

  const job = jobs.get(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Unknown jobId — the render may have expired or the server restarted.' }, { status: 404 });
  }

  if (download) {
    if (job.status !== 'ready' || !job.filePath) {
      return NextResponse.json({ error: `Job is ${job.status}, not ready for download.` }, { status: 409 });
    }
    try {
      const file = await readFile(job.filePath);
      // Clean up after a successful read — single-use download links.
      unlink(job.filePath).catch(() => {});
      jobs.delete(jobId);
      return new Response(file as unknown as BodyInit, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': 'attachment; filename="video-animation.mp4"',
          'Content-Length': String(file.length),
        },
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Failed to read rendered file.' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    status: job.status,
    error: job.error,
    elapsedMs: Date.now() - job.startedAt,
  });
}
