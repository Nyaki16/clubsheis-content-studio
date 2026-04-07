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
      return { type: 'newsletter', config: { subjectLineAngle: '', sectionCount: 3, cta: '', length: 'medium' } };
    case 'carousel':
      return { type: 'carousel', config: { slideCount: 8, slideFormat: 'tips', ctaSlide: true, canvaOutput: true, referenceImages: [] } };
    case 'reel':
      return { type: 'reel', config: { duration: '30', hookStyle: 'bold-statement', format: 'talk-to-camera', platform: 'instagram' } };
    case 'static-image':
      return { type: 'static-image', config: { imagePurpose: 'announcement', format: '4:5', textToFeature: '', canvaOutput: true } };
    case 'email-sequence':
      return { type: 'email-sequence', config: { sequenceGoal: 'nurture', emailCount: 5, sendCadence: 'Day 0, Day 2, Day 4, Day 7, Day 10', offer: '' } };
    case 'ad-creative':
      return { type: 'ad-creative', config: { platforms: ['facebook'], adFormat: 'single-image', objective: 'lead-gen', variationCount: 3 } };
    case 'caption':
      return { type: 'caption', config: { platform: 'instagram', postType: 'informational', includeHashtags: true, includeCta: true } };
    case 'transcript':
      return { type: 'transcript', config: { outputFormats: ['carousel', 'caption'], keyThemes: '' } };
  }
}

// Only saved/uploaded brand voices appear — no hardcoded list

// Content types that don't need inspiration images
const NO_INSPIRATION_TYPES: ContentType[] = ['newsletter', 'email-sequence', 'transcript'];

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

export default function ConfigForm({ contentType, client, onGenerate }: Props) {
  const [topic, setTopic] = useState('');
  const [toneOverride, setToneOverride] = useState('default');
  const [brandVoice, setBrandVoice] = useState('default');
  const [inspirationFiles, setInspirationFiles] = useState<InspirationFile[]>([]);
  const [inspirationUrl, setInspirationUrl] = useState('');
  const [typeConfig, setTypeConfig] = useState<TypeSpecificConfig>(getDefaultConfig(contentType));
  const [showVoiceUpload, setShowVoiceUpload] = useState(false);
  const [editingVoice, setEditingVoice] = useState<SavedBrandVoice | null>(null);
  const [deletingVoiceId, setDeletingVoiceId] = useState<string | null>(null);
  const [savedVoices, setSavedVoices] = useState<SavedBrandVoice[]>([]);

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
  const canGenerate = hasInspiration && hasTopic;

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

    const universal: UniversalConfig = {
      topic,
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
        return (
          <div className="space-y-5">
            <TextField label="Subject line angle" value={c.subjectLineAngle} onChange={(v) => updateConfig({ subjectLineAngle: v })} placeholder="What's the hook for this edition?" />
            <NumberField label="Section count" value={c.sectionCount} onChange={(v) => updateConfig({ sectionCount: v })} min={1} max={5} />
            <TextField label="CTA" value={c.cta} onChange={(v) => updateConfig({ cta: v })} placeholder="What do you want the reader to do?" />
            <ToggleGroup label="Length" options={[{ value: 'short', label: 'Short (~400 words)' }, { value: 'medium', label: 'Medium (~700 words)' }, { value: 'long', label: 'Long (~1000 words)' }]} value={c.length} onChange={(v) => updateConfig({ length: v as NewsletterConfig['length'] })} />
          </div>
        );
      }
      case 'carousel': {
        const c = typeConfig.config as CarouselConfig;
        return (
          <div className="space-y-5">
            <SliderField label="Number of slides" min={3} max={12} value={c.slideCount} onChange={(v) => updateConfig({ slideCount: v })} />
            <RadioGroup label="Slide format" options={[{ value: 'tips', label: 'Tips / List' }, { value: 'story', label: 'Story / Narrative' }, { value: 'before-after', label: 'Before & After' }, { value: 'how-to', label: 'How To / Steps' }, { value: 'quote', label: 'Quote-driven' }]} value={c.slideFormat} onChange={(v) => updateConfig({ slideFormat: v as CarouselConfig['slideFormat'] })} />
            <CheckboxField label="Include a CTA slide at the end" checked={c.ctaSlide} onChange={(v) => updateConfig({ ctaSlide: v })} />
            <CheckboxField label="Also create in Canva" checked={c.canvaOutput} onChange={(v) => updateConfig({ canvaOutput: v })} />
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
            <CheckboxField label="Create in Canva" checked={c.canvaOutput} onChange={(v) => updateConfig({ canvaOutput: v })} />
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
        return (
          <div className="space-y-5">
            <InspirationDropzone files={c.transcriptFile ? [c.transcriptFile] : []} onFilesChange={(files) => updateConfig({ transcriptFile: files[0] || undefined })} inspirationUrl="" onUrlChange={() => {}} label="Upload your masterclass or session transcript" accept={{ 'text/plain': ['.txt'], 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }} maxSize={20 * 1024 * 1024} />
            <MultiSelect label="Output formats" options={[{ value: 'carousel', label: 'Carousel' }, { value: 'reel', label: 'Reel Script' }, { value: 'caption', label: 'Caption' }, { value: 'newsletter', label: 'Newsletter section' }, { value: 'email', label: 'Email' }, { value: 'summary', label: 'Summary doc' }]} value={c.outputFormats} onChange={(v) => updateConfig({ outputFormats: v })} />
            <TextField label="Key themes to extract" value={c.keyThemes} onChange={(v) => updateConfig({ keyThemes: v })} placeholder="Any specific points or moments you want prioritised?" multiline />
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

      <div className="space-y-6 max-w-3xl">
        <TextField label="What is this content about?" value={topic} onChange={setTopic} placeholder="Be specific. Include the key message, offer, or story angle." multiline />

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
          {!hasInspiration && showInspiration && (
            <p className="font-ui text-sm text-orange mb-3">
              Drop at least one inspiration reference before generating — even a
              rough screenshot helps the AI understand the vibe you&apos;re going for.
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
