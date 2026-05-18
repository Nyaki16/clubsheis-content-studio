'use client';

import { useMemo, useState } from 'react';
import {
  GeneratedOutput,
  SelectedClient,
  InspirationFile,
  CarouselImage,
  CarouselConfig,
  NewsletterConfig,
} from '@/types';
import { copyToClipboard } from '@/lib/download';
import CarouselRenderer, { CarouselSlide } from './CarouselRenderer';
import NewsletterRenderer, { NewsletterData } from './NewsletterRenderer';

type PieceFormat =
  | 'carousel'
  | 'reel'
  | 'caption'
  | 'newsletter'
  | 'email'
  | 'summary'
  | 'unknown';

interface Piece {
  label: string;
  format: PieceFormat;
  body: string;
}

interface VisualConfig {
  styleRefs: InspirationFile[];
  slideImages: CarouselImage[]; // carousel
  productImages: { base64: string; name: string; caption?: string }[]; // newsletter / email
}

interface RenderedPiece {
  format: PieceFormat;
  rawJson?: string;
  content: string;
  slides?: CarouselSlide[];
  newsletter?: NewsletterData;
  slideImages?: CarouselImage[];
  productImages?: { base64: string; name: string; caption?: string }[];
}

interface Props {
  output: GeneratedOutput;
  client: SelectedClient;
  onStartNew: () => void;
  onChangeClient: () => void;
}

function classifyFormat(label: string): PieceFormat {
  const upper = label.toUpperCase();
  if (upper.startsWith('CAROUSEL')) return 'carousel';
  if (upper.startsWith('REEL')) return 'reel';
  if (upper.startsWith('CAPTION')) return 'caption';
  if (upper.startsWith('NEWSLETTER')) return 'newsletter';
  if (upper.startsWith('EMAIL')) return 'email';
  if (upper.startsWith('SUMMARY')) return 'summary';
  return 'unknown';
}

function parseTranscript(content: string) {
  const text = content || '';
  if (!text.trim()) return null;
  const headingRe = /^===\s*(.+?)\s*===\s*$/gm;
  type Block = { heading: string; body: string };
  const blocks: Block[] = [];
  const matches = Array.from(text.matchAll(headingRe));
  if (matches.length === 0) return null;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const heading = m[1].trim();
    const start = (m.index || 0) + m[0].length;
    const end = i + 1 < matches.length ? (matches[i + 1].index || text.length) : text.length;
    blocks.push({ heading, body: text.slice(start, end).trim() });
  }
  const voiceAnalysis = blocks.find((b) => /^VOICE ANALYSIS$/i.test(b.heading))?.body || '';
  const keyMoments = blocks.find((b) => /^KEY MOMENTS$/i.test(b.heading))?.body || '';
  const keyInsights = blocks.find((b) => /^KEY INSIGHTS$/i.test(b.heading))?.body || '';
  const pieces: Piece[] = blocks
    .filter((b) => !/^VOICE ANALYSIS$|^KEY MOMENTS$|^KEY INSIGHTS$/i.test(b.heading))
    .map((b) => ({ label: b.heading, format: classifyFormat(b.heading), body: b.body }));
  return { voiceAnalysis, keyMoments, keyInsights, pieces };
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      resolve(r.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const VISUAL_FORMATS: PieceFormat[] = ['carousel', 'newsletter', 'email'];

export default function TranscriptResultsFlow({
  output,
  client,
  onStartNew,
  onChangeClient,
}: Props) {
  const parsed = useMemo(() => parseTranscript(output.content), [output.content]);

  const [stage, setStage] = useState<'edit' | 'visuals'>('edit');
  const [bodies, setBodies] = useState<string[]>(() => parsed?.pieces.map((p) => p.body) || []);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [visualConfigs, setVisualConfigs] = useState<Record<number, VisualConfig>>({});
  const [renders, setRenders] = useState<Record<number, RenderedPiece>>({});
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});

  if (!parsed) {
    return (
      <div className="bg-white rounded-2xl border border-border-light p-6">
        <p className="font-ui text-sm text-text-secondary">Could not parse transcript output. Raw content:</p>
        <pre className="mt-3 text-xs whitespace-pre-wrap bg-cream/60 p-3 rounded-lg">{output.content}</pre>
      </div>
    );
  }

  const pieces = parsed.pieces;

  const getConfig = (idx: number): VisualConfig =>
    visualConfigs[idx] || { styleRefs: [], slideImages: [], productImages: [] };

  const updateConfig = (idx: number, patch: Partial<VisualConfig>) => {
    setVisualConfigs((curr) => ({ ...curr, [idx]: { ...getConfig(idx), ...patch } }));
  };

  const handleStyleRefUpload = async (idx: number, files: FileList | null) => {
    if (!files || !files.length) return;
    const cfg = getConfig(idx);
    const newRefs = [...cfg.styleRefs];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const base64 = await readFileAsBase64(f);
      newRefs.push({ name: f.name, type: f.type, base64, mediaType: f.type });
    }
    updateConfig(idx, { styleRefs: newRefs });
  };

  const handleSlideImageUpload = async (idx: number, files: FileList | null) => {
    if (!files || !files.length) return;
    const cfg = getConfig(idx);
    const next = [...cfg.slideImages];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const base64 = await readFileAsBase64(f);
      next.push({ base64, name: f.name, usage: 'background' });
    }
    updateConfig(idx, { slideImages: next });
  };

  const handleProductImageUpload = async (idx: number, files: FileList | null) => {
    if (!files || !files.length) return;
    const cfg = getConfig(idx);
    const next = [...cfg.productImages];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const base64 = await readFileAsBase64(f);
      next.push({ base64, name: f.name });
    }
    updateConfig(idx, { productImages: next });
  };

  const removeStyleRef = (idx: number, refIdx: number) => {
    const cfg = getConfig(idx);
    updateConfig(idx, { styleRefs: cfg.styleRefs.filter((_, i) => i !== refIdx) });
  };
  const removeSlideImage = (idx: number, imgIdx: number) => {
    const cfg = getConfig(idx);
    updateConfig(idx, { slideImages: cfg.slideImages.filter((_, i) => i !== imgIdx) });
  };
  const removeProductImage = (idx: number, imgIdx: number) => {
    const cfg = getConfig(idx);
    updateConfig(idx, { productImages: cfg.productImages.filter((_, i) => i !== imgIdx) });
  };
  const toggleSlideUsage = (idx: number, imgIdx: number) => {
    const cfg = getConfig(idx);
    const next = cfg.slideImages.map((s, i) =>
      i === imgIdx ? { ...s, usage: (s.usage === 'background' ? 'inline' : 'background') as 'background' | 'inline' } : s
    );
    updateConfig(idx, { slideImages: next });
  };

  const generateVisualsFor = async (idx: number) => {
    const piece = pieces[idx];
    const cfg = getConfig(idx);
    const editedBody = bodies[idx] ?? piece.body;
    setBusyIdx(idx);
    setErrors((e) => ({ ...e, [idx]: '' }));

    try {
      let endpointType: 'carousel' | 'newsletter' | null = null;
      let typeConfig: Partial<CarouselConfig> | Partial<NewsletterConfig> | null = null;

      if (piece.format === 'carousel') {
        endpointType = 'carousel';
        typeConfig = {
          slideCount: 7,
          slideFormat: 'tips',
          ctaSlide: true,
          canvaOutput: false,
          referenceImages: [],
          slideImages: [],
        };
      } else if (piece.format === 'newsletter') {
        endpointType = 'newsletter';
        typeConfig = {
          subjectLineAngle: '',
          cta: '',
          ctaUrl: '',
          length: 'medium',
        };
      } else {
        setErrors((e) => ({ ...e, [idx]: 'No visual generator available for this piece type yet.' }));
        setBusyIdx(null);
        return;
      }

      const inspirationBase64 = cfg.styleRefs[0]?.base64;
      const inspirationMediaType = cfg.styleRefs[0]?.mediaType;

      const body = {
        client,
        // Every voice-preserved format gets the same treatment: topic is a short
        // hint, sourceText is the transcript piece in the speaker's voice, and
        // the builder lifts every line directly from that source.
        topic: `Reformat the source text into a ${piece.format}. Keep the speaker's voice intact — verbatim quotes only.`,
        tone: client.tone,
        typeConfig,
        inspirationBase64,
        inspirationMediaType,
        voicePreservation: true,
        sourceText: editedBody,
      };

      const res = await fetch(`/api/generate/${endpointType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Generation failed.');
      }
      const data = await res.json();

      const rendered: RenderedPiece = {
        format: piece.format,
        content: data.content,
        slideImages: cfg.slideImages,
        productImages: cfg.productImages,
      };

      try {
        const parsedJson = JSON.parse(data.content);
        rendered.rawJson = data.content;
        if (piece.format === 'carousel') {
          if (Array.isArray(parsedJson) && parsedJson.length > 0 && parsedJson[0].type) {
            rendered.slides = parsedJson as CarouselSlide[];
          } else if (parsedJson && Array.isArray(parsedJson.slides)) {
            rendered.slides = parsedJson.slides as CarouselSlide[];
          }
        }
        if (piece.format === 'newsletter') {
          if (parsedJson && parsedJson.subjectLine && Array.isArray(parsedJson.sections)) {
            rendered.newsletter = parsedJson as NewsletterData;
          }
        }
      } catch {
        // raw text fallback
      }

      setRenders((r) => ({ ...r, [idx]: rendered }));
    } catch (err) {
      setErrors((e) => ({ ...e, [idx]: err instanceof Error ? err.message : 'Generation failed.' }));
    } finally {
      setBusyIdx(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-text-primary mb-1">
            {stage === 'edit' ? 'Edit your copy' : 'Set up the visuals'}
          </h2>
          <p className="font-ui text-sm text-text-muted">
            {stage === 'edit'
              ? 'Tweak each piece until it sounds exactly right. Move on when you\'re happy.'
              : 'Add a style reference or images per piece. Anything you skip falls back to the brand style.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onStartNew}
            className="px-4 py-2 border border-border-light text-text-secondary font-ui text-sm rounded-full hover:border-border transition-colors"
          >
            New transcript
          </button>
          <button
            onClick={onChangeClient}
            className="px-4 py-2 border border-border-light text-text-secondary font-ui text-sm rounded-full hover:border-border transition-colors"
          >
            Change client
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-3 text-xs font-ui">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${stage === 'edit' ? 'bg-brown text-white' : 'bg-cream-dark text-text-secondary'}`}>
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-semibold">1</span>
          <span className="font-semibold">Edit copy</span>
        </div>
        <div className="h-px w-6 bg-border-light" />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${stage === 'visuals' ? 'bg-brown text-white' : 'bg-cream-dark text-text-secondary'}`}>
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-semibold">2</span>
          <span className="font-semibold">Visuals</span>
        </div>
      </div>

      {/* Voice analysis block */}
      {(parsed.voiceAnalysis || parsed.keyMoments || parsed.keyInsights) && (
        <details className="bg-cream/60 rounded-2xl border border-border-light p-5">
          <summary className="font-ui text-sm font-semibold text-text-primary cursor-pointer">
            Voice analysis · Key moments · Key insights
          </summary>
          <div className="mt-4 space-y-4">
            {parsed.voiceAnalysis && (
              <div>
                <p className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Voice analysis</p>
                <p className="font-body text-sm leading-relaxed text-text-primary whitespace-pre-wrap">{parsed.voiceAnalysis}</p>
              </div>
            )}
            {parsed.keyMoments && (
              <div>
                <p className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Key moments</p>
                <p className="font-body text-sm leading-relaxed text-text-primary whitespace-pre-wrap">{parsed.keyMoments}</p>
              </div>
            )}
            {parsed.keyInsights && (
              <div>
                <p className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Key insights</p>
                <p className="font-body text-sm leading-relaxed text-text-primary whitespace-pre-wrap">{parsed.keyInsights}</p>
              </div>
            )}
          </div>
        </details>
      )}

      {/* Pieces */}
      <div className="space-y-3">
        {pieces.map((piece, idx) => {
          const isCopied = copiedIdx === idx;
          const body = bodies[idx] ?? piece.body;
          const cfg = getConfig(idx);
          const rendered = renders[idx];
          const isBusy = busyIdx === idx;
          const isVisualType = VISUAL_FORMATS.includes(piece.format);
          const err = errors[idx];

          return (
            <div key={idx} className="bg-white rounded-2xl border border-border-light overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between gap-3 px-5 py-3 bg-cream/80 border-b border-border-light">
                <span className="font-ui text-[10px] font-semibold text-brown bg-brown/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {piece.label}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await copyToClipboard(body);
                    setCopiedIdx(idx);
                    setTimeout(() => setCopiedIdx((curr) => (curr === idx ? null : curr)), 1800);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-ui text-xs font-semibold transition-all ${
                    isCopied
                      ? 'bg-green text-white'
                      : 'bg-white text-brown border border-brown/30 hover:bg-brown hover:text-white hover:border-brown'
                  }`}
                >
                  {isCopied ? 'Copied' : 'Copy'}
                </button>
              </div>

              {/* Stage 1 — editable copy */}
              {stage === 'edit' && (
                <div className="px-5 py-4">
                  <textarea
                    value={body}
                    onChange={(e) => {
                      const next = [...bodies];
                      next[idx] = e.target.value;
                      setBodies(next);
                    }}
                    rows={Math.max(4, Math.min(20, Math.ceil(body.length / 60)))}
                    className="w-full px-3 py-2.5 border border-border-light rounded-xl font-body text-sm leading-relaxed focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 resize-y bg-white"
                  />
                </div>
              )}

              {/* Stage 2 — visuals */}
              {stage === 'visuals' && (
                <div className="px-5 py-4 space-y-4">
                  {/* Copy preview */}
                  <details className="bg-cream/40 rounded-lg p-3">
                    <summary className="font-ui text-xs font-semibold text-text-secondary cursor-pointer">View copy</summary>
                    <p className="mt-2 font-body text-sm leading-relaxed text-text-primary whitespace-pre-wrap">{body}</p>
                  </details>

                  {/* Visual setup — only for visual types */}
                  {isVisualType ? (
                    <>
                      <div>
                        <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5 block">
                          Style reference (optional)
                        </label>
                        <p className="font-ui text-xs text-text-muted mb-2">
                          Drop screenshots or examples whose visual vibe you want to match.
                        </p>
                        <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border-light rounded-xl cursor-pointer hover:border-brown transition-colors bg-cream/40">
                          <span className="font-ui text-sm text-text-muted">
                            {cfg.styleRefs.length > 0 ? 'Add more references' : 'Upload style references'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleStyleRefUpload(idx, e.target.files)}
                            className="hidden"
                          />
                        </label>
                        {cfg.styleRefs.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {cfg.styleRefs.map((ref, i) => (
                              <div key={i} className="relative group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={`data:${ref.mediaType};base64,${ref.base64}`}
                                  alt={ref.name}
                                  className="rounded-lg border border-border-light"
                                  style={{ width: 64, height: 64, objectFit: 'cover' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeStyleRef(idx, i)}
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red text-white rounded-full text-xs flex items-center justify-center"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Carousel-only: slide images */}
                      {piece.format === 'carousel' && (
                        <div>
                          <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5 block">
                            Slide images (optional)
                          </label>
                          <p className="font-ui text-xs text-text-muted mb-2">
                            Photos to use as slide backgrounds or inline. Tap each thumbnail to switch its role.
                          </p>
                          <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border-light rounded-xl cursor-pointer hover:border-brown transition-colors bg-cream/40">
                            <span className="font-ui text-sm text-text-muted">
                              {cfg.slideImages.length > 0 ? 'Add more slide images' : 'Upload slide images'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleSlideImageUpload(idx, e.target.files)}
                              className="hidden"
                            />
                          </label>
                          {cfg.slideImages.length > 0 && (
                            <div className="mt-2 space-y-1.5">
                              {cfg.slideImages.map((img, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-border-light">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`data:image/jpeg;base64,${img.base64}`}
                                    alt={img.name}
                                    className="rounded"
                                    style={{ width: 40, height: 50, objectFit: 'cover' }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-ui text-xs text-text-primary truncate">{img.name}</p>
                                    <button
                                      type="button"
                                      onClick={() => toggleSlideUsage(idx, i)}
                                      className="font-ui text-[10px] text-brown hover:underline"
                                    >
                                      {img.usage === 'background' ? 'Background' : 'Inline'} — switch
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeSlideImage(idx, i)}
                                    className="text-red hover:opacity-70 p-1"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Newsletter / email: product images */}
                      {(piece.format === 'newsletter' || piece.format === 'email') && (
                        <div>
                          <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5 block">
                            Images to include (optional)
                          </label>
                          <p className="font-ui text-xs text-text-muted mb-2">
                            Product, team, or feature photos to drop into the {piece.format === 'newsletter' ? 'newsletter' : 'email'}.
                          </p>
                          <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border-light rounded-xl cursor-pointer hover:border-brown transition-colors bg-cream/40">
                            <span className="font-ui text-sm text-text-muted">
                              {cfg.productImages.length > 0 ? 'Add more images' : 'Upload images'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleProductImageUpload(idx, e.target.files)}
                              className="hidden"
                            />
                          </label>
                          {cfg.productImages.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {cfg.productImages.map((img, i) => (
                                <div key={i} className="relative group">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`data:image/jpeg;base64,${img.base64}`}
                                    alt={img.name}
                                    className="rounded-lg border border-border-light"
                                    style={{ width: 64, height: 64, objectFit: 'cover' }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeProductImage(idx, i)}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red text-white rounded-full text-xs flex items-center justify-center"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Generate button */}
                      <div className="pt-1">
                        {piece.format === 'carousel' || piece.format === 'newsletter' ? (
                          <button
                            type="button"
                            onClick={() => generateVisualsFor(idx)}
                            disabled={isBusy}
                            className={`px-6 py-2.5 font-ui font-semibold text-sm rounded-full transition-all ${
                              isBusy
                                ? 'bg-cream-dark text-text-muted cursor-wait'
                                : 'bg-brown text-white hover:bg-brown-light'
                            }`}
                          >
                            {isBusy
                              ? 'Generating visual...'
                              : rendered
                                ? 'Regenerate visual'
                                : `Generate ${piece.format} visual`}
                          </button>
                        ) : (
                          <p className="font-ui text-xs text-text-muted">
                            Visual generation for {piece.format} comes from the rendered email/asset stage. Style refs and images saved here will be carried over.
                          </p>
                        )}
                        {err && <p className="font-ui text-xs text-red mt-2">{err}</p>}
                      </div>
                    </>
                  ) : (
                    <p className="font-ui text-xs text-text-muted">
                      This piece is text-only — copy is ready, no visual setup needed.
                    </p>
                  )}

                  {/* Rendered visual */}
                  {rendered && (
                    <div className="mt-4 border-t border-border-light pt-4">
                      {rendered.format === 'carousel' && rendered.slides ? (
                        <CarouselRenderer
                          slides={rendered.slides}
                          brandColour={client.brandColour}
                          clientName={client.name}
                          slideImages={rendered.slideImages}
                        />
                      ) : rendered.format === 'newsletter' && rendered.newsletter ? (
                        <NewsletterRenderer
                          data={rendered.newsletter}
                          brandColour={client.brandColour}
                          clientName={client.name}
                          productImages={rendered.productImages}
                        />
                      ) : (
                        <div className="font-body text-sm leading-relaxed whitespace-pre-wrap text-text-primary bg-cream/40 p-4 rounded-lg">
                          {rendered.content}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {stage === 'edit' ? (
          <>
            <span className="font-ui text-xs text-text-muted">{pieces.length} piece{pieces.length === 1 ? '' : 's'} ready to edit.</span>
            <button
              onClick={() => setStage('visuals')}
              className="px-8 py-3 bg-brown text-white font-ui font-semibold text-sm rounded-full hover:bg-brown-light transition-colors"
            >
              Continue to visuals →
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setStage('edit')}
              className="font-ui text-sm text-brown hover:text-brown-light underline underline-offset-2"
            >
              ← Back to edit copy
            </button>
            <span className="font-ui text-xs text-text-muted">
              Style or images skipped → falls back to {client.name}&apos;s brand style.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
