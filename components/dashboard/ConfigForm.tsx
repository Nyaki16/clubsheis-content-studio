'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ContentType,
  SelectedClient,
  UniversalConfig,
  TypeSpecificConfig,
  InspirationFile,
  NewsletterConfig,
  CarouselConfig,
  ReelConfig,
  StaticImageConfig,
  EmailSequenceConfig,
  AdCreativeConfig,
  CaptionConfig,
  TranscriptConfig,
} from '@/types';
import InspirationDropzone from './InspirationDropzone';

interface Props {
  contentType: ContentType;
  client: SelectedClient;
  onGenerate: (universal: UniversalConfig, typeSpecific: TypeSpecificConfig) => void;
  defaultOverrides?: Record<string, unknown>;
  deliverableNotes?: string;
}

function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 font-ui text-sm rounded-lg border transition-all ${
              value === opt.value
                ? 'bg-brown text-white border-brown'
                : 'bg-white text-text-primary border-border-light hover:border-border'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return <RadioGroup label={label} options={options} value={value} onChange={onChange} />;
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-brown rounded"
      />
      <span className="font-ui text-sm text-text-primary">{label}</span>
    </label>
  );
}

function SliderField({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
        {label}: <span className="text-text-primary">{value}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brown"
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-4 py-3 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 resize-none bg-white"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 bg-white"
        />
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div>
      <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        className="w-24 px-4 py-3 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 bg-white"
      />
    </div>
  );
}

function MultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) => {
    onChange(
      value.includes(v) ? value.filter((x) => x !== v) : [...value, v]
    );
  };
  return (
    <div>
      <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`px-4 py-2 font-ui text-sm rounded-lg border transition-all ${
              value.includes(opt.value)
                ? 'bg-brown text-white border-brown'
                : 'bg-white text-text-primary border-border-light hover:border-border'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function getDefaultConfig(type: ContentType): TypeSpecificConfig {
  switch (type) {
    case 'newsletter':
      return { type: 'newsletter', config: { subjectLineAngle: '', cta: '', ctaUrl: '', length: 'medium' } };
    case 'carousel':
      return { type: 'carousel', config: { slideCount: 8, slideFormat: 'tips', ctaSlide: true, canvaOutput: false, referenceImages: [], slideImages: [] } };
    case 'reel':
      return { type: 'reel', config: { duration: '30', hookStyle: 'bold-statement', format: 'talk-to-camera', platform: 'instagram' } };
    case 'static-image':
      return { type: 'static-image', config: { imagePurpose: 'announcement', format: '4:5', textToFeature: '', canvaOutput: false } };
    case 'email-sequence':
      return { type: 'email-sequence', config: { sequenceGoal: 'nurture', emailCount: 5, sendCadence: 'Day 0, Day 2, Day 4, Day 7, Day 10', offer: '' } };
    case 'ad-creative':
      return { type: 'ad-creative', config: { platforms: ['facebook'], adFormat: 'single-image', objective: 'lead-gen', variationCount: 3 } };
    case 'caption':
      return { type: 'caption', config: { platform: 'instagram', postType: 'informational', includeHashtags: true, includeCta: true } };
    case 'transcript':
      return { type: 'transcript', config: { transcriptText: '', outputCounts: { carousel: 1, caption: 1 }, keyThemes: '' } };
  }
}

// Only saved/uploaded brand voices appear — no hardcoded list

// Content types that don't need inspiration images
const NO_INSPIRATION_TYPES: ContentType[] = ['newsletter', 'email-sequence', 'transcript', 'carousel', 'caption', 'ad-creative', 'reel', 'static-image'];

function HookSuggestField({
  label,
  value,
  onChange,
  placeholder,
  hookType,
  topic,
  client,
  tone,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hookType: string;
  topic: string;
  client: SelectedClient;
  tone?: string;
  multiline?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSuggestions = async () => {
    if (!topic.trim()) {
      setError('Add source content (paste, audio, or doc link) in the topic field above first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/suggest-hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, count: 5, hookType, client, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to suggest hooks.');
      setSuggestions(data.hooks || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to suggest hooks.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-3">
        <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide">
          {label}
        </label>
        <button
          type="button"
          onClick={fetchSuggestions}
          disabled={loading || !topic.trim()}
          className="font-ui text-xs font-semibold text-brown hover:underline disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          title={!topic.trim() ? 'Add source content above first' : 'Suggest hooks from your content'}
        >
          {loading ? 'Thinking…' : '✨ Suggest from your content'}
        </button>
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-4 py-3 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 resize-none bg-white"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 bg-white"
        />
      )}
      {error && <p className="font-ui text-xs text-red mt-1.5">{error}</p>}
      {suggestions.length > 0 && (
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="font-ui text-[10px] uppercase tracking-wider text-text-muted">Tap one to use it</p>
            <button
              type="button"
              onClick={() => setSuggestions([])}
              className="font-ui text-[10px] text-text-muted hover:text-text-secondary"
            >
              Dismiss
            </button>
          </div>
          {suggestions.map((s, i) => (
            <button
              type="button"
              key={i}
              onClick={() => {
                onChange(s);
                setSuggestions([]);
              }}
              className="w-full text-left px-3 py-2 bg-cream/60 hover:bg-cream-dark border border-border-light hover:border-brown/40 rounded-lg font-ui text-sm text-text-primary transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface SavedBrandVoice {
  id: string;
  name: string;
  group: string;
  description: string;
  sampleContent: string;
  voiceProfile?: string;
}

function BrandVoiceUploadModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('Custom');
  const [sampleText, setSampleText] = useState('');
  const [analysing, setAnalysing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ description: string; voiceProfile: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text();
      setSampleText(text);
    } else {
      setError('Please upload a .txt file, or paste your content directly.');
    }
  };

  const handleAnalyse = async () => {
    if (!name.trim() || !sampleText.trim()) return;
    setAnalysing(true);
    setError(null);

    try {
      const res = await fetch('/api/brand-voices/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, sampleContent: sampleText }),
      });

      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setResult({ description: data.description, voiceProfile: data.voiceProfile });
    } catch {
      setError('Failed to analyse the brand voice. You can still save it with the raw sample.');
    } finally {
      setAnalysing(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !sampleText.trim()) return;
    setSaving(true);

    try {
      const res = await fetch('/api/brand-voices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          group,
          description: result?.description || `Brand voice for ${name}`,
          sampleContent: result?.voiceProfile || sampleText,
        }),
      });

      if (!res.ok) throw new Error('Save failed');
      onSaved();
      onClose();
    } catch {
      setError('Failed to save brand voice.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-border-light max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold text-text-primary">Upload Brand Voice</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="font-ui text-sm text-text-secondary mb-5">
          Upload writing samples and we&apos;ll extract the voice to use across all content.
        </p>

        <div className="space-y-4">
          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5 block">Voice Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Okuhle, Nyaki, Client Name"
              className="w-full px-4 py-2.5 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 bg-white"
            />
          </div>

          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5 block">Category</label>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full px-4 py-2.5 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 bg-white appearance-none cursor-pointer"
            >
              <option value="Team">Team Member</option>
              <option value="Clients">Client</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5 block">Writing Sample</label>
            <textarea
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              placeholder="Paste 2-3 pieces of writing that represent this voice. The more content, the better the analysis."
              rows={6}
              className="w-full px-4 py-3 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 resize-none bg-white"
            />
            <div className="mt-2">
              <label className="font-ui text-xs text-brown cursor-pointer hover:underline">
                Or upload a .txt file
                <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {result && (
            <div className="bg-green-light rounded-xl p-4">
              <p className="font-ui text-xs font-semibold text-green uppercase tracking-wide mb-1">Voice Analysed</p>
              <p className="font-ui text-sm text-text-primary">{result.description}</p>
            </div>
          )}

          {error && (
            <p className="font-ui text-sm text-red">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            {!result ? (
              <button
                onClick={handleAnalyse}
                disabled={!name.trim() || !sampleText.trim() || analysing}
                className={`flex-1 px-6 py-3 font-ui font-semibold text-sm rounded-full transition-all ${
                  name.trim() && sampleText.trim() && !analysing
                    ? 'bg-brown text-white hover:bg-brown-light'
                    : 'bg-cream-dark text-text-muted cursor-not-allowed'
                }`}
              >
                {analysing ? 'Analysing voice...' : 'Analyse & Preview'}
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-green text-white font-ui font-semibold text-sm rounded-full hover:opacity-90 transition-all"
              >
                {saving ? 'Saving...' : 'Save Brand Voice'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 border border-border-light text-text-secondary font-ui font-semibold text-sm rounded-full hover:border-border transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandVoiceEditModal({ voice, onClose, onSaved }: { voice: SavedBrandVoice; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(voice.name);
  const [group, setGroup] = useState(voice.group);
  const [sampleText, setSampleText] = useState(voice.sampleContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim() || !sampleText.trim()) return;
    setSaving(true);
    setError(null);

    try {
      // Delete old and re-insert (simpler than building a PATCH endpoint)
      await fetch(`/api/brand-voices?id=${voice.id}`, { method: 'DELETE' });

      const res = await fetch('/api/brand-voices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          group,
          description: `Brand voice for ${name}`,
          sampleContent: sampleText,
        }),
      });

      if (!res.ok) throw new Error('Save failed');
      onSaved();
    } catch {
      setError('Failed to update brand voice.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-border-light max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold text-text-primary">Edit Brand Voice</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5 block">Voice Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 bg-white"
            />
          </div>

          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5 block">Category</label>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full px-4 py-2.5 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 bg-white appearance-none cursor-pointer"
            >
              <option value="Team">Team Member</option>
              <option value="Clients">Client</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5 block">Voice Profile / Writing Sample</label>
            <textarea
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 resize-none bg-white"
            />
          </div>

          {error && <p className="font-ui text-sm text-red">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!name.trim() || !sampleText.trim() || saving}
              className={`flex-1 px-6 py-3 font-ui font-semibold text-sm rounded-full transition-all ${
                name.trim() && sampleText.trim() && !saving
                  ? 'bg-brown text-white hover:bg-brown-light'
                  : 'bg-cream-dark text-text-muted cursor-not-allowed'
              }`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-border-light text-text-secondary font-ui font-semibold text-sm rounded-full hover:border-border transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfigForm({ contentType, client, onGenerate, defaultOverrides, deliverableNotes }: Props) {
  const [topic, setTopic] = useState('');
  const [toneOverride, setToneOverride] = useState('default');
  const [brandVoice, setBrandVoice] = useState('default');
  const [inspirationFiles, setInspirationFiles] = useState<InspirationFile[]>([]);
  const [inspirationUrl, setInspirationUrl] = useState('');
  const [typeConfig, setTypeConfig] = useState<TypeSpecificConfig>(() => {
    const base = getDefaultConfig(contentType);
    if (defaultOverrides) {
      return { ...base, config: { ...base.config, ...defaultOverrides } } as TypeSpecificConfig;
    }
    return base;
  });
  const [showVoiceUpload, setShowVoiceUpload] = useState(false);
  const [editingVoice, setEditingVoice] = useState<SavedBrandVoice | null>(null);
  const [deletingVoiceId, setDeletingVoiceId] = useState<string | null>(null);
  const [savedVoices, setSavedVoices] = useState<SavedBrandVoice[]>([]);

  // Topic ingestion: audio file or doc/web link → transcript text in the topic field
  const [topicDocLink, setTopicDocLink] = useState('');
  const [topicTranscribing, setTopicTranscribing] = useState<null | 'audio' | 'doc'>(null);
  const [topicTranscribeError, setTopicTranscribeError] = useState('');
  const [topicTranscribeSource, setTopicTranscribeSource] = useState('');

  const handleTopicAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTopicTranscribeError('');
    setTopicTranscribing('audio');
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
      const newTopic = data.text || '';
      setTopic((prev) => (prev.trim() ? `${prev.trim()}\n\n${newTopic}` : newTopic));
      setTopicTranscribeSource(file.name);
    } catch (err) {
      setTopicTranscribeError(err instanceof Error ? err.message : 'Transcription failed.');
    } finally {
      setTopicTranscribing(null);
      e.target.value = '';
    }
  };

  const handleTopicDocFetch = async () => {
    if (!topicDocLink.trim()) return;
    setTopicTranscribeError('');
    setTopicTranscribing('doc');
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'doc', url: topicDocLink.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not read that link.');
      const newTopic = data.text || '';
      setTopic((prev) => (prev.trim() ? `${prev.trim()}\n\n${newTopic}` : newTopic));
      setTopicTranscribeSource(topicDocLink.trim());
    } catch (err) {
      setTopicTranscribeError(err instanceof Error ? err.message : 'Could not read that link.');
    } finally {
      setTopicTranscribing(null);
    }
  };

  const loadSavedVoices = useCallback(async () => {
    try {
      const res = await fetch('/api/brand-voices');
      if (res.ok) {
        const data = await res.json();
        setSavedVoices(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadSavedVoices();
  }, [loadSavedVoices]);

  const showInspiration = !NO_INSPIRATION_TYPES.includes(contentType);
  const hasInspiration = !showInspiration || inspirationFiles.length > 0 || inspirationUrl.trim().length > 0;
  const hasTopic = topic.trim().length > 0;
  const isTranscript = contentType === 'transcript';
  const transcriptTotalCount = isTranscript && typeConfig.type === 'transcript'
    ? Object.values(typeConfig.config.outputCounts || {}).reduce((sum, n) => sum + (Number(n) || 0), 0)
    : 0;
  const transcriptReady = isTranscript
    && typeConfig.type === 'transcript'
    && (typeConfig.config.transcriptText?.trim().length ?? 0) > 0
    && transcriptTotalCount > 0;
  const canGenerate = isTranscript
    ? transcriptReady
    : (hasInspiration && hasTopic);

  const handleGenerate = () => {
    if (!canGenerate) return;
    // Resolve brand voice: if a saved voice is selected, use its profile
    let resolvedTone = client.tone;
    if (brandVoice !== 'default') {
      const selectedVoice = savedVoices.find((sv) => sv.id === brandVoice);
      if (selectedVoice) {
        resolvedTone = `BRAND VOICE PROFILE FOR ${selectedVoice.name.toUpperCase()}:\n${selectedVoice.sampleContent}\n\nYou MUST write in this exact voice. Match the tone, vocabulary, sentence structure, and personality described above. Sign off as ${selectedVoice.name}, not as anyone else.`;
      }
    }

    // Apply tone override on top of brand voice
    const toneInstruction = toneOverride !== 'default'
      ? `\n\nAdditional tone adjustment: ${toneOverride}`
      : '';

    const effectiveTopic = isTranscript && !topic.trim()
      ? 'Repurpose the pasted transcript using the speaker\'s own words and voice.'
      : topic;

    const universal: UniversalConfig = {
      topic: effectiveTopic,
      toneOverride: resolvedTone + toneInstruction,
      inspirationFiles: showInspiration ? inspirationFiles : [],
      inspirationUrl: showInspiration ? (inspirationUrl || undefined) : undefined,
    };
    onGenerate(universal, typeConfig);
  };

  const updateConfig = <T extends TypeSpecificConfig['config']>(updates: Partial<T>) => {
    setTypeConfig((prev) => ({ ...prev, config: { ...prev.config, ...updates } } as TypeSpecificConfig));
  };

  const renderTypeFields = () => {
    switch (typeConfig.type) {
      case 'newsletter': {
        const c = typeConfig.config as NewsletterConfig;
        const handleNewsletterImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
          const files = e.target.files;
          if (!files) return;
          const existing = c.productImages || [];
          const newImages = [...existing];
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
              };
              reader.readAsDataURL(file);
            });
            newImages.push({ base64, name: file.name });
          }
          updateConfig({ productImages: newImages });
        };
        const removeNewsletterImage = (idx: number) => {
          const updated = (c.productImages || []).filter((_, i) => i !== idx);
          updateConfig({ productImages: updated });
        };
        return (
          <div className="space-y-5">
            <HookSuggestField
              label="Subject line angle"
              value={c.subjectLineAngle}
              onChange={(v) => updateConfig({ subjectLineAngle: v })}
              placeholder="What's the hook for this edition?"
              hookType="subject-line"
              topic={topic}
              client={client}
              tone={toneOverride}
            />
            <TextField label="CTA" value={c.cta} onChange={(v) => updateConfig({ cta: v })} placeholder="What do you want the reader to do?" />
            <TextField label="CTA link" value={c.ctaUrl} onChange={(v) => updateConfig({ ctaUrl: v })} placeholder="https://example.com/your-page" />
            <ToggleGroup label="Length" options={[{ value: 'short', label: 'Short (~400 words)' }, { value: 'medium', label: 'Medium (~700 words)' }, { value: 'long', label: 'Long (~1000 words)' }]} value={c.length} onChange={(v) => updateConfig({ length: v as NewsletterConfig['length'] })} />
            <ToggleGroup
              label="Email Style"
              options={[
                { value: 'editorial', label: 'Editorial' },
                { value: 'product-launch', label: 'Product Launch' },
                { value: 'minimal', label: 'Minimal' },
                { value: 'bold', label: 'Bold' },
              ]}
              value={c.style || 'editorial'}
              onChange={(v) => updateConfig({ style: v as NewsletterConfig['style'] })}
            />

            {/* Product / feature images */}
            <div>
              <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
                Product / Feature Images (optional)
              </label>
              <p className="font-ui text-xs text-text-muted mb-2">Upload photos to include in the email — product shots, team photos, feature screenshots</p>
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border-light rounded-xl cursor-pointer hover:border-brown transition-colors bg-white/60">
                <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-ui text-sm text-text-muted">Upload images</span>
                <input type="file" accept="image/*" multiple onChange={handleNewsletterImageUpload} className="hidden" />
              </label>
              {(c.productImages || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {(c.productImages || []).map((img, idx) => (
                    <div key={idx} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:image/jpeg;base64,${img.base64}`}
                        alt={img.name}
                        className="rounded-lg border border-border-light"
                        style={{ width: 72, height: 72, objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeNewsletterImage(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <span className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[9px] px-1 rounded font-ui font-semibold">
                        IMG {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'carousel': {
        const c = typeConfig.config as CarouselConfig;
        const handleCarouselImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
          const files = e.target.files;
          if (!files) return;
          const newImages = [...c.slideImages];
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
              };
              reader.readAsDataURL(file);
            });
            newImages.push({ base64, name: file.name, usage: 'background' });
          }
          updateConfig({ slideImages: newImages });
        };
        const removeCarouselImage = (idx: number) => {
          const newImages = c.slideImages.filter((_, i) => i !== idx);
          updateConfig({ slideImages: newImages });
        };
        const toggleImageUsage = (idx: number) => {
          const newImages = [...c.slideImages];
          newImages[idx] = { ...newImages[idx], usage: newImages[idx].usage === 'background' ? 'inline' : 'background' };
          updateConfig({ slideImages: newImages });
        };
        return (
          <div className="space-y-5">
            <SliderField label="Number of slides" min={3} max={12} value={c.slideCount} onChange={(v) => updateConfig({ slideCount: v })} />
            <RadioGroup label="Slide format" options={[{ value: 'tips', label: 'Tips / List' }, { value: 'story', label: 'Story / Narrative' }, { value: 'before-after', label: 'Before & After' }, { value: 'how-to', label: 'How To / Steps' }, { value: 'quote', label: 'Quote-driven' }]} value={c.slideFormat} onChange={(v) => updateConfig({ slideFormat: v as CarouselConfig['slideFormat'] })} />
            <CheckboxField label="Include a CTA slide at the end" checked={c.ctaSlide} onChange={(v) => updateConfig({ ctaSlide: v })} />

            {/* Style Reference upload — multiple images */}
            <div>
              <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5 block">
                Style Reference (optional)
              </label>
              <p className="font-ui text-xs text-text-muted mb-3">
                Upload screenshots of carousels you love — we&apos;ll match the vibe
              </p>

              {/* Upload zone — always visible */}
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border-light rounded-xl cursor-pointer hover:border-brown transition-colors bg-cream/40">
                <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-ui text-sm text-text-muted">
                  {c.referenceImages.length > 0 ? 'Add more reference images' : 'Drop style references here or click to upload'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    const newImages = [...c.referenceImages];
                    for (let i = 0; i < files.length; i++) {
                      const file = files[i];
                      const base64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const result = reader.result as string;
                          resolve(result.split(',')[1]);
                        };
                        reader.readAsDataURL(file);
                      });
                      newImages.push({ name: file.name, type: file.type, base64, mediaType: file.type });
                    }
                    updateConfig({ referenceImages: newImages });
                  }}
                  className="hidden"
                />
              </label>

              {/* Uploaded reference images list */}
              {c.referenceImages.length > 0 && (
                <div className="mt-3 space-y-2">
                  {c.referenceImages.map((img, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-border-light">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:image/jpeg;base64,${img.base64}`}
                        alt={img.name}
                        className="rounded"
                        style={{ width: 48, height: 60, objectFit: 'cover' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-ui text-xs text-text-primary truncate">{img.name}</p>
                        <p className="font-ui text-[10px] text-text-muted mt-0.5">Style reference {idx + 1} of {c.referenceImages.length}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = c.referenceImages.filter((_, i) => i !== idx);
                          updateConfig({ referenceImages: updated });
                        }}
                        className="text-red hover:opacity-70 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Slide images upload */}
            <div>
              <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
                Slide Images (optional)
              </label>
              <p className="font-ui text-xs text-text-muted mb-3">
                Upload photos to use as slide backgrounds or inline images. These will be layered behind your text.
              </p>
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border-light rounded-xl cursor-pointer hover:border-brown transition-colors bg-cream/40">
                <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-ui text-sm text-text-muted">Drop images here or click to upload</span>
                <input type="file" accept="image/*" multiple onChange={handleCarouselImageUpload} className="hidden" />
              </label>

              {c.slideImages.length > 0 && (
                <div className="mt-3 space-y-2">
                  {c.slideImages.map((img, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-border-light">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:image/jpeg;base64,${img.base64}`}
                        alt={img.name}
                        className="w-12 h-15 object-cover rounded"
                        style={{ width: 48, height: 60 }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-ui text-xs text-text-primary truncate">{img.name}</p>
                        <button
                          type="button"
                          onClick={() => toggleImageUsage(idx)}
                          className="font-ui text-[10px] text-brown hover:underline mt-0.5"
                        >
                          {img.usage === 'background' ? '🖼 Background' : '📷 Inline'} — tap to switch
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCarouselImage(idx)}
                        className="text-red hover:opacity-70 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'reel': {
        const c = typeConfig.config as ReelConfig;
        return (
          <div className="space-y-5">
            <ToggleGroup label="Duration" options={[{ value: '15', label: '15s' }, { value: '30', label: '30s' }, { value: '60', label: '60s' }, { value: '90', label: '90s' }]} value={c.duration} onChange={(v) => updateConfig({ duration: v as ReelConfig['duration'] })} />
            <RadioGroup label="Hook style" options={[{ value: 'bold-statement', label: 'Bold statement' }, { value: 'question', label: 'Question' }, { value: 'controversial', label: 'Controversial take' }, { value: 'relatable', label: 'Relatable moment' }, { value: 'stat', label: 'Stat / fact' }]} value={c.hookStyle} onChange={(v) => updateConfig({ hookStyle: v as ReelConfig['hookStyle'] })} />
            <RadioGroup label="Format" options={[{ value: 'talk-to-camera', label: 'Talk to camera' }, { value: 'voiceover', label: 'Voiceover / B-roll' }, { value: 'text-only', label: 'Text on screen only' }]} value={c.format} onChange={(v) => updateConfig({ format: v as ReelConfig['format'] })} />
            <RadioGroup label="Platform" options={[{ value: 'instagram', label: 'Instagram Reels' }, { value: 'tiktok', label: 'TikTok' }, { value: 'youtube-shorts', label: 'YouTube Shorts' }]} value={c.platform} onChange={(v) => updateConfig({ platform: v as ReelConfig['platform'] })} />
          </div>
        );
      }
      case 'static-image': {
        const c = typeConfig.config as StaticImageConfig;
        return (
          <div className="space-y-5">
            <RadioGroup label="Image purpose" options={[{ value: 'announcement', label: 'Announcement' }, { value: 'quote', label: 'Quote' }, { value: 'promotion', label: 'Promotion / Offer' }, { value: 'event', label: 'Event' }, { value: 'testimonial', label: 'Testimonial' }]} value={c.imagePurpose} onChange={(v) => updateConfig({ imagePurpose: v as StaticImageConfig['imagePurpose'] })} />
            <RadioGroup label="Format" options={[{ value: '1:1', label: 'Square (1:1)' }, { value: '4:5', label: 'Portrait (4:5)' }, { value: '9:16', label: 'Story (9:16)' }, { value: '16:9', label: 'Landscape (16:9)' }]} value={c.format} onChange={(v) => updateConfig({ format: v as StaticImageConfig['format'] })} />
            <TextField label="Text to feature" value={c.textToFeature} onChange={(v) => updateConfig({ textToFeature: v })} placeholder="Paste the exact headline or quote you want on this image" multiline />
            {/* Canva integration removed */}
          </div>
        );
      }
      case 'email-sequence': {
        const c = typeConfig.config as EmailSequenceConfig;
        return (
          <div className="space-y-5">
            <RadioGroup label="Sequence goal" options={[{ value: 'nurture', label: 'Nurture / educate' }, { value: 'launch', label: 'Launch / sell' }, { value: 'welcome', label: 'Welcome / onboard' }, { value: 're-engagement', label: 'Re-engagement' }, { value: 'post-webinar', label: 'Post-webinar follow-up' }]} value={c.sequenceGoal} onChange={(v) => updateConfig({ sequenceGoal: v as EmailSequenceConfig['sequenceGoal'] })} />
            <NumberField label="Number of emails" value={c.emailCount} onChange={(v) => updateConfig({ emailCount: v })} min={2} max={10} />
            <TextField label="Send cadence" value={c.sendCadence} onChange={(v) => updateConfig({ sendCadence: v })} placeholder="e.g. Day 0, Day 2, Day 4, Day 7" />
            <TextField label="Offer / CTA" value={c.offer} onChange={(v) => updateConfig({ offer: v })} placeholder="What is the email sequence selling or driving toward?" />
          </div>
        );
      }
      case 'ad-creative': {
        const c = typeConfig.config as AdCreativeConfig;
        return (
          <div className="space-y-5">
            <MultiSelect label="Platforms" options={[{ value: 'facebook', label: 'Facebook' }, { value: 'instagram', label: 'Instagram' }, { value: 'google', label: 'Google' }, { value: 'linkedin', label: 'LinkedIn' }, { value: 'tiktok', label: 'TikTok' }]} value={c.platforms} onChange={(v) => updateConfig({ platforms: v })} />
            <RadioGroup label="Ad format" options={[{ value: 'single-image', label: 'Single image ad' }, { value: 'video', label: 'Video ad script' }, { value: 'carousel', label: 'Carousel ad' }, { value: 'story', label: 'Story ad' }]} value={c.adFormat} onChange={(v) => updateConfig({ adFormat: v as AdCreativeConfig['adFormat'] })} />
            <RadioGroup label="Objective" options={[{ value: 'awareness', label: 'Awareness' }, { value: 'lead-gen', label: 'Lead gen' }, { value: 'conversion', label: 'Conversion / Sales' }]} value={c.objective} onChange={(v) => updateConfig({ objective: v as AdCreativeConfig['objective'] })} />
            <SliderField label="Number of variations" min={1} max={5} value={c.variationCount} onChange={(v) => updateConfig({ variationCount: v })} />
          </div>
        );
      }
      case 'caption': {
        const c = typeConfig.config as CaptionConfig;
        return (
          <div className="space-y-5">
            <RadioGroup label="Platform" options={[{ value: 'instagram', label: 'Instagram' }, { value: 'linkedin', label: 'LinkedIn' }, { value: 'facebook', label: 'Facebook' }, { value: 'twitter', label: 'Twitter/X' }, { value: 'tiktok', label: 'TikTok' }]} value={c.platform} onChange={(v) => updateConfig({ platform: v as CaptionConfig['platform'] })} />
            <RadioGroup label="Post type" options={[{ value: 'informational', label: 'Informational' }, { value: 'promotional', label: 'Promotional' }, { value: 'engagement', label: 'Engagement / Question' }, { value: 'behind-the-scenes', label: 'Behind the scenes' }, { value: 'testimonial', label: 'Testimonial share' }]} value={c.postType} onChange={(v) => updateConfig({ postType: v as CaptionConfig['postType'] })} />
            <CheckboxField label="Include hashtags" checked={c.includeHashtags} onChange={(v) => updateConfig({ includeHashtags: v })} />
            <CheckboxField label="Include CTA" checked={c.includeCta} onChange={(v) => updateConfig({ includeCta: v })} />
          </div>
        );
      }
      case 'transcript': {
        const c = typeConfig.config as TranscriptConfig;
        const counts = c.outputCounts || {};
        const totalPieces = Object.values(counts).reduce((sum, n) => sum + (Number(n) || 0), 0);
        const formatRows: { key: import('@/types').TranscriptFormat; label: string; hint: string }[] = [
          { key: 'carousel', label: 'Carousel', hint: 'Multi-slide IG carousel' },
          { key: 'reel', label: 'Reel Script', hint: 'Hook · Script · CTA · Caption' },
          { key: 'caption', label: 'Caption', hint: 'Single social post' },
          { key: 'newsletter', label: 'Newsletter section', hint: 'Section ready to drop in' },
          { key: 'email', label: 'Email', hint: 'Subject · Preheader · Body · CTA' },
          { key: 'summary', label: 'Summary doc', hint: 'Narrative summary in their voice' },
        ];
        const setCount = (k: import('@/types').TranscriptFormat, n: number) => {
          const next = { ...counts, [k]: Math.max(0, Math.min(10, n)) };
          updateConfig({ outputCounts: next });
        };
        return (
          <div className="space-y-5">
            <div>
              <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
                How many of each piece?
              </label>
              <p className="font-ui text-xs text-text-muted mb-3">
                Pick a count per format. Each piece will be different — different hook and different angle — but every word stays in the speaker&apos;s voice.
              </p>
              <div className="space-y-2">
                {formatRows.map((row) => {
                  const value = Number(counts[row.key] || 0);
                  return (
                    <div key={row.key} className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white rounded-xl border border-border-light">
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
              <p className="font-ui text-xs text-text-muted mt-2">
                {totalPieces === 0
                  ? 'Pick at least one piece to generate.'
                  : `Total: ${totalPieces} piece${totalPieces === 1 ? '' : 's'} — each generated separately and ready to copy.`}
              </p>
            </div>

            <TextField label="Key themes to extract (optional)" value={c.keyThemes} onChange={(v) => updateConfig({ keyThemes: v })} placeholder="Any specific points or moments you want prioritised?" multiline />
          </div>
        );
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border-light p-6 lg:p-8">
      <h2 className="font-display text-2xl font-bold text-text-primary mb-1">
        Configure
      </h2>
      <p className="font-ui text-sm text-text-muted mb-6">
        Set up the details for your {contentType.replace('-', ' ')}
      </p>

      {deliverableNotes && (
        <div className="mb-6 p-3 bg-cream/60 rounded-lg border border-border-light flex items-start gap-2">
          <svg className="w-4 h-4 text-brown mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-ui text-xs text-text-secondary">{deliverableNotes}</p>
        </div>
      )}

      <div className="space-y-6 max-w-3xl">
        {!isTranscript && (
          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
              What is this content about?
            </label>

            {/* Audio + doc-link ingestion bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <label
                className={`flex items-center gap-2 px-3 py-2 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  topicTranscribing === 'audio' ? 'border-brown bg-brown/5' : 'border-border-light hover:border-brown bg-cream/40'
                }`}
              >
                <svg className="w-4 h-4 text-brown flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-14 0m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="font-ui text-xs text-text-secondary truncate">
                  {topicTranscribing === 'audio' ? 'Transcribing audio…' : 'Upload audio or video'}
                </span>
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleTopicAudioUpload}
                  className="hidden"
                  disabled={topicTranscribing !== null}
                />
              </label>
              <div className="flex items-center gap-2 px-3 py-2 border border-border-light rounded-xl bg-white focus-within:border-brown focus-within:ring-1 focus-within:ring-brown/20">
                <svg className="w-4 h-4 text-brown flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 015.656 0l1.415 1.415a4 4 0 010 5.656l-3.535 3.535a4 4 0 01-5.657 0l-1.414-1.414m-1.414-7.071L7.343 9.171a4 4 0 00-5.657 0L1.272 9.586a4 4 0 000 5.657l3.535 3.535" />
                </svg>
                <input
                  type="url"
                  value={topicDocLink}
                  onChange={(e) => setTopicDocLink(e.target.value)}
                  placeholder="Paste a Google Doc or web link"
                  className="flex-1 min-w-0 font-ui text-xs bg-transparent focus:outline-none placeholder:text-text-muted"
                  disabled={topicTranscribing !== null}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && topicDocLink.trim() && topicTranscribing === null) {
                      e.preventDefault();
                      handleTopicDocFetch();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleTopicDocFetch}
                  disabled={!topicDocLink.trim() || topicTranscribing !== null}
                  className="font-ui text-xs font-semibold text-brown hover:underline disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {topicTranscribing === 'doc' ? 'Reading…' : 'Fetch'}
                </button>
              </div>
            </div>
            {topicTranscribeError && (
              <p className="font-ui text-xs text-red mb-2">{topicTranscribeError}</p>
            )}
            {topicTranscribeSource && !topicTranscribeError && (
              <p className="font-ui text-xs text-green mb-2">
                Pulled content from <span className="font-medium">{topicTranscribeSource}</span> — review and edit below.
              </p>
            )}

            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Be specific. Include the key message, offer, or story angle. Or use the upload bar above to pull from audio or a doc."
              rows={topicTranscribeSource ? 10 : 4}
              className="w-full px-4 py-3 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 resize-y bg-white leading-relaxed"
            />
          </div>
        )}

        {isTranscript && typeConfig.type === 'transcript' && (() => {
          const c = typeConfig.config as TranscriptConfig;
          const transcriptText = c.transcriptText || '';
          const wordCount = transcriptText.trim() ? transcriptText.trim().split(/\s+/).length : 0;
          const handleTranscriptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
              const text = await file.text();
              updateConfig({ transcriptText: text });
            }
          };
          return (
            <div>
              <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
                Paste the full transcript
              </label>
              <p className="font-ui text-xs text-text-muted mb-2">
                Paste the entire transcript from a masterclass, podcast, voice note, or call. The AI studies the speaker&apos;s tone, pulls verbatim quotes, and rebuilds your selected pieces in their voice — not in AI-speak.
              </p>
              <textarea
                value={transcriptText}
                onChange={(e) => updateConfig({ transcriptText: e.target.value })}
                placeholder="Paste the transcript here. The longer and more raw it is, the better — keep filler words, repeats, and quirks intact. They are the voice."
                rows={16}
                className="w-full px-4 py-3 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 resize-y bg-white leading-relaxed"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="font-ui text-xs text-text-muted">
                  {wordCount.toLocaleString()} word{wordCount === 1 ? '' : 's'}
                  {wordCount > 0 && wordCount < 200 && ' — short transcript, voice analysis may be thin'}
                </span>
                <label className="font-ui text-xs text-brown cursor-pointer hover:underline">
                  Or upload a .txt file
                  <input type="file" accept=".txt,text/plain" onChange={handleTranscriptUpload} className="hidden" />
                </label>
              </div>
            </div>
          );
        })()}

        {showInspiration && (
          <InspirationDropzone files={inspirationFiles} onFilesChange={setInspirationFiles} inspirationUrl={inspirationUrl} onUrlChange={setInspirationUrl} />
        )}

        <div>
          <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
            Brand Voice
          </label>
          <div className="flex gap-2">
            <select
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              className="flex-1 px-4 py-3 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 bg-white appearance-none cursor-pointer"
            >
              <option value="default">Keep client default</option>
              {savedVoices.length > 0 &&
                (() => {
                  const groups = Array.from(new Set(savedVoices.map((sv) => sv.group)));
                  return groups.map((group) => (
                    <optgroup key={group} label={group}>
                      {savedVoices
                        .filter((sv) => sv.group === group)
                        .map((sv) => (
                          <option key={sv.id} value={sv.id}>
                            {sv.name}
                          </option>
                        ))}
                    </optgroup>
                  ));
                })()}
            </select>
            {brandVoice !== 'default' && (
              <>
                <button
                  type="button"
                  onClick={() => setEditingVoice(savedVoices.find((sv) => sv.id === brandVoice) || null)}
                  className="px-3 py-3 border border-border-light rounded-xl font-ui text-sm text-text-secondary hover:bg-cream-dark hover:text-brown transition-colors flex-shrink-0"
                  title="Edit voice"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingVoiceId(brandVoice)}
                  className="px-3 py-3 border border-border-light rounded-xl font-ui text-sm text-text-secondary hover:bg-red/10 hover:text-red hover:border-red/30 transition-colors flex-shrink-0"
                  title="Delete voice"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setShowVoiceUpload(true)}
              className="px-4 py-3 border border-border-light rounded-xl font-ui text-sm text-brown hover:bg-cream-dark transition-colors flex-shrink-0"
              title="Upload new brand voice"
            >
              + New
            </button>
          </div>
        </div>

        {/* Delete confirmation */}
        {deletingVoiceId && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDeletingVoiceId(null)}>
            <div className="bg-white rounded-2xl border border-border-light max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-display text-lg font-bold text-text-primary mb-2">Delete Brand Voice?</h3>
              <p className="font-ui text-sm text-text-secondary mb-5">
                This will permanently remove <strong>{savedVoices.find((sv) => sv.id === deletingVoiceId)?.name}</strong> from all projects.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    await fetch(`/api/brand-voices?id=${deletingVoiceId}`, { method: 'DELETE' });
                    setBrandVoice('default');
                    setDeletingVoiceId(null);
                    loadSavedVoices();
                  }}
                  className="flex-1 px-4 py-2.5 bg-red text-white font-ui font-semibold text-sm rounded-full hover:opacity-90 transition-all"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeletingVoiceId(null)}
                  className="flex-1 px-4 py-2.5 border border-border-light text-text-secondary font-ui font-semibold text-sm rounded-full hover:border-border transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit modal */}
        {editingVoice && (
          <BrandVoiceEditModal
            voice={editingVoice}
            onClose={() => setEditingVoice(null)}
            onSaved={() => { setEditingVoice(null); loadSavedVoices(); }}
          />
        )}

        {showVoiceUpload && (
          <BrandVoiceUploadModal
            onClose={() => setShowVoiceUpload(false)}
            onSaved={loadSavedVoices}
          />
        )}

        <RadioGroup
          label="Tone override"
          options={[
            { value: 'default', label: 'Keep client default' },
            { value: 'More conversational', label: 'More conversational' },
            { value: 'More authoritative', label: 'More authoritative' },
            { value: 'More emotional', label: 'More emotional' },
            { value: 'More direct / punchy', label: 'More direct / punchy' },
            { value: 'Educational / informative', label: 'Educational / informative' },
          ]}
          value={toneOverride}
          onChange={setToneOverride}
        />

        <div className="border-t border-border-light pt-6">
          <h3 className="font-ui font-semibold text-sm text-text-primary mb-4">
            {contentType.replace('-', ' ').charAt(0).toUpperCase() + contentType.replace('-', ' ').slice(1)} Settings
          </h3>
          {renderTypeFields()}
        </div>

        <div className="pt-4">
          {!hasInspiration && showInspiration && !isTranscript && (
            <p className="font-ui text-sm text-orange mb-3">
              Drop at least one inspiration reference before generating — even a
              rough screenshot helps the AI understand the vibe you&apos;re going for.
            </p>
          )}
          {isTranscript && !canGenerate && (
            <p className="font-ui text-sm text-orange mb-3">
              Paste a transcript and choose at least one output format to generate.
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
            Generate Content
          </button>
        </div>
      </div>
    </div>
  );
}
