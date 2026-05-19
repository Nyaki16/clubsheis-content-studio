'use client';

import { useState, useMemo, useEffect } from 'react';
import { GeneratedOutput } from '@/types';
import { downloadPdf, downloadTxt, copyToClipboard, stripJsonFormatting } from '@/lib/download';
import CarouselRenderer, { CarouselSlide, StyleSettings, ReferenceStyle } from './CarouselRenderer';
import NewsletterRenderer, { NewsletterData } from './NewsletterRenderer';

// Font options for the selector
const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: "'Bebas Neue', sans-serif", label: 'Bebas Neue' },
  { value: "'Barlow Condensed', sans-serif", label: 'Barlow Condensed' },
  { value: "'Playfair Display', serif", label: 'Playfair Display' },
  { value: "'Montserrat', sans-serif", label: 'Montserrat' },
  { value: "'Oswald', sans-serif", label: 'Oswald' },
  { value: "'Poppins', sans-serif", label: 'Poppins' },
  { value: "'Inter', sans-serif", label: 'Inter' },
  { value: "'Lora', serif", label: 'Lora' },
  { value: "'Raleway', sans-serif", label: 'Raleway' },
  { value: "'DM Sans', sans-serif", label: 'DM Sans' },
  { value: "'Space Grotesk', sans-serif", label: 'Space Grotesk' },
  { value: "Georgia, serif", label: 'Georgia' },
];

// Preset style definitions that map to actual visual styles
const PRESET_STYLES: Record<string, ReferenceStyle> = {
  'clean-minimal': {
    backgroundColor: '#FFFFFF',
    backgroundPattern: 'none',
    textColor: '#2D2D2D',
    headlineColor: '#1a1a1a',
    accentColor: '#2D2D2D',
    highlightStyle: 'underline',
    ctaColor: '#1a1a1a',
    headlineFont: "'Montserrat', sans-serif",
    bodyFont: "'Inter', sans-serif",
  },
  'bold-punchy': {
    backgroundColor: '#1a1a1a',
    backgroundPattern: 'none',
    textColor: '#FFFFFF',
    headlineColor: '#FFFFFF',
    accentColor: '#FF4444',
    highlightStyle: 'box',
    ctaColor: '#FF4444',
    headlineFont: "'Oswald', sans-serif",
    bodyFont: "'Poppins', sans-serif",
  },
  'soft-editorial': {
    backgroundColor: '#F5F0EB',
    backgroundPattern: 'none',
    textColor: '#4A3728',
    headlineColor: '#2D1810',
    accentColor: '#C8956C',
    highlightStyle: 'none',
    ctaColor: '#7B4B2A',
    headlineFont: "'Playfair Display', serif",
    bodyFont: "'Lora', serif",
  },
  'dark-moody': {
    backgroundColor: '#1C1C1E',
    backgroundPattern: 'grid',
    textColor: '#E8C4C8',
    headlineColor: '#FFFFFF',
    accentColor: '#C8FF00',
    highlightStyle: 'box',
    ctaColor: '#C8FF00',
    headlineFont: "'Bebas Neue', sans-serif",
    bodyFont: "'Barlow Condensed', sans-serif",
  },
  'playful-colourful': {
    backgroundColor: '#FFF2E6',
    backgroundPattern: 'dots',
    textColor: '#333333',
    headlineColor: '#E84393',
    accentColor: '#6C5CE7',
    highlightStyle: 'box',
    ctaColor: '#E84393',
    headlineFont: "'Space Grotesk', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
  },
};

interface Props {
  output: GeneratedOutput;
  onRegenerate: () => void;
  onStartNew: () => void;
  onChangeClient: () => void;
}

const STYLE_PRESETS: { value: string; label: string }[] = [
  { value: 'clean-minimal', label: 'Clean & Minimal' },
  { value: 'bold-punchy', label: 'Bold & Punchy' },
  { value: 'soft-editorial', label: 'Soft & Editorial' },
  { value: 'dark-moody', label: 'Dark & Moody' },
  { value: 'playful-colourful', label: 'Playful & Colourful' },
];

export default function OutputPanel({
  output,
  onRegenerate,
  onStartNew,
  onChangeClient,
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showGhlModal, setShowGhlModal] = useState(false);
  const [ghlStatus, setGhlStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [ghlResult, setGhlResult] = useState<{ ghlUrl?: string; ghlTemplatesUrl?: string; previewUrl?: string; message?: string; error?: string; dataDebug?: string; editorType?: string } | null>(null);

  // Copy approval state for carousels
  const [copyApproved, setCopyApproved] = useState(false);
  const [reviewSlides, setReviewSlides] = useState<CarouselSlide[] | null>(null);

  // Style panel state
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [styleRefImage, setStyleRefImage] = useState<string | null>(null);
  const [styleRefName, setStyleRefName] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [overlayOpacity, setOverlayOpacity] = useState<'light' | 'medium' | 'heavy'>('medium');
  const [textAlignment, setTextAlignment] = useState<'left' | 'bottom-left' | 'centered'>('left');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [appliedStyle, setAppliedStyle] = useState<StyleSettings | undefined>(undefined);
  const [appliedPresetStyle, setAppliedPresetStyle] = useState<ReferenceStyle | undefined>(undefined);

  // Custom colour/font state
  const [customBgColor, setCustomBgColor] = useState('#1C1C1E');
  const [customTextColor, setCustomTextColor] = useState('#FFFFFF');
  const [customHeadlineColor, setCustomHeadlineColor] = useState('#FFFFFF');
  const [customAccentColor, setCustomAccentColor] = useState('#C8FF00');
  const [customCtaColor, setCustomCtaColor] = useState('#C8FF00');
  const [customHeadlineFont, setCustomHeadlineFont] = useState("'Bebas Neue', sans-serif");
  const [customBodyFont, setCustomBodyFont] = useState("'Barlow Condensed', sans-serif");
  const [customPattern, setCustomPattern] = useState<'none' | 'grid' | 'dots' | 'lines'>('none');
  const [customHighlight, setCustomHighlight] = useState<'none' | 'box' | 'underline'>('none');

  // Caption generation state
  const [caption, setCaption] = useState('');
  const [captionLoading, setCaptionLoading] = useState(false);
  const [captionError, setCaptionError] = useState('');
  const [showCaptionPanel, setShowCaptionPanel] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);

  // AI image generation state
  const [imageGenLoading, setImageGenLoading] = useState(false);
  const [imageGenProgress, setImageGenProgress] = useState('');
  const [generatedSlideImages, setGeneratedSlideImages] = useState<{ base64: string; name: string; usage: 'background' | 'inline' }[]>([]);

  const displayContent = output.rawJson
    ? stripJsonFormatting(output.rawJson)
    : output.content;

  // Parse carousel slides and optional style from JSON output
  interface RefStyle {
    backgroundColor?: string;
    backgroundPattern?: 'none' | 'grid' | 'dots' | 'lines';
    textColor?: string;
    headlineColor?: string;
    accentColor?: string;
    highlightStyle?: 'none' | 'box' | 'underline';
    ctaColor?: string;
  }

  const { carouselSlides, refStyle } = useMemo<{ carouselSlides: CarouselSlide[] | null; refStyle: RefStyle | null }>(() => {
    if (output.contentType !== 'carousel' || !output.rawJson) return { carouselSlides: null, refStyle: null };
    try {
      const parsed = JSON.parse(output.rawJson);
      // New format: { style: {...}, slides: [...] }
      if (parsed && !Array.isArray(parsed) && parsed.slides && Array.isArray(parsed.slides)) {
        return {
          carouselSlides: parsed.slides as CarouselSlide[],
          refStyle: parsed.style || null,
        };
      }
      // Old format: plain array
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
        return { carouselSlides: parsed as CarouselSlide[], refStyle: null };
      }
    } catch {
      // Not valid carousel JSON
    }
    return { carouselSlides: null, refStyle: null };
  }, [output.contentType, output.rawJson]);

  const isCarousel = output.contentType === 'carousel' && carouselSlides !== null;

  // Parse newsletter from JSON output
  const parsedNewsletter = useMemo<NewsletterData | null>(() => {
    if (output.contentType !== 'newsletter') return null;
    const source = output.rawJson || output.content;
    try {
      let jsonStr = source;
      const jsonMatch = source.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.subjectLine && Array.isArray(parsed.sections)) {
        return parsed as NewsletterData;
      }
    } catch {
      // Not valid JSON — newsletter will fall back to plain text
    }
    return null;
  }, [output.contentType, output.rawJson, output.content]);

  const isHtmlNewsletter = output.contentType === 'newsletter' && parsedNewsletter !== null;

  // Parse transcript output into individual pieces
  interface TranscriptPiece {
    label: string;
    body: string;
  }
  interface TranscriptOutput {
    voiceAnalysis: string;
    keyMoments: string;
    keyInsights: string;
    pieces: TranscriptPiece[];
  }
  const parsedTranscript = useMemo<TranscriptOutput | null>(() => {
    if (output.contentType !== 'transcript') return null;
    const text = output.content || '';
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
      const body = text.slice(start, end).trim();
      blocks.push({ heading, body });
    }
    const voiceAnalysis = blocks.find((b) => /^VOICE ANALYSIS$/i.test(b.heading))?.body || '';
    const keyMoments = blocks.find((b) => /^KEY MOMENTS$/i.test(b.heading))?.body || '';
    const keyInsights = blocks.find((b) => /^KEY INSIGHTS$/i.test(b.heading))?.body || '';
    const pieces = blocks
      .filter((b) => !/^VOICE ANALYSIS$|^KEY MOMENTS$|^KEY INSIGHTS$/i.test(b.heading))
      .map((b) => ({ label: b.heading, body: b.body }));
    if (pieces.length === 0) return null;
    return { voiceAnalysis, keyMoments, keyInsights, pieces };
  }, [output.contentType, output.content]);

  const isTranscriptOutput = output.contentType === 'transcript' && parsedTranscript !== null;
  const [copiedPieceIdx, setCopiedPieceIdx] = useState<number | null>(null);

  // Reset approval and populate review slides when new output arrives
  useEffect(() => {
    if (carouselSlides) {
      setReviewSlides(carouselSlides.map(s => ({ ...s })));
      setCopyApproved(false);
    }
  }, [carouselSlides]);

  // Format carousel slides as readable text for copy/download
  const carouselTextContent = useMemo(() => {
    if (!carouselSlides) return displayContent;
    return carouselSlides
      .map((s) => {
        if (s.type === 'cover') {
          return `SLIDE ${s.slide} (Cover)\n${s.headline}${s.hashtag ? `\n${s.hashtag}` : ''}`;
        }
        if (s.type === 'cta') {
          return `SLIDE ${s.slide} (CTA)\n${s.greeting || "Hey, I'm"} ${s.name}\n${s.handle}\n${s.ctaText || 'Follow for more'}`;
        }
        const label = s.type === 'content-light' ? 'Light' : 'Dark';
        return `SLIDE ${s.slide} (${label})\n${s.heading}\n${s.body}`;
      })
      .join('\n\n---\n\n');
  }, [carouselSlides, displayContent]);

  const copyableContent = isCarousel ? carouselTextContent : displayContent;

  const handleCopy = async () => {
    await copyToClipboard(copyableContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePdf = () => {
    downloadPdf('output-content', output.clientName, output.contentType);
  };

  const handleTxt = () => {
    downloadTxt(copyableContent, output.clientName, output.contentType);
  };

  const extractSubjectLine = (content: string): string => {
    const match = content.match(/SUBJECT LINE:\s*(.+)/i);
    return match ? match[1].trim() : '';
  };

  const handleSendToGHL = async (templateName: string, subjectLine: string, fromName: string, editorType: 'code' | 'builder') => {
    setGhlStatus('sending');
    setGhlResult(null);

    try {
      const res = await fetch('/api/ghl/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: '',
          clientName: output.clientName,
          content: displayContent,
          subjectLine,
          fromName,
          templateName,
          editorType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGhlStatus('error');
        setGhlResult({ error: data.error });
        return;
      }

      setGhlStatus('success');
      setGhlResult(data);
      setShowGhlModal(false);
    } catch {
      setGhlStatus('error');
      setGhlResult({ error: 'Failed to connect to Ghutte. Try again.' });
    }
  };

  // Style panel handlers
  const handleStyleRefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.readAsDataURL(file);
    });
    setStyleRefImage(base64);
    setStyleRefName(file.name);
  };

  // When a preset is selected, populate custom fields with its values
  const handleSelectPreset = (presetKey: string) => {
    if (selectedPreset === presetKey) {
      setSelectedPreset('');
      return;
    }
    setSelectedPreset(presetKey);
    const ps = PRESET_STYLES[presetKey];
    if (ps) {
      setCustomBgColor(ps.backgroundColor || '#1C1C1E');
      setCustomTextColor(ps.textColor || '#FFFFFF');
      setCustomHeadlineColor(ps.headlineColor || '#FFFFFF');
      setCustomAccentColor(ps.accentColor || '#C8FF00');
      setCustomCtaColor(ps.ctaColor || '#C8FF00');
      setCustomHeadlineFont(ps.headlineFont || "'Bebas Neue', sans-serif");
      setCustomBodyFont(ps.bodyFont || "'Barlow Condensed', sans-serif");
      setCustomPattern(ps.backgroundPattern || 'none');
      setCustomHighlight(ps.highlightStyle || 'none');
    }
  };

  const handleApplyStyle = () => {
    setAppliedStyle({
      overlayOpacity,
      textAlignment,
      fontSize,
      preset: selectedPreset || undefined,
    });
    // Build the reference style from custom values (which may have come from a preset or manual tweaks)
    setAppliedPresetStyle({
      backgroundColor: customBgColor,
      textColor: customTextColor,
      headlineColor: customHeadlineColor,
      accentColor: customAccentColor,
      ctaColor: customCtaColor,
      headlineFont: customHeadlineFont,
      bodyFont: customBodyFont,
      backgroundPattern: customPattern,
      highlightStyle: customHighlight,
    });
    setShowStylePanel(false);
  };

  // Generate a CAKE framework caption from the carousel content
  const handleGenerateCaption = async () => {
    if (!carouselSlides) return;
    setCaptionLoading(true);
    setCaptionError('');
    setShowCaptionPanel(true);

    // Summarise slide content for context
    const slideSummary = carouselSlides
      .filter(s => s.type !== 'cta')
      .map(s => s.headline || s.heading || '')
      .filter(Boolean)
      .join('. ');

    try {
      const res = await fetch('/api/generate/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { name: output.clientName, tone: '' },
          topic: `Write ONE Instagram caption for this carousel post. The carousel covers: ${slideSummary}

STRICT RULES:
- Use the CAKE framework: Call to Action + Agitate the problem + Know the solution + Educate — weave all four into ONE flowing caption (they don't need labels or to be in that order)
- MINIMUM 600 characters. Write a rich, detailed caption — not a one-liner. Expand on the topic with real insight, examples, or a mini-story. Aim for 600-800 characters.
- No hashtags in the caption itself
- Make it punchy, direct, conversational
- End with a clear CTA (e.g. "Save this", "Share with a friend", "Comment below")

Output ONLY the caption text, nothing else. No labels, no quotes, no explanation.`,
          tone: '',
          typeConfig: {
            platform: 'instagram',
            postType: 'informational',
            includeHashtags: false,
            includeCta: true,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCaptionError(data.error || 'Failed to generate caption');
      } else {
        // Clean up — remove any wrapping quotes or labels
        let clean = data.content.trim();
        clean = clean.replace(/^(CAPTION:\s*)/i, '');
        clean = clean.replace(/^["']|["']$/g, '');
        clean = clean.replace(/\n(ALT TEXT|HASHTAGS|CTA):[\s\S]*/i, '').trim();
        setCaption(clean);
      }
    } catch {
      setCaptionError('Failed to connect. Try again.');
    } finally {
      setCaptionLoading(false);
    }
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = caption;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2000);
  };

  // Generate AI images for carousel slides via Lovart
  const handleGenerateImages = async () => {
    if (!carouselSlides) return;
    setImageGenLoading(true);
    setImageGenProgress('Generating images for each slide...');

    try {
      const slidesPayload = carouselSlides.map((s, idx) => ({
        slideIndex: idx,
        headline: s.headline || s.heading || '',
        body: s.body || s.subtitle || '',
        type: s.type,
      }));

      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides: slidesPayload,
          clientName: output.clientName,
          topic: carouselSlides.map(s => s.headline || s.heading || '').filter(Boolean).join('. '),
          brandColour: output.brandColour,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setImageGenProgress(data.error || 'Failed to generate images');
        setTimeout(() => { setImageGenLoading(false); setImageGenProgress(''); }, 4000);
        return;
      }

      if (data.images && data.images.length > 0) {
        const newImages = data.images.map((img: { slideIndex: number; base64: string }) => ({
          base64: img.base64,
          name: `ai-slide-${img.slideIndex + 1}.png`,
          usage: 'background' as const,
        }));

        setGeneratedSlideImages(newImages);
        setImageGenProgress(`${data.generated}/${data.total} images ready`);
      } else {
        setImageGenProgress(data.errors?.[0]?.error || 'No images generated');
      }
    } catch {
      setImageGenProgress('Failed to connect to image service');
    } finally {
      setTimeout(() => setImageGenLoading(false), 1500);
    }
  };

  // Merge generated images with manually uploaded ones
  const effectiveSlideImages = (output.slideImages && output.slideImages.length > 0)
    ? output.slideImages
    : generatedSlideImages.length > 0
      ? generatedSlideImages
      : undefined;

  const showGhlButton = output.contentType === 'newsletter';
  const defaultSubject = extractSubjectLine(displayContent);

  return (
    <div className="bg-white rounded-2xl border border-border-light p-6 lg:p-8">
      <h2 className="font-display text-2xl font-bold text-text-primary mb-1">
        Your Content
      </h2>
      <p className="font-ui text-sm text-text-muted mb-6">
        {output.clientName} / {output.contentType.replace('-', ' ')}
      </p>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 border border-border-light rounded-lg font-ui text-sm hover:border-brown/40 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {copied ? 'Copied!' : 'Copy'}
        </button>

        <button
          onClick={handlePdf}
          className="flex items-center gap-2 px-4 py-2 border border-border-light rounded-lg font-ui text-sm hover:border-brown/40 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          PDF
        </button>

        <button
          onClick={handleTxt}
          className="flex items-center gap-2 px-4 py-2 border border-border-light rounded-lg font-ui text-sm hover:border-brown/40 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          .txt
        </button>

        <button
          onClick={onRegenerate}
          className="flex items-center gap-2 px-4 py-2 border border-border-light rounded-lg font-ui text-sm hover:border-brown/40 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Regenerate
        </button>

        <button
          onClick={() => setEditMode(!editMode)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-ui text-sm transition-colors ${
            editMode
              ? 'border-brown bg-brown text-white'
              : 'border-border-light hover:border-brown/40'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {editMode ? 'Editing' : 'Edit'}
        </button>

        {showGhlButton && (
          <button
            onClick={() => setShowGhlModal(true)}
            disabled={ghlStatus === 'sending'}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-ui text-sm transition-colors ${
              ghlStatus === 'success'
                ? 'border-green bg-green-light text-green'
                : 'border-green/40 text-green hover:bg-green-light hover:border-green'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            {ghlStatus === 'success' ? 'Sent to Ghutte' : 'Send to Ghutte'}
          </button>
        )}
      </div>

      {/* Send to Ghutte modal */}
      {showGhlModal && (
        <SendToGhlModal
          defaultName={defaultSubject || `${output.clientName} Newsletter`}
          defaultSubject={defaultSubject}
          defaultFrom={output.clientName}
          content={displayContent}
          clientName={output.clientName}
          brandColour={output.brandColour}
          sending={ghlStatus === 'sending'}
          onSend={handleSendToGHL}
          onClose={() => setShowGhlModal(false)}
        />
      )}

      {/* GHL result banner */}
      {ghlResult && ghlResult.dataDebug && ghlStatus === 'success' && (
        <div className="mb-3 bg-orange-light rounded-xl border border-orange/20 p-3">
          <p className="font-ui text-xs text-orange">Warning: Content upload issue: {ghlResult.dataDebug}</p>
          <p className="font-ui text-xs text-text-muted mt-1">Template was created but content may not have loaded. Try the Code Editor option instead.</p>
        </div>
      )}

      {ghlResult && ghlStatus === 'success' && (
        <div className="mb-4 bg-green-light rounded-xl border border-green/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-ui text-sm font-semibold text-green">Template created in Ghutte</p>
              <p className="font-ui text-xs text-text-secondary mt-0.5">{ghlResult.message}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {ghlResult.ghlUrl && (
                <a
                  href={ghlResult.ghlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green text-white font-ui font-semibold text-sm rounded-full hover:opacity-90 transition-all"
                >
                  Open in Ghutte
                </a>
              )}
              {ghlResult.previewUrl && (
                <a
                  href={ghlResult.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-green text-green font-ui font-semibold text-sm rounded-full hover:bg-green hover:text-white transition-all"
                >
                  Preview
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {ghlResult && ghlStatus === 'error' && (
        <div className="mb-4 bg-orange-light rounded-xl border border-orange/20 p-4">
          <p className="font-ui text-sm text-orange">{ghlResult.error}</p>
        </div>
      )}

      {/* Content area */}
      {isCarousel && carouselSlides && !copyApproved ? (
        /* ===== COPY REVIEW STEP — approve before building visual ===== */
        <div id="output-content" className="bg-cream/50 border border-border-light rounded-xl p-6 min-h-[300px]">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-brown/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-text-primary">Review Your Copy</h3>
              <p className="font-ui text-xs text-text-muted">Edit each slide&apos;s text below, then approve to build the visual carousel</p>
            </div>
          </div>

          <div className="space-y-4">
            {(reviewSlides || carouselSlides).map((slide, idx) => {
              const slideLabel = slide.type === 'cover' ? 'Cover Slide' : slide.type === 'cta' ? 'CTA Slide' : `Slide ${slide.slide}`;
              const bgClass = slide.type === 'content-dark' ? 'bg-brown/5' : 'bg-white';

              return (
                <div key={idx} className={`${bgClass} rounded-xl border border-border-light p-4 transition-all`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide">
                      {slideLabel}
                    </span>
                    <span className="font-ui text-[10px] px-2 py-0.5 rounded-full bg-cream border border-border-light text-text-muted capitalize">
                      {slide.type}
                    </span>
                  </div>

                  {/* Cover slide fields */}
                  {slide.type === 'cover' && (
                    <div className="space-y-3">
                      <div>
                        <label className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1 block">Headline</label>
                        <input
                          type="text"
                          value={slide.headline || ''}
                          onChange={(e) => {
                            const updated = [...(reviewSlides || carouselSlides)];
                            updated[idx] = { ...updated[idx], headline: e.target.value };
                            setReviewSlides(updated);
                          }}
                          className="w-full px-3 py-2 border border-border-light rounded-lg font-display text-lg font-bold text-text-primary focus:border-brown focus:ring-1 focus:ring-brown/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1 block">Subtitle</label>
                        <input
                          type="text"
                          value={slide.subtitle || ''}
                          onChange={(e) => {
                            const updated = [...(reviewSlides || carouselSlides)];
                            updated[idx] = { ...updated[idx], subtitle: e.target.value };
                            setReviewSlides(updated);
                          }}
                          className="w-full px-3 py-2 border border-border-light rounded-lg font-ui text-sm text-text-primary focus:border-brown focus:ring-1 focus:ring-brown/20 outline-none"
                        />
                      </div>
                      {slide.hashtag && (
                        <div>
                          <label className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1 block">Hashtag</label>
                          <input
                            type="text"
                            value={slide.hashtag}
                            onChange={(e) => {
                              const updated = [...(reviewSlides || carouselSlides)];
                              updated[idx] = { ...updated[idx], hashtag: e.target.value };
                              setReviewSlides(updated);
                            }}
                            className="w-full px-3 py-2 border border-border-light rounded-lg font-ui text-sm text-text-muted focus:border-brown focus:ring-1 focus:ring-brown/20 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content slide fields */}
                  {(slide.type === 'content-light' || slide.type === 'content-dark') && (
                    <div className="space-y-3">
                      <div>
                        <label className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1 block">Headline</label>
                        <input
                          type="text"
                          value={slide.headline || slide.heading || ''}
                          onChange={(e) => {
                            const updated = [...(reviewSlides || carouselSlides)];
                            const field = slide.headline !== undefined ? 'headline' : 'heading';
                            updated[idx] = { ...updated[idx], [field]: e.target.value };
                            setReviewSlides(updated);
                          }}
                          className="w-full px-3 py-2 border border-border-light rounded-lg font-display text-base font-bold text-text-primary focus:border-brown focus:ring-1 focus:ring-brown/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1 block">Body</label>
                        <textarea
                          value={slide.body || ''}
                          onChange={(e) => {
                            const updated = [...(reviewSlides || carouselSlides)];
                            updated[idx] = { ...updated[idx], body: e.target.value };
                            setReviewSlides(updated);
                          }}
                          rows={3}
                          className="w-full px-3 py-2 border border-border-light rounded-lg font-ui text-sm text-text-primary leading-relaxed focus:border-brown focus:ring-1 focus:ring-brown/20 outline-none resize-y"
                        />
                      </div>
                    </div>
                  )}

                  {/* CTA slide fields */}
                  {slide.type === 'cta' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1 block">Greeting</label>
                          <input
                            type="text"
                            value={slide.greeting || "Hey, I'm"}
                            onChange={(e) => {
                              const updated = [...(reviewSlides || carouselSlides)];
                              updated[idx] = { ...updated[idx], greeting: e.target.value };
                              setReviewSlides(updated);
                            }}
                            className="w-full px-3 py-2 border border-border-light rounded-lg font-ui text-sm text-text-primary focus:border-brown focus:ring-1 focus:ring-brown/20 outline-none"
                          />
                        </div>
                        <div>
                          <label className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1 block">Name</label>
                          <input
                            type="text"
                            value={slide.name || ''}
                            onChange={(e) => {
                              const updated = [...(reviewSlides || carouselSlides)];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              setReviewSlides(updated);
                            }}
                            className="w-full px-3 py-2 border border-border-light rounded-lg font-ui text-sm text-text-primary focus:border-brown focus:ring-1 focus:ring-brown/20 outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1 block">Handle</label>
                          <input
                            type="text"
                            value={slide.handle || ''}
                            onChange={(e) => {
                              const updated = [...(reviewSlides || carouselSlides)];
                              updated[idx] = { ...updated[idx], handle: e.target.value };
                              setReviewSlides(updated);
                            }}
                            className="w-full px-3 py-2 border border-border-light rounded-lg font-ui text-sm text-text-primary focus:border-brown focus:ring-1 focus:ring-brown/20 outline-none"
                          />
                        </div>
                        <div>
                          <label className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1 block">CTA Button Text</label>
                          <input
                            type="text"
                            value={slide.ctaText || 'Follow for more'}
                            onChange={(e) => {
                              const updated = [...(reviewSlides || carouselSlides)];
                              updated[idx] = { ...updated[idx], ctaText: e.target.value };
                              setReviewSlides(updated);
                            }}
                            className="w-full px-3 py-2 border border-border-light rounded-lg font-ui text-sm text-text-primary focus:border-brown focus:ring-1 focus:ring-brown/20 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Approve & Build button */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border-light">
            <button
              onClick={() => setCopyApproved(true)}
              className="px-8 py-3 bg-brown text-white font-ui font-semibold rounded-full hover:bg-brown-light shadow-md hover:shadow-lg transition-all"
            >
              Approve & Build Carousel
            </button>
            <button
              onClick={onRegenerate}
              className="px-6 py-3 border-2 border-brown text-brown font-ui font-semibold rounded-full hover:bg-brown hover:text-white transition-colors"
            >
              Regenerate Copy
            </button>
          </div>
        </div>
      ) : isCarousel && carouselSlides && copyApproved ? (
        /* ===== VISUAL CAROUSEL — after copy approval ===== */
        <div id="output-content" className="bg-cream/50 border border-border-light rounded-xl p-6 min-h-[300px]">
          {/* Back to copy review */}
          <button
            onClick={() => setCopyApproved(false)}
            className="flex items-center gap-1.5 font-ui text-xs font-semibold text-brown hover:opacity-80 transition-opacity mb-4"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Edit Copy
          </button>
          <CarouselRenderer
            slides={reviewSlides || carouselSlides}
            brandColour={output.brandColour || '#7B4B2A'}
            clientName={output.clientName}
            slideImages={effectiveSlideImages}
            styleSettings={appliedStyle}
            referenceStyle={appliedPresetStyle || refStyle || undefined}
          />
          {/* Generate AI Images — shown when no slide images exist */}
          {(!effectiveSlideImages || effectiveSlideImages.length === 0) && (
            <div className="mt-5 p-4 bg-cream/60 border border-dashed border-brown/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brown/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-ui text-sm font-semibold text-text-primary">No slide images</p>
                  <p className="font-ui text-xs text-text-muted">Generate AI backgrounds or upload your own below</p>
                </div>
              </div>
              <button
                onClick={handleGenerateImages}
                disabled={imageGenLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-brown text-white font-ui text-xs font-semibold rounded-full hover:bg-brown-light transition-colors disabled:opacity-50"
              >
                {imageGenLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                    Generate AI Images
                  </>
                )}
              </button>
            </div>
          )}

          {/* Image gen progress message */}
          {imageGenProgress && (
            <div className={`mt-3 px-4 py-2.5 rounded-lg font-ui text-xs font-semibold ${
              imageGenProgress.includes('Failed') || imageGenProgress.includes('error')
                ? 'bg-orange-light text-orange border border-orange/20'
                : imageGenProgress.includes('ready')
                  ? 'bg-green-light text-green border border-green/20'
                  : 'bg-brown/5 text-brown border border-brown/10'
            }`}>
              {imageGenProgress}
            </div>
          )}

          {/* Caption Generator */}
          <div className="mt-6 border-t border-border-light pt-5">
            {!showCaptionPanel ? (
              <button
                onClick={handleGenerateCaption}
                disabled={captionLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-brown/10 text-brown font-ui text-sm font-semibold rounded-full hover:bg-brown/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Generate Caption
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <h4 className="font-display text-sm font-bold text-text-primary">Caption</h4>
                    <span className="font-ui text-[10px] px-2 py-0.5 rounded-full bg-brown/10 text-brown">CAKE Framework</span>
                  </div>
                  <button
                    onClick={() => setShowCaptionPanel(false)}
                    className="text-text-muted hover:text-text-primary"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {captionLoading && (
                  <div className="flex items-center gap-2 py-4 justify-center">
                    <div className="w-4 h-4 border-2 border-brown/30 border-t-brown rounded-full animate-spin" />
                    <span className="font-ui text-sm text-text-muted">Writing caption...</span>
                  </div>
                )}

                {captionError && (
                  <div className="p-3 bg-orange-light rounded-lg border border-orange/20">
                    <p className="font-ui text-xs text-orange">{captionError}</p>
                  </div>
                )}

                {caption && !captionLoading && (
                  <>
                    <div className="relative">
                      <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        rows={3}
                        minLength={600}
                        className="w-full px-4 py-3 border border-border-light rounded-xl font-ui text-sm text-text-primary leading-relaxed focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 bg-white resize-y"
                      />
                      <span className={`absolute bottom-2 right-3 font-ui text-[10px] ${
                        caption.length < 600 ? 'text-orange' : 'text-green'
                      }`}>
                        {caption.length}/600 min
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleCopyCaption}
                        className="flex items-center gap-1.5 px-4 py-2 border border-border-light rounded-lg font-ui text-xs font-semibold hover:border-brown/40 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {captionCopied ? 'Copied!' : 'Copy'}
                      </button>

                      <button
                        onClick={handleGenerateCaption}
                        className="flex items-center gap-1.5 px-4 py-2 border border-border-light rounded-lg font-ui text-xs font-semibold hover:border-brown/40 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Regenerate
                      </button>

                      <a
                        href="https://app.gohighlevel.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 border border-green/40 text-green rounded-lg font-ui text-xs font-semibold hover:bg-green-light hover:border-green transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Open in Ghutte
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Slide-by-slide text below the preview */}
          <details className="mt-4">
            <summary className="font-ui text-sm text-text-muted cursor-pointer hover:text-brown transition-colors">
              View slide text
            </summary>
            <div className="mt-3 font-body text-sm leading-relaxed whitespace-pre-wrap text-text-secondary">
              {carouselTextContent}
            </div>
          </details>
        </div>
      ) : isHtmlNewsletter && parsedNewsletter ? (
        /* ===== HTML NEWSLETTER — styled email preview ===== */
        <div id="output-content">
          <NewsletterRenderer
            data={parsedNewsletter}
            brandColour={output.brandColour || '#7B4B2A'}
            clientName={output.clientName}
            productImages={output.productImages}
          />
        </div>
      ) : isTranscriptOutput && parsedTranscript ? (
        /* ===== TRANSCRIPT → CONTENT — analysis + individual copyable pieces ===== */
        <div id="output-content" className="space-y-4">
          {(parsedTranscript.voiceAnalysis || parsedTranscript.keyMoments || parsedTranscript.keyInsights) && (
            <div className="bg-cream/60 rounded-2xl border border-border-light p-5 space-y-4">
              {parsedTranscript.voiceAnalysis && (
                <div>
                  <p className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Voice analysis</p>
                  <p className="font-body text-sm leading-relaxed text-text-primary whitespace-pre-wrap">{parsedTranscript.voiceAnalysis}</p>
                </div>
              )}
              {parsedTranscript.keyMoments && (
                <div>
                  <p className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Key moments</p>
                  <p className="font-body text-sm leading-relaxed text-text-primary whitespace-pre-wrap">{parsedTranscript.keyMoments}</p>
                </div>
              )}
              {parsedTranscript.keyInsights && (
                <div>
                  <p className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Key insights</p>
                  <p className="font-body text-sm leading-relaxed text-text-primary whitespace-pre-wrap">{parsedTranscript.keyInsights}</p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            {parsedTranscript.pieces.map((piece, idx) => {
              const isCopied = copiedPieceIdx === idx;
              return (
                <div key={idx} className="bg-white rounded-2xl border border-border-light overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-5 py-3 bg-cream/80 border-b border-border-light">
                    <div className="min-w-0 flex items-baseline gap-2">
                      <span className="font-ui text-[10px] font-semibold text-brown bg-brown/10 px-2 py-0.5 rounded-full uppercase tracking-wider">{piece.label}</span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await copyToClipboard(piece.body);
                        setCopiedPieceIdx(idx);
                        setTimeout(() => setCopiedPieceIdx((curr) => (curr === idx ? null : curr)), 1800);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-ui text-xs font-semibold transition-all ${
                        isCopied
                          ? 'bg-green text-white'
                          : 'bg-white text-brown border border-brown/30 hover:bg-brown hover:text-white hover:border-brown'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="px-5 py-4">
                    <div className="font-body text-sm leading-relaxed whitespace-pre-wrap text-text-primary">{piece.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          id="output-content"
          className={`bg-cream/50 border border-border-light rounded-xl p-6 min-h-[300px] ${
            editMode ? 'ring-2 ring-brown/30' : ''
          }`}
          contentEditable={editMode}
          suppressContentEditableWarning
        >
          <div className="font-body text-base leading-relaxed whitespace-pre-wrap text-text-primary">
            {displayContent}
          </div>
        </div>
      )}

      {/* Change Style panel (collapsible) */}
      {isCarousel && showStylePanel && (
        <div className="mt-4 p-5 bg-cream/60 border border-border-light rounded-xl space-y-5 transition-all">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-text-primary">Change Style</h3>
            <button
              onClick={() => setShowStylePanel(false)}
              className="text-text-muted hover:text-text-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Style reference upload */}
          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
              Style Reference (optional)
            </label>
            <p className="font-ui text-xs text-text-muted mb-2">
              Upload a screenshot of a carousel you love
            </p>
            {styleRefImage ? (
              <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-border-light">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={styleRefImage}
                  alt="Style reference"
                  className="rounded"
                  style={{ width: 64, height: 80, objectFit: 'cover' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-ui text-xs text-text-primary truncate">{styleRefName}</p>
                </div>
                <button
                  onClick={() => { setStyleRefImage(null); setStyleRefName(null); }}
                  className="text-red hover:opacity-70 p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border-light rounded-xl cursor-pointer hover:border-brown transition-colors bg-white/60">
                <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-ui text-sm text-text-muted">Upload reference image</span>
                <input type="file" accept="image/*" onChange={handleStyleRefUpload} className="hidden" />
              </label>
            )}
          </div>

          {/* Style presets */}
          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
              Style Preset
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleSelectPreset(preset.value)}
                  className={`px-3 py-1.5 rounded-full font-ui text-xs font-semibold transition-all ${
                    selectedPreset === preset.value
                      ? 'bg-brown text-white'
                      : 'bg-white border border-border-light text-text-secondary hover:border-brown/40'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colours */}
          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-3 block">
              Colours
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Background', value: customBgColor, setter: setCustomBgColor },
                { label: 'Body Text', value: customTextColor, setter: setCustomTextColor },
                { label: 'Headlines', value: customHeadlineColor, setter: setCustomHeadlineColor },
                { label: 'Accent', value: customAccentColor, setter: setCustomAccentColor },
                { label: 'CTA Button', value: customCtaColor, setter: setCustomCtaColor },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-2">
                  <label className="relative cursor-pointer">
                    <input
                      type="color"
                      value={c.value}
                      onChange={(e) => { c.setter(e.target.value); setSelectedPreset(''); }}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                    <div
                      className="w-8 h-8 rounded-lg border-2 border-border-light shadow-sm"
                      style={{ backgroundColor: c.value }}
                    />
                  </label>
                  <div className="flex-1 min-w-0">
                    <span className="font-ui text-[10px] text-text-muted block">{c.label}</span>
                    <span className="font-ui text-xs text-text-secondary font-mono">{c.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Background pattern */}
          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
              Background Pattern
            </label>
            <div className="flex gap-2">
              {(['none', 'grid', 'dots', 'lines'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setCustomPattern(opt); setSelectedPreset(''); }}
                  className={`flex-1 py-2 rounded-lg font-ui text-xs font-semibold capitalize transition-all ${
                    customPattern === opt
                      ? 'bg-brown text-white'
                      : 'bg-white border border-border-light text-text-secondary hover:border-brown/40'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Highlight style */}
          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
              Headline Highlight
            </label>
            <div className="flex gap-2">
              {(['none', 'box', 'underline'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setCustomHighlight(opt); setSelectedPreset(''); }}
                  className={`flex-1 py-2 rounded-lg font-ui text-xs font-semibold capitalize transition-all ${
                    customHighlight === opt
                      ? 'bg-brown text-white'
                      : 'bg-white border border-border-light text-text-secondary hover:border-brown/40'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Fonts */}
          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-3 block">
              Fonts
            </label>
            <div className="space-y-3">
              <div>
                <label className="font-ui text-[10px] text-text-muted mb-1 block">Headline Font</label>
                <select
                  value={customHeadlineFont}
                  onChange={(e) => { setCustomHeadlineFont(e.target.value); setSelectedPreset(''); }}
                  className="w-full px-3 py-2 border border-border-light rounded-lg font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 bg-white"
                  style={{ fontFamily: customHeadlineFont }}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-ui text-[10px] text-text-muted mb-1 block">Body Font</label>
                <select
                  value={customBodyFont}
                  onChange={(e) => { setCustomBodyFont(e.target.value); setSelectedPreset(''); }}
                  className="w-full px-3 py-2 border border-border-light rounded-lg font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 bg-white"
                  style={{ fontFamily: customBodyFont }}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Overlay opacity */}
          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
              Background Overlay
            </label>
            <div className="flex gap-2">
              {(['light', 'medium', 'heavy'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setOverlayOpacity(opt)}
                  className={`flex-1 py-2 rounded-lg font-ui text-xs font-semibold capitalize transition-all ${
                    overlayOpacity === opt
                      ? 'bg-brown text-white'
                      : 'bg-white border border-border-light text-text-secondary hover:border-brown/40'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Text alignment */}
          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
              Text Alignment
            </label>
            <div className="flex gap-2">
              {([
                { value: 'left' as const, label: 'Left' },
                { value: 'bottom-left' as const, label: 'Bottom-Left' },
                { value: 'centered' as const, label: 'Centered' },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTextAlignment(opt.value)}
                  className={`flex-1 py-2 rounded-lg font-ui text-xs font-semibold transition-all ${
                    textAlignment === opt.value
                      ? 'bg-brown text-white'
                      : 'bg-white border border-border-light text-text-secondary hover:border-brown/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div>
            <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
              Font Size
            </label>
            <div className="flex gap-2">
              {(['small', 'medium', 'large'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFontSize(opt)}
                  className={`flex-1 py-2 rounded-lg font-ui text-xs font-semibold capitalize transition-all ${
                    fontSize === opt
                      ? 'bg-brown text-white'
                      : 'bg-white border border-border-light text-text-secondary hover:border-brown/40'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Apply button */}
          <button
            onClick={handleApplyStyle}
            className="w-full px-6 py-3 bg-brown text-white font-ui font-semibold rounded-full hover:bg-brown-light transition-colors"
          >
            Apply Style
          </button>
        </div>
      )}

      {/* Actions bar */}
      <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border-light">
        <button
          onClick={onStartNew}
          className="px-6 py-3 bg-brown text-white font-ui font-semibold rounded-full hover:bg-brown-light transition-colors"
        >
          Start New Piece
        </button>
        {isCarousel ? (
          <button
            onClick={() => setShowStylePanel(!showStylePanel)}
            className={`px-6 py-3 border-2 font-ui font-semibold rounded-full transition-colors ${
              showStylePanel
                ? 'border-brown bg-brown text-white'
                : 'border-brown text-brown hover:bg-brown hover:text-white'
            }`}
          >
            Change Style
          </button>
        ) : (
          <button
            onClick={onChangeClient}
            className="px-6 py-3 border-2 border-brown text-brown font-ui font-semibold rounded-full hover:bg-brown hover:text-white transition-colors"
          >
            Change Client
          </button>
        )}
        <button
          disabled
          className="px-6 py-3 border-2 border-border-light text-text-muted font-ui font-semibold rounded-full cursor-not-allowed relative group"
        >
          Save to Drive
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-text-primary text-white text-xs font-ui px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Coming soon
          </span>
        </button>
      </div>
    </div>
  );
}

function buildAiPrompt(clientName: string, brandColour?: string, sectionCount?: number): string {
  const accent = brandColour || '#7B4B2A';
  const sections = sectionCount || 3;
  return `Build a ${sections}-section newsletter email for ${clientName}. Editorial, premium style. Background: #FAF7F2. Content area: white. Accent: ${accent} for links, CTA button, dividers. Text: #2D2D2D, Georgia/serif font. Brand name "${clientName}" at top in small uppercase with letter-spacing. Each section: bold heading + body paragraph. CTA button at end: ${accent} background, white text, rounded. Generous spacing. No images. Typography-led. Mobile-responsive. Add placeholder text I will replace with my own copy.`;
}

function SendToGhlModal({
  defaultName,
  defaultSubject,
  defaultFrom,
  content,
  clientName,
  brandColour,
  sending,
  onSend,
  onClose,
}: {
  defaultName: string;
  defaultSubject: string;
  defaultFrom: string;
  content: string;
  clientName: string;
  brandColour?: string;
  sending: boolean;
  onSend: (name: string, subject: string, from: string, editorType: 'code' | 'builder') => void;
  onClose: () => void;
}) {
  const [templateName, setTemplateName] = useState(defaultName);
  const [subjectLine, setSubjectLine] = useState(defaultSubject);
  const [fromName, setFromName] = useState(defaultFrom);
  const [mode, setMode] = useState<'choose' | 'ai-prompt' | 'html-template'>('choose');
  const [promptCopied, setPromptCopied] = useState(false);
  const [copyCopied, setCopyCopied] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const sectionCount = content.split('\n\n').filter(p => p.trim().length > 20).length;
  const aiPrompt = buildAiPrompt(clientName, brandColour, Math.min(sectionCount, 8));

  const handleCopyText = async (text: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setter(true);
    setTimeout(() => setter(false), 4000);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-border-light max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold text-text-primary">
            {mode === 'choose' ? 'Send to Ghutte' : mode === 'ai-prompt' ? 'AI Builder Prompt' : 'Create HTML Template'}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {mode === 'choose' && (
          <div className="space-y-3">
            <p className="font-ui text-sm text-text-secondary mb-4">How do you want to build this email in Ghutte?</p>

            <button
              onClick={() => setMode('ai-prompt')}
              className="w-full p-4 rounded-xl border border-border-light hover:border-brown hover:bg-brown/5 text-left transition-all group"
            >
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <div>
                  <span className="font-ui text-sm font-semibold text-text-primary group-hover:text-brown">AI Builder Prompt</span>
                  <span className="font-ui text-xs text-green ml-2">Recommended</span>
                </div>
              </div>
              <p className="font-ui text-xs text-text-muted pl-11">Copy a ready-made prompt with your exact copy + styling directions. Paste it into Ghutte&apos;s AI email builder for a visual, drag-and-drop result.</p>
            </button>

            <button
              onClick={() => setMode('html-template')}
              className="w-full p-4 rounded-xl border border-border-light hover:border-brown hover:bg-brown/5 text-left transition-all group"
            >
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                </div>
                <span className="font-ui text-sm font-semibold text-text-primary group-hover:text-brown">HTML Template</span>
              </div>
              <p className="font-ui text-xs text-text-muted pl-11">Creates a pre-styled HTML email directly in Ghutte. Opens in the code editor — pixel-perfect but not drag-and-drop.</p>
            </button>
          </div>
        )}

        {mode === 'ai-prompt' && (
          <div className="space-y-4">
            <button
              onClick={() => { setMode('choose'); setStep(1); setPromptCopied(false); setCopyCopied(false); }}
              className="font-ui text-xs text-text-muted hover:text-brown flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    step > s ? 'bg-green text-white' : step === s ? 'bg-brown text-white' : 'bg-cream-dark text-text-muted'
                  }`}>
                    {step > s ? '\u2713' : s}
                  </div>
                  {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-green' : 'bg-cream-dark'}`} />}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-3">
                <div>
                  <h4 className="font-ui text-sm font-semibold text-text-primary mb-1">Copy the design prompt</h4>
                  <p className="font-ui text-xs text-text-muted">This tells Ghutte&apos;s AI how to style the email. Under 750 characters.</p>
                </div>

                <div className="relative">
                  <div className="bg-cream border border-border-light rounded-xl p-4 max-h-[200px] overflow-y-auto">
                    <pre className="font-ui text-xs text-text-secondary whitespace-pre-wrap break-words leading-relaxed">{aiPrompt}</pre>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className={`font-ui text-[10px] px-2 py-0.5 rounded-full border ${
                      aiPrompt.length <= 750
                        ? 'text-green bg-green/10 border-green/20'
                        : 'text-orange bg-orange/10 border-orange/20'
                    }`}>
                      {aiPrompt.length}/750
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => { handleCopyText(aiPrompt, setPromptCopied); setStep(2); }}
                  className="w-full px-6 py-3 font-ui font-semibold text-sm rounded-full bg-text-primary text-white hover:opacity-90 transition-all"
                >
                  Copy Design Prompt
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div>
                  <h4 className="font-ui text-sm font-semibold text-text-primary mb-1">Paste in Ghutte&apos;s AI builder</h4>
                  <p className="font-ui text-xs text-text-muted">Open Ghutte, New email, Click AI, &quot;Build&quot; tab, Paste the prompt, Send. Then come back here for the copy.</p>
                </div>

                <div className="p-3 rounded-xl bg-green/10 border border-green/20">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-ui text-xs text-green font-semibold">Design prompt copied</span>
                  </div>
                </div>

                <a
                  href="https://app.gohighlevel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-6 py-3 font-ui font-semibold text-sm rounded-full bg-brown text-white hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  Open Ghutte
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>

                <button
                  onClick={() => setStep(3)}
                  className="w-full px-6 py-3 font-ui font-semibold text-sm rounded-full border border-border-light text-text-secondary hover:border-brown hover:text-brown transition-all"
                >
                  Done — now give me the copy
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <div>
                  <h4 className="font-ui text-sm font-semibold text-text-primary mb-1">Copy your newsletter text</h4>
                  <p className="font-ui text-xs text-text-muted">Replace the placeholder text in each block with this copy. Paste section by section into the email blocks Ghutte built for you.</p>
                </div>

                <div className="relative">
                  <div className="bg-cream border border-border-light rounded-xl p-4 max-h-[250px] overflow-y-auto">
                    <pre className="font-ui text-xs text-text-secondary whitespace-pre-wrap break-words leading-relaxed">{content}</pre>
                  </div>
                </div>

                {!copyCopied ? (
                  <button
                    onClick={() => handleCopyText(content, setCopyCopied)}
                    className="w-full px-6 py-3 font-ui font-semibold text-sm rounded-full bg-text-primary text-white hover:opacity-90 transition-all"
                  >
                    Copy Newsletter Text
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 py-2">
                      <svg className="w-4 h-4 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-ui text-sm text-green font-semibold">Newsletter text copied — paste into Ghutte blocks</span>
                    </div>
                    <a
                      href="https://app.gohighlevel.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-6 py-3 font-ui font-semibold text-sm rounded-full bg-brown text-white hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      Back to Ghutte
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {mode === 'html-template' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('choose')}
              className="font-ui text-xs text-text-muted hover:text-brown flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div>
              <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5 block">
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. April Newsletter - Systems That Serve You"
                className="w-full px-4 py-2.5 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 bg-white"
              />
            </div>

            <div>
              <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5 block">
                Subject Line
              </label>
              <input
                type="text"
                value={subjectLine}
                onChange={(e) => setSubjectLine(e.target.value)}
                placeholder="The subject your recipients will see"
                className="w-full px-4 py-2.5 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 bg-white"
              />
            </div>

            <div>
              <label className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5 block">
                From Name
              </label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="e.g. Nyaki from ClubSheIs"
                className="w-full px-4 py-2.5 border border-border-light rounded-xl font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 bg-white"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => onSend(templateName, subjectLine, fromName, 'code')}
                disabled={!templateName.trim() || sending}
                className={`flex-1 px-6 py-3 font-ui font-semibold text-sm rounded-full transition-all ${
                  templateName.trim() && !sending
                    ? 'bg-green text-white hover:opacity-90'
                    : 'bg-cream-dark text-text-muted cursor-not-allowed'
                }`}
              >
                {sending ? 'Creating template...' : 'Create in Ghutte'}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 border border-border-light text-text-secondary font-ui font-semibold text-sm rounded-full hover:border-border transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
