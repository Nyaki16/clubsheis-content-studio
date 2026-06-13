'use client';

import { useMemo, useState } from 'react';
import type { SelectedClient } from '@/types';

interface Props {
  client: SelectedClient;
  onBack: () => void;
}

/* The Studio app can't run the edit itself — captions, whisper transcription,
   Remotion renders and the ffmpeg audio score all run locally via the
   `video-edit` Claude Code skill. This screen is the front door: it gathers the
   brief and emits the exact prompt to paste into Claude Code, which then drives
   the local pipeline. */

type Mode = 'intro' | 'shorts' | 'longform';

const MODE_OPTIONS: { value: Mode; label: string; sub: string }[] = [
  { value: 'intro', label: 'YT Intro', sub: '16:9 · ≤30s · template-rich' },
  { value: 'shorts', label: 'Shorts / Reel', sub: '9:16 · captions + b-roll' },
  { value: 'longform', label: 'Longform', sub: '16:9 · multi-minute, chaptered' },
];

const MUSIC_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Auto-pick (skill default)' },
  { value: 'bg-feelgood-builder.mp3', label: 'Feel-good Builder (bundled)' },
];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
        {label}
      </label>
      {hint && <p className="font-ui text-xs text-text-muted mb-2 -mt-1">{hint}</p>}
      {children}
    </div>
  );
}

function buildPrompt(opts: {
  mode: Mode;
  videoPath: string;
  emphasis: string[];
  music: string;
  cutFirst: boolean;
  brollPath: string;
}): string {
  const { mode, videoPath, emphasis, music, cutFirst, brollPath } = opts;
  const path = videoPath.trim() || '<path to your video>';
  const modeLabel =
    mode === 'intro' ? 'Intro (16:9, ≤30s)' : mode === 'shorts' ? 'Shorts (9:16, vertical)' : 'Longform (16:9, multi-minute)';

  const lines: string[] = [];

  if (cutFirst) {
    lines.push(
      `First, use the **video-cut** skill on this raw recording to keep the best/last takes and tighten the dead air, then feed the cut result into the edit below.`,
      ''
    );
  }
  if (brollPath.trim()) {
    lines.push(
      `Also use the **broll-ingest** skill on \`${brollPath.trim()}\` to find, grade, and catalog usable b-roll, so the edit can pull real footage from the library.`,
      ''
    );
  }

  lines.push(`Use the **video-edit** skill to edit this video end-to-end.`, '');
  lines.push(`- Video: \`${path}\``);
  lines.push(`- Mode: ${modeLabel}`);
  const cleanEmphasis = emphasis.map((e) => e.trim()).filter(Boolean);
  if (cleanEmphasis.length) {
    lines.push(`- Caption emphasis phrases: ${cleanEmphasis.map((e) => `"${e}"`).join(' | ')}`);
  }
  if (music) {
    lines.push(`- Music track: ${music}`);
  }
  lines.push('');
  lines.push(
    `Render at PREVIEW quality first (\`bash scripts/render.sh\`), show me the result, and wait for my explicit approval before the final render.`
  );

  return lines.join('\n');
}

export default function VideoEditStudio({ client, onBack }: Props) {
  void client; // brief is client-agnostic for now; kept for parity + future brand wiring
  const [mode, setMode] = useState<Mode>('intro');
  const [videoPath, setVideoPath] = useState('');
  const [emphasisText, setEmphasisText] = useState('');
  const [music, setMusic] = useState('');
  const [cutFirst, setCutFirst] = useState(false);
  const [brollPath, setBrollPath] = useState('');
  const [copied, setCopied] = useState(false);

  const prompt = useMemo(
    () =>
      buildPrompt({
        mode,
        videoPath,
        emphasis: emphasisText.split('\n'),
        music,
        cutFirst,
        brollPath,
      }),
    [mode, videoPath, emphasisText, music, cutFirst, brollPath]
  );

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the textarea below is selectable as a fallback.
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-ui text-xs font-semibold tracking-wider text-text-muted uppercase">Video Editing</h2>
        <button onClick={onBack} className="font-ui text-xs text-brown hover:text-brown-light underline underline-offset-2">
          Back
        </button>
      </div>

      {/* How it works */}
      <div className="bg-cream-dark/60 rounded-xl px-4 py-3">
        <p className="font-ui text-sm text-text-secondary">
          Full edits — captions, b-roll, zoom punch-ins, music &amp; SFX — run <span className="font-semibold text-text-primary">locally</span> through
          the <span className="font-semibold text-text-primary">video-edit</span> Claude Code skill (transcription + Remotion + ffmpeg are too heavy
          for the browser). Build your brief below, copy the prompt, and paste it into Claude Code to run the pipeline.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border-light p-6 lg:p-8 space-y-6">
        <Field label="Mode">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {MODE_OPTIONS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === m.value ? 'bg-brown text-white border-brown' : 'bg-white border-border-light hover:border-border'
                }`}
              >
                <span className="font-ui text-sm font-semibold block">{m.label}</span>
                <span className={`font-ui text-xs ${mode === m.value ? 'text-white/60' : 'text-text-muted'}`}>{m.sub}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Video file path" hint="Absolute path to the pre-cut video on your machine (drag the file into a terminal to get its path).">
          <input
            type="text"
            value={videoPath}
            onChange={(e) => setVideoPath(e.target.value)}
            placeholder="/Users/mac/Desktop/my-intro.mp4"
            className="w-full px-4 py-3 rounded-xl border border-border-light font-ui text-sm bg-white text-text-primary"
          />
        </Field>

        <Field label="Caption emphasis (optional)" hint="One phrase per line — the lines that should pop on screen (hook, promise, CTA). Must be spoken in the video.">
          <textarea
            value={emphasisText}
            onChange={(e) => setEmphasisText(e.target.value)}
            placeholder={'this changes everything\nhere’s how it works\nstart today'}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-border-light font-ui text-sm bg-white text-text-primary resize-none"
          />
        </Field>

        <Field label="Music">
          <select
            value={music}
            onChange={(e) => setMusic(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border-light font-ui text-sm bg-white text-text-primary"
          >
            {MUSIC_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>

        {/* Optional pre-steps */}
        <Field label="Pre-steps (optional)">
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={cutFirst}
                onChange={(e) => setCutFirst(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-brown"
              />
              <span className="font-ui text-sm text-text-secondary">
                <span className="font-semibold text-text-primary">Cut raw takes first</span> — run <span className="font-semibold">video-cut</span> to
                drop retakes &amp; dead air before editing (use if this is a raw multi-take recording).
              </span>
            </label>
            <div>
              <input
                type="text"
                value={brollPath}
                onChange={(e) => setBrollPath(e.target.value)}
                placeholder="Optional: path to raw footage to ingest as b-roll (broll-ingest)"
                className="w-full px-4 py-3 rounded-xl border border-border-light font-ui text-sm bg-white text-text-primary"
              />
            </div>
          </div>
        </Field>
      </div>

      {/* Generated prompt */}
      <div className="bg-white rounded-2xl border border-border-light p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-ui text-xs font-semibold tracking-wider text-text-muted uppercase">Prompt for Claude Code</h3>
          <button
            type="button"
            onClick={copyPrompt}
            className="flex items-center gap-1.5 px-4 py-2 bg-brown text-white font-ui text-sm font-semibold rounded-full hover:bg-brown-light transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy prompt
              </>
            )}
          </button>
        </div>
        <textarea
          readOnly
          value={prompt}
          rows={mode === 'longform' ? 11 : 10}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full px-4 py-3 rounded-xl border border-border-light font-mono text-xs bg-cream/40 text-text-primary resize-none leading-relaxed"
        />
        <p className="font-ui text-xs text-text-muted">
          Paste this into Claude Code in a terminal. It renders a <span className="font-semibold">preview</span> first and waits for your
          approval before the final render.
        </p>
      </div>

      {/* One-time local setup */}
      <details className="bg-white rounded-2xl border border-border-light p-6">
        <summary className="font-ui text-sm font-semibold text-text-primary cursor-pointer">First time? Local setup (one-time)</summary>
        <div className="mt-4 space-y-2 font-ui text-sm text-text-secondary">
          <p>The skill needs ffmpeg, the Remotion deps, and a Python venv with WhisperX. Run once:</p>
          <pre className="bg-cream/40 border border-border-light rounded-lg p-3 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
{`# from anywhere
brew install ffmpeg            # if not already installed
bash ~/.claude/skills/video-edit/scripts/setup.sh`}
          </pre>
          <p className="text-text-muted">
            Then just talk to Claude Code: <span className="italic">“edit this intro: /path/to/video.mp4”</span> — or paste the prompt above.
          </p>
        </div>
      </details>
    </div>
  );
}
