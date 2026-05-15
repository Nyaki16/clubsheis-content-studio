'use client';

import { useMemo, useState } from 'react';
import {
  SelectedClient,
  TranscriptConfig,
  TranscriptFormat,
  TypeSpecificConfig,
  UniversalConfig,
} from '@/types';

interface Props {
  client: SelectedClient;
  onGenerate: (universal: UniversalConfig, typeSpecific: TypeSpecificConfig) => void;
  onBack?: () => void;
}

const formatRows: { key: TranscriptFormat; label: string; hint: string }[] = [
  { key: 'carousel', label: 'Carousel', hint: 'Multi-slide IG carousel' },
  { key: 'reel', label: 'Reel Script', hint: 'Hook · Script · CTA · Caption' },
  { key: 'caption', label: 'Caption', hint: 'Single social post' },
  { key: 'newsletter', label: 'Newsletter section', hint: 'Section ready to drop in' },
  { key: 'email', label: 'Email', hint: 'Subject · Preheader · Body · CTA' },
  { key: 'summary', label: 'Summary doc', hint: 'Narrative summary in their voice' },
];

export default function TranscriptStudio({ client, onGenerate, onBack }: Props) {
  const [transcriptText, setTranscriptText] = useState('');
  const [keyThemes, setKeyThemes] = useState('');
  const [counts, setCounts] = useState<Partial<Record<TranscriptFormat, number>>>({
    carousel: 1,
    caption: 1,
  });
  const [docLink, setDocLink] = useState('');
  const [transcribing, setTranscribing] = useState<null | 'audio' | 'doc'>(null);
  const [transcribeError, setTranscribeError] = useState('');
  const [transcribeSource, setTranscribeSource] = useState('');

  const wordCount = useMemo(
    () => (transcriptText.trim() ? transcriptText.trim().split(/\s+/).length : 0),
    [transcriptText]
  );

  const totalPieces = useMemo(
    () => Object.values(counts).reduce((sum, n) => sum + (Number(n) || 0), 0),
    [counts]
  );

  const canGenerate = wordCount > 0 && totalPieces > 0;

  const setCount = (k: TranscriptFormat, n: number) => {
    setCounts((curr) => ({ ...curr, [k]: Math.max(0, Math.min(10, n)) }));
  };

  const handleTranscriptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text();
      setTranscriptText(text);
      setTranscribeSource(file.name);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTranscribeError('');
    setTranscribing('audio');
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const r = reader.result as string;
          resolve(r.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'audio', base64, mimeType: file.type || 'audio/mpeg' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transcription failed.');
      setTranscriptText(data.text || '');
      setTranscribeSource(file.name);
    } catch (err) {
      setTranscribeError(err instanceof Error ? err.message : 'Transcription failed.');
    } finally {
      setTranscribing(null);
      // Allow re-uploading the same file later
      e.target.value = '';
    }
  };

  const handleDocFetch = async () => {
    if (!docLink.trim()) return;
    setTranscribeError('');
    setTranscribing('doc');
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'doc', url: docLink.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not read that link.');
      setTranscriptText(data.text || '');
      setTranscribeSource(docLink.trim());
    } catch (err) {
      setTranscribeError(err instanceof Error ? err.message : 'Could not read that link.');
    } finally {
      setTranscribing(null);
    }
  };

  const handleGenerate = () => {
    if (!canGenerate) return;
    const universal: UniversalConfig = {
      topic: 'Repurpose the pasted transcript using the speaker\'s own words and voice.',
      toneOverride: client.tone,
      inspirationFiles: [],
      inspirationUrl: undefined,
    };
    const config: TranscriptConfig = {
      transcriptText,
      outputCounts: counts,
      keyThemes,
    };
    onGenerate(universal, { type: 'transcript', config });
  };

  return (
    <div className="bg-white rounded-2xl border border-border-light p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-text-primary mb-1">
            Transcript → Content
          </h2>
          <p className="font-ui text-sm text-text-muted">
            Paste a transcript. Pick the pieces you want. The AI keeps the speaker&apos;s voice and lifts their actual words.
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="font-ui text-xs text-brown hover:text-brown-light transition-colors underline underline-offset-2 flex-shrink-0 pt-1"
          >
            ← Change content type
          </button>
        )}
      </div>

      <div className="space-y-7 max-w-3xl">
        {/* Step 1: Paste transcript */}
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-ui text-[10px] font-semibold text-brown bg-brown/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Step 1</span>
            <label className="font-ui text-sm font-semibold text-text-primary">Get the transcript in</label>
          </div>
          <p className="font-ui text-xs text-text-muted mb-3">
            Paste it directly, upload an audio/video file we&apos;ll transcribe, or paste a Google Doc or web link.
          </p>

          {/* Upload bar — audio + doc link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            <label
              className={`flex items-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                transcribing === 'audio' ? 'border-brown bg-brown/5' : 'border-border-light hover:border-brown bg-cream/40'
              }`}
            >
              <svg className="w-4 h-4 text-brown flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-14 0m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="font-ui text-xs text-text-secondary truncate">
                {transcribing === 'audio' ? 'Transcribing audio…' : 'Upload audio or video'}
              </span>
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={handleAudioUpload}
                className="hidden"
                disabled={transcribing !== null}
              />
            </label>

            <div className="flex items-center gap-2 px-3 py-2 border border-border-light rounded-xl bg-white focus-within:border-brown focus-within:ring-1 focus-within:ring-brown/20">
              <svg className="w-4 h-4 text-brown flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 015.656 0l1.415 1.415a4 4 0 010 5.656l-3.535 3.535a4 4 0 01-5.657 0l-1.414-1.414m-1.414-7.071L7.343 9.171a4 4 0 00-5.657 0L1.272 9.586a4 4 0 000 5.657l3.535 3.535" />
              </svg>
              <input
                type="url"
                value={docLink}
                onChange={(e) => setDocLink(e.target.value)}
                placeholder="Paste a Google Doc or web link"
                className="flex-1 min-w-0 font-ui text-xs bg-transparent focus:outline-none placeholder:text-text-muted"
                disabled={transcribing !== null}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && docLink.trim() && transcribing === null) {
                    e.preventDefault();
                    handleDocFetch();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleDocFetch}
                disabled={!docLink.trim() || transcribing !== null}
                className="font-ui text-xs font-semibold text-brown hover:underline disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                {transcribing === 'doc' ? 'Reading…' : 'Fetch'}
              </button>
            </div>
          </div>

          {transcribeError && (
            <p className="font-ui text-xs text-red mb-2">{transcribeError}</p>
          )}
          {transcribeSource && !transcribeError && (
            <p className="font-ui text-xs text-green mb-2">
              Pulled transcript from <span className="font-medium">{transcribeSource}</span> — review and edit below.
            </p>
          )}

          <textarea
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
            placeholder="Or paste the transcript here directly..."
            rows={14}
            className="w-full px-4 py-3 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 resize-y bg-white leading-relaxed"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="font-ui text-xs text-text-muted">
              {wordCount.toLocaleString()} word{wordCount === 1 ? '' : 's'}
              {wordCount > 0 && wordCount < 200 && ' — short transcript, voice analysis may be thin'}
            </span>
            <label className="font-ui text-xs text-brown cursor-pointer hover:underline">
              Upload a .txt file
              <input type="file" accept=".txt,text/plain" onChange={handleTranscriptUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Step 2: Outputs */}
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-ui text-[10px] font-semibold text-brown bg-brown/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Step 2</span>
            <label className="font-ui text-sm font-semibold text-text-primary">Choose your outputs</label>
          </div>
          <p className="font-ui text-xs text-text-muted mb-3">
            Pick a count per format. Each piece will be different — different hook, different angle into the transcript — but every word stays in the speaker&apos;s voice.
          </p>
          <div className="space-y-2">
            {formatRows.map((row) => {
              const value = Number(counts[row.key] || 0);
              return (
                <div
                  key={row.key}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border transition-colors ${
                    value > 0 ? 'bg-cream/60 border-brown/30' : 'bg-white border-border-light'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-ui text-sm font-medium text-text-primary">{row.label}</p>
                    <p className="font-ui text-xs text-text-muted">{row.hint}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setCount(row.key, value - 1)}
                      disabled={value <= 0}
                      className="w-8 h-8 rounded-full border border-border-light font-ui text-base text-text-secondary hover:bg-cream-dark disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label={`Decrease ${row.label}`}
                    >
                      −
                    </button>
                    <span className={`font-ui font-semibold text-sm w-6 text-center ${value > 0 ? 'text-brown' : 'text-text-muted'}`}>{value}</span>
                    <button
                      type="button"
                      onClick={() => setCount(row.key, value + 1)}
                      disabled={value >= 10}
                      className="w-8 h-8 rounded-full border border-border-light font-ui text-base text-text-secondary hover:bg-cream-dark disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label={`Increase ${row.label}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="font-ui text-xs text-text-muted mt-3">
            {totalPieces === 0
              ? 'Pick at least one piece to generate.'
              : `Total: ${totalPieces} piece${totalPieces === 1 ? '' : 's'} — each generated separately and ready to copy.`}
          </p>
        </div>

        {/* Step 3 (optional): Themes */}
        <div>
          <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
            Key themes to prioritise (optional)
          </label>
          <textarea
            value={keyThemes}
            onChange={(e) => setKeyThemes(e.target.value)}
            placeholder="Any specific points or moments you want pulled out first? Leave blank to let the AI decide."
            rows={2}
            className="w-full px-4 py-3 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 resize-none bg-white"
          />
        </div>

        {/* Generate */}
        <div className="pt-2">
          {!canGenerate && (
            <p className="font-ui text-sm text-orange mb-3">
              Paste a transcript and choose at least one piece to generate.
            </p>
          )}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`w-full sm:w-auto px-10 py-3.5 font-ui font-semibold text-base rounded-full transition-all ${
              canGenerate
                ? 'bg-brown text-white hover:bg-brown-light shadow-md hover:shadow-lg'
                : 'bg-cream-dark text-text-muted cursor-not-allowed'
            }`}
          >
            Generate {totalPieces > 0 ? `${totalPieces} piece${totalPieces === 1 ? '' : 's'}` : 'Content'}
          </button>
        </div>
      </div>
    </div>
  );
}
