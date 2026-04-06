'use client';

import { useState } from 'react';
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
      <label className="font-ui text-xs font-semibold tracking-wider text-grey-mid uppercase mb-2 block">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 font-ui text-sm border transition-all ${
              value === opt.value
                ? 'bg-black text-yellow border-black'
                : 'bg-white text-black border-grey-light hover:border-grey-mid'
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
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-yellow"
      />
      <span className="font-ui text-sm">{label}</span>
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
      <label className="font-ui text-xs font-semibold tracking-wider text-grey-mid uppercase mb-2 block">
        {label}: <span className="text-black">{value}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-yellow"
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
      <label className="font-ui text-xs font-semibold tracking-wider text-grey-mid uppercase mb-2 block">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 border border-grey-light font-ui text-sm focus:outline-none focus:border-yellow resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-grey-light font-ui text-sm focus:outline-none focus:border-yellow"
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
      <label className="font-ui text-xs font-semibold tracking-wider text-grey-mid uppercase mb-2 block">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        className="w-24 px-3 py-2 border border-grey-light font-ui text-sm focus:outline-none focus:border-yellow"
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
      <label className="font-ui text-xs font-semibold tracking-wider text-grey-mid uppercase mb-2 block">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`px-4 py-2 font-ui text-sm border transition-all ${
              value.includes(opt.value)
                ? 'bg-black text-yellow border-black'
                : 'bg-white text-black border-grey-light hover:border-grey-mid'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Defaults for each type
function getDefaultConfig(type: ContentType): TypeSpecificConfig {
  switch (type) {
    case 'newsletter':
      return {
        type: 'newsletter',
        config: { subjectLineAngle: '', sectionCount: 3, cta: '', length: 'medium' },
      };
    case 'carousel':
      return {
        type: 'carousel',
        config: { slideCount: 8, slideFormat: 'tips', ctaSlide: true, canvaOutput: true, referenceImages: [] },
      };
    case 'reel':
      return {
        type: 'reel',
        config: { duration: '30', hookStyle: 'bold-statement', format: 'talk-to-camera', platform: 'instagram' },
      };
    case 'static-image':
      return {
        type: 'static-image',
        config: { imagePurpose: 'announcement', format: '4:5', textToFeature: '', canvaOutput: true },
      };
    case 'email-sequence':
      return {
        type: 'email-sequence',
        config: { sequenceGoal: 'nurture', emailCount: 5, sendCadence: 'Day 0, Day 2, Day 4, Day 7, Day 10', offer: '' },
      };
    case 'ad-creative':
      return {
        type: 'ad-creative',
        config: { platforms: ['facebook'], adFormat: 'single-image', objective: 'lead-gen', variationCount: 3 },
      };
    case 'caption':
      return {
        type: 'caption',
        config: { platform: 'instagram', postType: 'informational', includeHashtags: true, includeCta: true },
      };
    case 'transcript':
      return {
        type: 'transcript',
        config: { outputFormats: ['carousel', 'caption'], keyThemes: '' },
      };
  }
}

export default function ConfigForm({ contentType, client, onGenerate }: Props) {
  const [topic, setTopic] = useState('');
  const [toneOverride, setToneOverride] = useState('default');
  const [inspirationFiles, setInspirationFiles] = useState<InspirationFile[]>([]);
  const [inspirationUrl, setInspirationUrl] = useState('');
  const [typeConfig, setTypeConfig] = useState<TypeSpecificConfig>(
    getDefaultConfig(contentType)
  );

  const hasInspiration = inspirationFiles.length > 0 || inspirationUrl.trim().length > 0;
  const hasTopic = topic.trim().length > 0;
  const canGenerate = hasInspiration && hasTopic;

  const handleGenerate = () => {
    if (!canGenerate) return;
    const universal: UniversalConfig = {
      topic,
      toneOverride: toneOverride === 'default' ? client.tone : toneOverride,
      inspirationFiles,
      inspirationUrl: inspirationUrl || undefined,
    };
    onGenerate(universal, typeConfig);
  };

  const updateConfig = <T extends TypeSpecificConfig['config']>(
    updates: Partial<T>
  ) => {
    setTypeConfig((prev) => ({
      ...prev,
      config: { ...prev.config, ...updates },
    } as TypeSpecificConfig));
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
            <InspirationDropzone
              files={c.transcriptFile ? [c.transcriptFile] : []}
              onFilesChange={(files) =>
                updateConfig({ transcriptFile: files[0] || undefined })
              }
              inspirationUrl=""
              onUrlChange={() => {}}
              label="Upload your masterclass or session transcript"
              accept={{
                'text/plain': ['.txt'],
                'application/pdf': ['.pdf'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
              }}
              maxSize={20 * 1024 * 1024}
            />
            <MultiSelect
              label="Output formats"
              options={[
                { value: 'carousel', label: 'Carousel' },
                { value: 'reel', label: 'Reel Script' },
                { value: 'caption', label: 'Caption' },
                { value: 'newsletter', label: 'Newsletter section' },
                { value: 'email', label: 'Email' },
                { value: 'summary', label: 'Summary doc' },
              ]}
              value={c.outputFormats}
              onChange={(v) => updateConfig({ outputFormats: v })}
            />
            <TextField label="Key themes to extract" value={c.keyThemes} onChange={(v) => updateConfig({ keyThemes: v })} placeholder="Any specific points or moments you want prioritised?" multiline />
          </div>
        );
      }
    }
  };

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wide mb-1">
        CONFIGURE
      </h2>
      <p className="font-ui text-sm text-grey-mid mb-6">
        Set up the details for your {contentType.replace('-', ' ')}
      </p>

      <div className="space-y-6 max-w-3xl">
        {/* Universal fields */}
        <TextField
          label="What is this content about?"
          value={topic}
          onChange={setTopic}
          placeholder="Be specific. Include the key message, offer, or story angle."
          multiline
        />

        <InspirationDropzone
          files={inspirationFiles}
          onFilesChange={setInspirationFiles}
          inspirationUrl={inspirationUrl}
          onUrlChange={setInspirationUrl}
        />

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

        {/* Divider */}
        <div className="border-t border-grey-light pt-6">
          <h3 className="font-display text-lg tracking-wide mb-4">
            {contentType.replace('-', ' ').toUpperCase()} SETTINGS
          </h3>
          {renderTypeFields()}
        </div>

        {/* Generate button */}
        <div className="pt-4">
          {!hasInspiration && (
            <p className="font-ui text-sm text-red mb-3">
              Drop at least one inspiration reference before generating — even a
              rough screenshot helps the AI understand the vibe you&apos;re going for.
            </p>
          )}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`w-full sm:w-auto px-12 py-4 font-display text-xl tracking-widest transition-all ${
              canGenerate
                ? 'bg-black text-yellow hover:bg-yellow hover:text-black'
                : 'bg-grey-light text-grey-mid cursor-not-allowed'
            }`}
          >
            GENERATE
          </button>
        </div>
      </div>
    </div>
  );
}
