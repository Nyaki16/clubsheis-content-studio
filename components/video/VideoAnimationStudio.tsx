'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type {
  SelectedClient,
  VideoAspectRatio,
  VideoColors,
  VideoScene,
  VideoSceneTemplate,
  VideoScript,
} from '@/types';
import { DEFAULT_COLORS, RATIO_DIMS } from './animation';

const VideoPreview = dynamic(() => import('./VideoPreview'), { ssr: false });

type Phase = 'config' | 'generating' | 'script' | 'video';

interface Props {
  client: SelectedClient;
  onBack: () => void;
}

const ASPECT_OPTIONS: { value: VideoAspectRatio; label: string; sub: string }[] = [
  { value: '9:16', label: 'Reel / Story', sub: '1080 × 1920' },
  { value: '1:1', label: 'Square', sub: '1080 × 1080' },
  { value: '4:5', label: 'Portrait', sub: '1080 × 1350' },
  { value: '16:9', label: 'Landscape', sub: '1920 × 1080' },
];

const DURATION_OPTIONS = [15, 20, 30, 45, 60];

const TEMPLATE_OPTIONS: { value: VideoSceneTemplate; label: string }[] = [
  { value: 'title', label: 'Title / Hook' },
  { value: 'flowchart', label: 'Flowchart (steps)' },
  { value: 'stat', label: 'Stat (count-up)' },
  { value: 'iconGrid', label: 'Icon grid' },
  { value: 'diagram', label: 'Diagram (radial)' },
  { value: 'particles', label: 'Particles finale' },
];

const COLOR_PRESETS: { name: string; colors: VideoColors }[] = [
  { name: 'Studio', colors: DEFAULT_COLORS },
  { name: 'Midnight', colors: { background: '#14151a', primaryText: '#f5f3ee', accent: '#e0a458', emphasis: '#3a4a5a' } },
  { name: 'Mint', colors: { background: '#f4f8f5', primaryText: '#1c2b22', accent: '#2f8f5b', emphasis: '#bcd9c6' } },
  { name: 'Cream', colors: { background: '#faf7f2', primaryText: '#2d2d2d', accent: '#7b4b2a', emphasis: '#e5ddd3' } },
];

function parseScript(raw: string): VideoScript {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) text = text.slice(start, end + 1);
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
    throw new Error('The script came back in an unexpected shape. Tap Regenerate to try again.');
  }
  return {
    title: typeof parsed.title === 'string' ? parsed.title : 'Untitled video',
    scenes: parsed.scenes.slice(0, 5).map(normaliseScene),
  };
}

function normaliseScene(s: Record<string, unknown>): VideoScene {
  const template = (s.template as VideoSceneTemplate) || 'title';
  return {
    template: TEMPLATE_OPTIONS.some((t) => t.value === template) ? template : 'title',
    eyebrow: typeof s.eyebrow === 'string' ? s.eyebrow : undefined,
    headline: typeof s.headline === 'string' ? s.headline : '',
    body: typeof s.body === 'string' ? s.body : '',
    cta: typeof s.cta === 'string' ? s.cta : undefined,
    steps: Array.isArray(s.steps) ? (s.steps as string[]).map(String) : undefined,
    items: Array.isArray(s.items)
      ? (s.items as Record<string, unknown>[]).map((it) => ({
          icon: typeof it.icon === 'string' ? it.icon : '•',
          label: typeof it.label === 'string' ? it.label : '',
        }))
      : undefined,
    stat:
      s.stat && typeof s.stat === 'object'
        ? {
            value: Number((s.stat as Record<string, unknown>).value) || 0,
            prefix: (s.stat as Record<string, unknown>).prefix as string | undefined,
            suffix: (s.stat as Record<string, unknown>).suffix as string | undefined,
            label: String((s.stat as Record<string, unknown>).label || ''),
          }
        : undefined,
    diagram:
      s.diagram && typeof s.diagram === 'object'
        ? {
            centerLabel: String((s.diagram as Record<string, unknown>).centerLabel || ''),
            nodes: Array.isArray((s.diagram as Record<string, unknown>).nodes)
              ? ((s.diagram as Record<string, unknown>).nodes as string[]).map(String)
              : [],
          }
        : undefined,
  };
}

/* ---------- small UI atoms ---------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-11 h-11 rounded-lg border border-border-light cursor-pointer bg-transparent p-0.5"
      />
      <div className="flex-1">
        <p className="font-ui text-xs font-medium text-text-secondary">{label}</p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-ui text-sm text-text-primary bg-transparent outline-none w-full"
        />
      </div>
    </div>
  );
}

function StringList({
  values,
  onChange,
  placeholder,
  max = 5,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  max?: number;
}) {
  return (
    <div className="space-y-2">
      {values.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="font-ui text-xs text-text-muted w-5">{i + 1}.</span>
          <input
            type="text"
            value={v}
            placeholder={placeholder}
            onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))}
            className="flex-1 px-3 py-2 rounded-lg border border-border-light font-ui text-sm bg-white text-text-primary"
          />
          <button
            type="button"
            onClick={() => onChange(values.filter((_, j) => j !== i))}
            className="text-text-muted hover:text-red font-ui text-lg leading-none px-1"
          >
            ×
          </button>
        </div>
      ))}
      {values.length < max && (
        <button
          type="button"
          onClick={() => onChange([...values, ''])}
          className="font-ui text-xs text-brown hover:text-brown-light font-semibold"
        >
          + Add item
        </button>
      )}
    </div>
  );
}

/* ---------- scene editor ---------- */

function SceneEditor({
  scene,
  index,
  onChange,
}: {
  scene: VideoScene;
  index: number;
  onChange: (s: VideoScene) => void;
}) {
  const patch = (p: Partial<VideoScene>) => onChange({ ...scene, ...p });

  return (
    <div className="bg-white rounded-2xl border border-border-light p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-ui text-xs font-bold text-brown bg-brown/10 rounded-full px-3 py-1">
          Scene {index + 1}
        </span>
        <select
          value={scene.template}
          onChange={(e) => patch({ template: e.target.value as VideoSceneTemplate })}
          className="font-ui text-xs border border-border-light rounded-lg px-2 py-1.5 bg-white text-text-secondary"
        >
          {TEMPLATE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          value={scene.eyebrow || ''}
          placeholder="Eyebrow (optional)"
          onChange={(e) => patch({ eyebrow: e.target.value })}
          className="px-3 py-2 rounded-lg border border-border-light font-ui text-sm bg-white text-text-primary"
        />
        <input
          type="text"
          value={scene.headline}
          placeholder="Headline"
          onChange={(e) => patch({ headline: e.target.value })}
          className="px-3 py-2 rounded-lg border border-border-light font-ui text-sm font-semibold bg-white text-text-primary"
        />
      </div>

      <textarea
        value={scene.body}
        placeholder="Body — 1-2 short sentences"
        onChange={(e) => patch({ body: e.target.value })}
        rows={2}
        className="w-full px-3 py-2 rounded-lg border border-border-light font-ui text-sm bg-white text-text-primary resize-none"
      />

      {scene.template === 'flowchart' && (
        <Field label="Steps">
          <StringList
            values={scene.steps && scene.steps.length ? scene.steps : ['']}
            onChange={(steps) => patch({ steps })}
            placeholder="Step description"
          />
        </Field>
      )}

      {scene.template === 'diagram' && (
        <div className="space-y-3">
          <Field label="Centre label">
            <input
              type="text"
              value={scene.diagram?.centerLabel || ''}
              onChange={(e) =>
                patch({ diagram: { centerLabel: e.target.value, nodes: scene.diagram?.nodes || [] } })
              }
              className="w-full px-3 py-2 rounded-lg border border-border-light font-ui text-sm bg-white text-text-primary"
            />
          </Field>
          <Field label="Nodes">
            <StringList
              values={scene.diagram?.nodes && scene.diagram.nodes.length ? scene.diagram.nodes : ['']}
              onChange={(nodes) =>
                patch({ diagram: { centerLabel: scene.diagram?.centerLabel || '', nodes } })
              }
              placeholder="Node label"
            />
          </Field>
        </div>
      )}

      {scene.template === 'iconGrid' && (
        <Field label="Items (emoji + label)">
          <div className="space-y-2">
            {(scene.items && scene.items.length ? scene.items : [{ icon: '', label: '' }]).map((it, i, arr) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={it.icon}
                  placeholder="🔹"
                  onChange={(e) =>
                    patch({ items: arr.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)) })
                  }
                  className="w-14 px-2 py-2 rounded-lg border border-border-light font-ui text-sm text-center bg-white"
                />
                <input
                  type="text"
                  value={it.label}
                  placeholder="Short label"
                  onChange={(e) =>
                    patch({ items: arr.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })
                  }
                  className="flex-1 px-3 py-2 rounded-lg border border-border-light font-ui text-sm bg-white text-text-primary"
                />
                <button
                  type="button"
                  onClick={() => patch({ items: arr.filter((_, j) => j !== i) })}
                  className="text-text-muted hover:text-red font-ui text-lg leading-none px-1"
                >
                  ×
                </button>
              </div>
            ))}
            {(scene.items?.length || 0) < 4 && (
              <button
                type="button"
                onClick={() => patch({ items: [...(scene.items || []), { icon: '', label: '' }] })}
                className="font-ui text-xs text-brown hover:text-brown-light font-semibold"
              >
                + Add item
              </button>
            )}
          </div>
        </Field>
      )}

      {scene.template === 'stat' && (
        <Field label="Statistic">
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={scene.stat?.prefix || ''}
              placeholder="Prefix"
              onChange={(e) =>
                patch({ stat: { value: scene.stat?.value || 0, label: scene.stat?.label || '', prefix: e.target.value, suffix: scene.stat?.suffix } })
              }
              className="w-20 px-3 py-2 rounded-lg border border-border-light font-ui text-sm bg-white text-text-primary"
            />
            <input
              type="number"
              value={scene.stat?.value ?? 0}
              onChange={(e) =>
                patch({ stat: { value: Number(e.target.value), label: scene.stat?.label || '', prefix: scene.stat?.prefix, suffix: scene.stat?.suffix } })
              }
              className="w-28 px-3 py-2 rounded-lg border border-border-light font-ui text-sm bg-white text-text-primary"
            />
            <input
              type="text"
              value={scene.stat?.suffix || ''}
              placeholder="Suffix"
              onChange={(e) =>
                patch({ stat: { value: scene.stat?.value || 0, label: scene.stat?.label || '', prefix: scene.stat?.prefix, suffix: e.target.value } })
              }
              className="w-20 px-3 py-2 rounded-lg border border-border-light font-ui text-sm bg-white text-text-primary"
            />
            <input
              type="text"
              value={scene.stat?.label || ''}
              placeholder="What the number means"
              onChange={(e) =>
                patch({ stat: { value: scene.stat?.value || 0, label: e.target.value, prefix: scene.stat?.prefix, suffix: scene.stat?.suffix } })
              }
              className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-border-light font-ui text-sm bg-white text-text-primary"
            />
          </div>
        </Field>
      )}

      {scene.template === 'particles' && (
        <Field label="Call to action">
          <input
            type="text"
            value={scene.cta || ''}
            placeholder="e.g. Start investing today"
            onChange={(e) => patch({ cta: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border-light font-ui text-sm bg-white text-text-primary"
          />
        </Field>
      )}
    </div>
  );
}

/* ---------- main studio ---------- */

export default function VideoAnimationStudio({ client, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('config');
  const [topic, setTopic] = useState('');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('9:16');
  const [durationSeconds, setDurationSeconds] = useState(30);
  const [colors, setColors] = useState<VideoColors>(() => ({
    ...DEFAULT_COLORS,
    accent: client.brandColour || DEFAULT_COLORS.accent,
  }));
  const [script, setScript] = useState<VideoScript | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const dims = RATIO_DIMS[aspectRatio];
  const previewStyle = useMemo(() => {
    const maxW = 460;
    const maxH = 600;
    const scale = Math.min(maxW / dims.width, maxH / dims.height);
    return { width: Math.round(dims.width * scale), height: Math.round(dims.height * scale) };
  }, [dims.width, dims.height]);

  const generateScript = async () => {
    if (!topic.trim()) {
      setError('Add a topic for the video first.');
      return;
    }
    setPhase('generating');
    setError(null);
    try {
      const res = await fetch('/api/generate/video-animation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client,
          topic: topic.trim(),
          typeConfig: { aspectRatio, durationSeconds },
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Script generation failed.');
      }
      const data = await res.json();
      setScript(parseScript(data.content || ''));
      setPhase('script');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong generating the script.');
      setPhase('config');
    }
  };

  const updateScene = (index: number, next: VideoScene) => {
    if (!script) return;
    setScript({ ...script, scenes: script.scenes.map((s, i) => (i === index ? next : s)) });
  };

  const downloadVideo = async () => {
    if (!script) return;
    setRendering(true);
    setRenderError(null);
    try {
      const res = await fetch('/api/render-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, colors, aspectRatio, durationSeconds }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Render failed (${res.status}).`);
      }
      const blob = await res.blob();
      const slug = script.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'video';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'Render failed.');
    } finally {
      setRendering(false);
    }
  };

  /* ----- config phase ----- */
  if (phase === 'config' || phase === 'generating') {
    const busy = phase === 'generating';
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-ui text-xs font-semibold tracking-wider text-text-muted uppercase">
            Video Animation
          </h2>
          <button onClick={onBack} className="font-ui text-xs text-brown hover:text-brown-light underline underline-offset-2">
            Back
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-border-light p-6 lg:p-8 space-y-6">
          <Field label="Topic">
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What should the video explain? e.g. How tax-free investments work in South Africa"
              rows={3}
              disabled={busy}
              className="w-full px-4 py-3 rounded-xl border border-border-light font-ui text-sm bg-white text-text-primary resize-none"
            />
          </Field>

          <Field label="Aspect ratio">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ASPECT_OPTIONS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  disabled={busy}
                  onClick={() => setAspectRatio(a.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    aspectRatio === a.value
                      ? 'bg-brown text-white border-brown'
                      : 'bg-white border-border-light hover:border-border'
                  }`}
                >
                  <span className="font-ui text-sm font-semibold block">{a.label}</span>
                  <span className={`font-ui text-xs ${aspectRatio === a.value ? 'text-white/60' : 'text-text-muted'}`}>
                    {a.sub}
                  </span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Duration">
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  disabled={busy}
                  onClick={() => setDurationSeconds(d)}
                  className={`px-4 py-2 rounded-full border font-ui text-sm font-medium transition-all ${
                    durationSeconds === d
                      ? 'bg-brown text-white border-brown'
                      : 'bg-white border-border-light hover:border-border text-text-secondary'
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </Field>

          <Field label="Colours">
            <div className="flex flex-wrap gap-2 mb-4">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  disabled={busy}
                  onClick={() => setColors(p.colors)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-light hover:border-brown font-ui text-xs text-text-secondary"
                >
                  <span className="flex -space-x-1">
                    {[p.colors.background, p.colors.primaryText, p.colors.accent, p.colors.emphasis].map((c, i) => (
                      <span key={i} className="w-3.5 h-3.5 rounded-full border border-white" style={{ background: c }} />
                    ))}
                  </span>
                  {p.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ColorRow label="Background" value={colors.background} onChange={(v) => setColors({ ...colors, background: v })} />
              <ColorRow label="Primary text" value={colors.primaryText} onChange={(v) => setColors({ ...colors, primaryText: v })} />
              <ColorRow label="Accent" value={colors.accent} onChange={(v) => setColors({ ...colors, accent: v })} />
              <ColorRow label="Emphasis" value={colors.emphasis} onChange={(v) => setColors({ ...colors, emphasis: v })} />
            </div>
          </Field>

          {error && <p className="font-ui text-sm text-red">{error}</p>}

          <button
            type="button"
            onClick={generateScript}
            disabled={busy}
            className="w-full py-3.5 bg-brown text-white font-ui font-semibold rounded-full hover:bg-brown-light transition-colors disabled:opacity-60"
          >
            {busy ? 'Researching & writing the script…' : 'Generate script'}
          </button>
        </div>
      </div>
    );
  }

  /* ----- script review phase ----- */
  if (phase === 'script' && script) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-ui text-xs font-semibold tracking-wider text-text-muted uppercase">
            Review &amp; edit script
          </h2>
          <button
            onClick={() => setPhase('config')}
            className="font-ui text-xs text-brown hover:text-brown-light underline underline-offset-2"
          >
            Back to settings
          </button>
        </div>

        <div className="bg-cream-dark/60 rounded-xl px-4 py-3">
          <p className="font-ui text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">{script.title}</span> — {script.scenes.length} scenes,{' '}
            {aspectRatio}, {durationSeconds}s. Edit anything below, then build the video.
          </p>
        </div>

        <div className="space-y-3">
          {script.scenes.map((scene, i) => (
            <SceneEditor key={i} scene={scene} index={i} onChange={(s) => updateScene(i, s)} />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={generateScript}
            className="flex-1 py-3 bg-white border border-border-light text-text-secondary font-ui font-semibold rounded-full hover:border-brown hover:text-brown transition-colors"
          >
            Regenerate script
          </button>
          <button
            type="button"
            onClick={() => setPhase('video')}
            className="flex-1 py-3 bg-brown text-white font-ui font-semibold rounded-full hover:bg-brown-light transition-colors"
          >
            Approve &amp; build video
          </button>
        </div>
      </div>
    );
  }

  /* ----- video phase ----- */
  if (phase === 'video' && script) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-ui text-xs font-semibold tracking-wider text-text-muted uppercase">
            {script.title}
          </h2>
          <button
            onClick={() => setPhase('script')}
            className="font-ui text-xs text-brown hover:text-brown-light underline underline-offset-2"
          >
            Edit script
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-border-light p-6 flex flex-col items-center">
          <div className="rounded-xl overflow-hidden bg-black/5" style={previewStyle}>
            <VideoPreview
              script={script}
              colors={colors}
              aspectRatio={aspectRatio}
              durationSeconds={durationSeconds}
            />
          </div>
          <p className="font-ui text-xs text-text-muted mt-4 text-center max-w-md">
            Rendered live with Remotion. Use the player controls to scrub, then download the MP4 to take it into your editor.
          </p>
        </div>

        {renderError && (
          <div className="bg-white border border-red/30 rounded-xl px-4 py-3">
            <p className="font-ui text-sm text-red">{renderError}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={downloadVideo}
            disabled={rendering}
            className="flex-1 py-3 bg-brown text-white font-ui font-semibold rounded-full hover:bg-brown-light transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {rendering ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Rendering MP4… (first run ~60s)
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                </svg>
                Download MP4
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setPhase('script')}
            disabled={rendering}
            className="flex-1 py-3 bg-white border border-border-light text-text-secondary font-ui font-semibold rounded-full hover:border-brown hover:text-brown transition-colors disabled:opacity-60"
          >
            Edit script
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={rendering}
            className="flex-1 py-3 bg-white border border-border-light text-text-secondary font-ui font-semibold rounded-full hover:border-brown hover:text-brown transition-colors disabled:opacity-60"
          >
            Start new
          </button>
        </div>
      </div>
    );
  }

  return null;
}
