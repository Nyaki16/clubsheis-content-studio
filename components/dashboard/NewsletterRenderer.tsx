'use client';

import { useState, useRef, useEffect } from 'react';
import {
  listLibraryImages,
  saveLibraryImage,
  removeLibraryImage,
  type LibraryImage,
} from '@/lib/image-library';

export interface NewsletterSection {
  type: 'hero' | 'content' | 'feature' | 'testimonial' | 'cta';
  headline: string;
  body: string;
  imageSlot?: number | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
}

export interface NewsletterData {
  subjectLine: string;
  preheader: string;
  sections: NewsletterSection[];
  signOff: string;
  signOffName: string;
  /** Optional described-but-not-generated hero image idea. Guidance only — not part of the email HTML. */
  imageSuggestion?: string;
}

interface ProductImage {
  base64: string;
  name: string;
  caption?: string;
}

interface Props {
  data: NewsletterData;
  brandColour: string;
  clientName: string;
  productImages?: ProductImage[];
  style?: 'editorial' | 'product-launch' | 'minimal' | 'bold';
}

// Stable default reference so the prop default doesn't trip useEffect into a loop.
const EMPTY_IMAGES: ProductImage[] = [];

// Style presets for different email aesthetics
const STYLE_TOKENS = {
  editorial: {
    bgOuter: '#F5F0EB',
    bgInner: '#FFFFFF',
    headlineFont: 'Georgia, "Times New Roman", serif',
    bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headlineColor: '#1a1a1a',
    bodyColor: '#3d3d3d',
    accentBorder: true,
    sectionDivider: 'line',
  },
  'product-launch': {
    bgOuter: '#FFFFFF',
    bgInner: '#FFFFFF',
    headlineFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headlineColor: '#111111',
    bodyColor: '#444444',
    accentBorder: false,
    sectionDivider: 'space',
  },
  minimal: {
    bgOuter: '#FFFFFF',
    bgInner: '#FFFFFF',
    headlineFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headlineColor: '#1a1a1a',
    bodyColor: '#555555',
    accentBorder: false,
    sectionDivider: 'space',
  },
  bold: {
    bgOuter: '#1a1a1a',
    bgInner: '#FFFFFF',
    headlineFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headlineColor: '#1a1a1a',
    bodyColor: '#333333',
    accentBorder: false,
    sectionDivider: 'colour-block',
  },
};

export default function NewsletterRenderer({
  data: propData,
  brandColour,
  clientName,
  productImages: propImages = EMPTY_IMAGES,
  style = 'editorial',
}: Props) {
  const emailRef = useRef<HTMLDivElement>(null);
  const [htmlCopied, setHtmlCopied] = useState(false);

  // Mirror props into local state so the user can edit. Re-sync if props change.
  const [localData, setLocalData] = useState<NewsletterData>(propData);
  const [localImages, setLocalImages] = useState<ProductImage[]>(propImages);
  const [showCopyPanel, setShowCopyPanel] = useState(false);
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [library, setLibrary] = useState<LibraryImage[]>([]);
  const [savedIdsThisRow, setSavedIdsThisRow] = useState<Record<number, string>>({});

  useEffect(() => { setLocalData(propData); }, [propData]);
  useEffect(() => { setLocalImages(propImages); }, [propImages]);
  useEffect(() => {
    listLibraryImages().then(setLibrary).catch(() => setLibrary([]));
  }, []);

  const tokens = STYLE_TOKENS[style] || STYLE_TOKENS.editorial;
  const accent = brandColour || '#7B4B2A';

  const getImage = (slot: number | null | undefined): string | undefined => {
    if (!slot || slot < 1) return undefined;
    const img = localImages[slot - 1];
    return img ? `data:image/jpeg;base64,${img.base64}` : undefined;
  };

  // Field updaters
  const updateField = (field: keyof NewsletterData, value: string) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };
  const updateSection = (idx: number, patch: Partial<NewsletterSection>) => {
    setLocalData(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));
  };

  // Image management
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const next = [...localImages];
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
      next.push({ base64, name: file.name });
    }
    setLocalImages(next);
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    setLocalImages(prev => prev.filter((_, i) => i !== idx));
    // Any section that used this slot or beyond should shift / clear
    setLocalData(prev => ({
      ...prev,
      sections: prev.sections.map(s => {
        if (s.imageSlot == null) return s;
        if (s.imageSlot - 1 === idx) return { ...s, imageSlot: null };
        if (s.imageSlot - 1 > idx) return { ...s, imageSlot: s.imageSlot - 1 };
        return s;
      }),
    }));
  };

  const handleSaveToLibrary = async (idx: number) => {
    const img = localImages[idx];
    if (!img) return;
    const saved = await saveLibraryImage({ base64: img.base64, name: img.name });
    if (saved) {
      setLibrary(prev => [saved, ...prev]);
      setSavedIdsThisRow(prev => ({ ...prev, [idx]: saved.id }));
    }
  };

  const handlePickFromLibrary = (libImg: LibraryImage) => {
    setLocalImages(prev => [...prev, { base64: libImg.base64, name: libImg.name }]);
  };

  const handleRemoveFromLibrary = async (id: string) => {
    await removeLibraryImage(id);
    setLibrary(prev => prev.filter(i => i.id !== id));
  };

  // Use localData instead of data from here on
  const data = localData;

  const handleCopyHtml = async () => {
    if (!emailRef.current) return;
    const html = emailRef.current.innerHTML;
    try {
      await navigator.clipboard.writeText(html);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = html;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setHtmlCopied(true);
    setTimeout(() => setHtmlCopied(false), 2000);
  };

  const handleDownloadHtml = () => {
    if (!emailRef.current) return;
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${data.subjectLine}</title></head>
<body style="margin:0;padding:0;background:${tokens.bgOuter}">${emailRef.current.innerHTML}</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clientName.toLowerCase().replace(/\s+/g, '-')}-newsletter.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Subject / Preheader bar */}
      <div className="bg-cream/80 border border-border-light rounded-xl px-5 py-4 mb-4 space-y-2">
        <div>
          <label className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-0.5">Subject Line</label>
          <p className="font-display text-lg font-bold text-text-primary leading-snug">{data.subjectLine}</p>
        </div>
        <div>
          <label className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-0.5">Preheader</label>
          <p className="font-ui text-sm text-text-secondary italic">{data.preheader}</p>
        </div>
        {data.imageSuggestion && (
          <div>
            <label className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-0.5">Hero Image Idea</label>
            <p className="font-ui text-sm text-text-secondary">{data.imageSuggestion}</p>
          </div>
        )}
      </div>

      {/* HTML Email Preview */}
      <div
        className="border border-border-light rounded-xl overflow-hidden shadow-sm"
        style={{ maxWidth: 680, margin: '0 auto' }}
      >
        <div ref={emailRef}>
          {/* Email wrapper table */}
          <div style={{
            backgroundColor: tokens.bgOuter,
            padding: '32px 16px',
            fontFamily: tokens.bodyFont,
          }}>
            {/* Inner container */}
            <div style={{
              maxWidth: 600,
              margin: '0 auto',
              backgroundColor: tokens.bgInner,
              borderRadius: 8,
              overflow: 'hidden',
              ...(tokens.accentBorder ? { borderTop: `4px solid ${accent}` } : {}),
            }}>
              {/* Brand header */}
              <div style={{
                padding: '28px 40px 20px',
                borderBottom: `1px solid ${accent}15`,
              }}>
                <span style={{
                  fontFamily: tokens.headlineFont,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: 2,
                  textTransform: 'uppercase' as const,
                  color: accent,
                }}>
                  {clientName}
                </span>
              </div>

              {/* Sections */}
              {data.sections.map((section, idx) => {
                const sectionImage = getImage(section.imageSlot);
                const isHero = section.type === 'hero';
                const isCta = section.type === 'cta';
                const isFeature = section.type === 'feature';
                const isTestimonial = section.type === 'testimonial';
                const isDarkBlock = style === 'bold' && idx % 2 === 1;

                return (
                  <div key={idx}>
                    {/* Section divider */}
                    {idx > 0 && tokens.sectionDivider === 'line' && (
                      <div style={{ padding: '0 40px' }}>
                        <hr style={{ border: 'none', borderTop: `1px solid ${accent}20`, margin: 0 }} />
                      </div>
                    )}

                    <div style={{
                      padding: isHero ? '40px 40px 32px' : isCta ? '32px 40px 40px' : '28px 40px',
                      ...(isDarkBlock ? { backgroundColor: '#F8F5F2' } : {}),
                    }}>
                      {/* Hero image — full width above headline */}
                      {isHero && sectionImage && (
                        <div style={{ marginBottom: 24, borderRadius: 6, overflow: 'hidden' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={sectionImage} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
                        </div>
                      )}

                      {/* Headline */}
                      <h2 style={{
                        fontFamily: tokens.headlineFont,
                        fontSize: isHero ? 28 : isCta ? 22 : 20,
                        fontWeight: isHero ? 700 : 600,
                        color: tokens.headlineColor,
                        lineHeight: 1.3,
                        margin: `0 0 ${isHero ? 16 : 12}px 0`,
                        ...(isTestimonial ? { fontStyle: 'italic' as const } : {}),
                      }}>
                        {isTestimonial ? `"${section.headline}"` : section.headline}
                      </h2>

                      {/* Feature layout: image + text side by side */}
                      {isFeature && sectionImage ? (
                        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                          <div style={{ flex: '0 0 180px', borderRadius: 6, overflow: 'hidden' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={sectionImage} alt="" style={{ width: 180, height: 'auto', display: 'block' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{
                              fontFamily: tokens.bodyFont,
                              fontSize: 15,
                              lineHeight: 1.7,
                              color: tokens.bodyColor,
                              margin: 0,
                              whiteSpace: 'pre-wrap' as const,
                            }}>
                              {section.body}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Body text */}
                          <p style={{
                            fontFamily: tokens.bodyFont,
                            fontSize: 15,
                            lineHeight: 1.7,
                            color: tokens.bodyColor,
                            margin: 0,
                            whiteSpace: 'pre-wrap' as const,
                          }}>
                            {section.body}
                          </p>

                          {/* Content section image — below text */}
                          {!isHero && sectionImage && (
                            <div style={{ marginTop: 20, borderRadius: 6, overflow: 'hidden' }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={sectionImage} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
                            </div>
                          )}
                        </>
                      )}

                      {/* CTA button */}
                      {section.ctaText && (
                        <div style={{ marginTop: 24, textAlign: isCta ? 'center' as const : 'left' as const }}>
                          <a
                            href={section.ctaUrl || '#'}
                            style={{
                              display: 'inline-block',
                              backgroundColor: accent,
                              color: '#FFFFFF',
                              fontFamily: tokens.bodyFont,
                              fontSize: 14,
                              fontWeight: 700,
                              padding: '14px 32px',
                              borderRadius: 6,
                              textDecoration: 'none',
                              letterSpacing: 0.3,
                            }}
                          >
                            {section.ctaText}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Sign-off */}
              <div style={{ padding: '20px 40px 32px', borderTop: `1px solid ${accent}10` }}>
                <p style={{
                  fontFamily: tokens.bodyFont,
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: tokens.bodyColor,
                  margin: 0,
                }}>
                  {data.signOff}
                </p>
                <p style={{
                  fontFamily: tokens.headlineFont,
                  fontSize: 15,
                  fontWeight: 600,
                  color: tokens.headlineColor,
                  margin: '8px 0 0',
                }}>
                  {data.signOffName}
                </p>
              </div>

              {/* Footer */}
              <div style={{
                padding: '20px 40px',
                backgroundColor: tokens.bgOuter === '#1a1a1a' ? '#111' : '#F8F5F2',
                textAlign: 'center' as const,
              }}>
                <p style={{
                  fontFamily: tokens.bodyFont,
                  fontSize: 11,
                  color: '#999999',
                  margin: 0,
                  lineHeight: 1.6,
                }}>
                  {clientName} · <a href="#" style={{ color: '#999', textDecoration: 'underline' }}>Unsubscribe</a> · <a href="#" style={{ color: '#999', textDecoration: 'underline' }}>View in browser</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-3 mt-5">
        <button
          onClick={handleCopyHtml}
          className="flex items-center gap-2 px-5 py-2.5 border border-border-light rounded-full font-ui text-sm font-semibold hover:border-brown/40 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
          {htmlCopied ? 'HTML Copied!' : 'Copy HTML'}
        </button>
        <button
          onClick={handleDownloadHtml}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-ui text-sm font-semibold text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: accent }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download .html
        </button>
      </div>

      {/* Edit Images section */}
      <div className="w-full mt-6">
        <button
          onClick={() => setShowImagePanel(!showImagePanel)}
          className="flex items-center gap-2 font-ui text-sm font-semibold text-brown hover:opacity-80 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Edit Images
          <svg
            className={`w-3 h-3 transition-transform ${showImagePanel ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showImagePanel && (
          <div className="mt-3 p-4 bg-white rounded-xl border border-border-light space-y-3">
            {/* Saved library strip */}
            {library.length > 0 && (
              <div>
                <p className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                  Saved ({library.length}) — click to add
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {library.map((img) => (
                    <div key={img.id} className="relative group flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePickFromLibrary(img)}
                        title={`Add ${img.name}`}
                        className="block rounded-md overflow-hidden border border-border-light hover:border-brown transition-colors"
                        style={{ width: 56, height: 70 }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`data:image/jpeg;base64,${img.base64}`}
                          alt={img.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromLibrary(img.id)}
                        title="Remove from library"
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload zone */}
            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border-light rounded-xl cursor-pointer hover:border-brown transition-colors bg-cream/40">
              <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-ui text-sm text-text-muted">Drop images here or click to upload</span>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            </label>

            {/* Image list */}
            {localImages.length > 0 && (
              <div className="space-y-2">
                <p className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide">
                  Image slots — assign each image to a section in &ldquo;Edit Copy&rdquo; below
                </p>
                {localImages.map((img, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-cream/40 rounded-lg border border-border-light">
                    <div className="relative flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:image/jpeg;base64,${img.base64}`}
                        alt={img.name}
                        className="rounded"
                        style={{ width: 48, height: 60, objectFit: 'cover' }}
                      />
                      <span
                        className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full flex items-center justify-center font-ui text-[11px] font-bold text-white shadow"
                        style={{ backgroundColor: accent }}
                        title={`Image slot ${idx + 1}`}
                      >
                        {idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-ui text-xs text-text-primary truncate">{img.name}</p>
                      <p className="font-ui text-[10px] text-text-muted mt-0.5">Slot {idx + 1}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSaveToLibrary(idx)}
                      disabled={!!savedIdsThisRow[idx]}
                      title={savedIdsThisRow[idx] ? 'Saved to library' : 'Save to library'}
                      className={`p-1 flex-shrink-0 transition-colors ${
                        savedIdsThisRow[idx] ? 'text-brown' : 'text-text-muted hover:text-brown'
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill={savedIdsThisRow[idx] ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="text-red hover:opacity-70 p-1 flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {localImages.length === 0 && (
              <p className="font-ui text-xs text-text-muted text-center py-2">No images yet. Upload to use in newsletter sections.</p>
            )}
          </div>
        )}
      </div>

      {/* Edit Copy section */}
      <div className="w-full mt-4">
        <button
          onClick={() => setShowCopyPanel(!showCopyPanel)}
          className="flex items-center gap-2 font-ui text-sm font-semibold text-brown hover:opacity-80 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Copy
          <svg
            className={`w-3 h-3 transition-transform ${showCopyPanel ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showCopyPanel && (
          <div className="mt-3 p-4 bg-white rounded-xl border border-border-light space-y-4">
            <p className="font-ui text-xs text-text-muted">
              Edit any field below — changes appear instantly in the preview above.
            </p>

            {/* Top-level fields */}
            <div className="p-3 rounded-lg bg-cream/40 border border-border-light space-y-2">
              <p className="font-ui text-[10px] font-semibold text-brown uppercase tracking-wider">Top of email</p>
              <NewsletterField label="Subject line" value={data.subjectLine} onChange={(v) => updateField('subjectLine', v)} />
              <NewsletterField label="Preheader" value={data.preheader} onChange={(v) => updateField('preheader', v)} />
              <NewsletterField
                label="Hero image idea"
                value={data.imageSuggestion || ''}
                onChange={(v) => updateField('imageSuggestion', v)}
                multiline
              />
            </div>

            {/* Sections */}
            {data.sections.map((section, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-cream/40 border border-border-light space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-ui text-[10px] font-semibold text-brown bg-brown/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Section {idx + 1}
                  </span>
                  <span className="font-ui text-[10px] text-text-muted uppercase tracking-wider">{section.type}</span>
                </div>
                <NewsletterField label="Headline" value={section.headline} onChange={(v) => updateSection(idx, { headline: v })} />
                <NewsletterField label="Body" value={section.body} onChange={(v) => updateSection(idx, { body: v })} multiline />
                <NewsletterField
                  label="CTA text"
                  value={section.ctaText || ''}
                  onChange={(v) => updateSection(idx, { ctaText: v || null })}
                />
                <NewsletterField
                  label="CTA URL"
                  value={section.ctaUrl || ''}
                  onChange={(v) => updateSection(idx, { ctaUrl: v || null })}
                />
                <label className="block">
                  <span className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide">Image slot</span>
                  <select
                    value={section.imageSlot ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateSection(idx, { imageSlot: v === '' ? null : Number(v) });
                    }}
                    className="mt-1 w-full px-3 py-2 border border-border-light rounded-lg font-ui text-sm focus:outline-none focus:border-brown bg-white"
                  >
                    <option value="">No image</option>
                    {localImages.map((img, i) => (
                      <option key={i} value={i + 1}>
                        Slot {i + 1} — {img.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}

            {/* Sign-off */}
            <div className="p-3 rounded-lg bg-cream/40 border border-border-light space-y-2">
              <p className="font-ui text-[10px] font-semibold text-brown uppercase tracking-wider">Sign-off</p>
              <NewsletterField label="Sign-off message" value={data.signOff} onChange={(v) => updateField('signOff', v)} multiline />
              <NewsletterField label="Sign-off name" value={data.signOffName} onChange={(v) => updateField('signOffName', v)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Single field row in Edit Copy panel ---- */
function NewsletterField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="mt-1 w-full px-3 py-2 border border-border-light rounded-lg font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 resize-y bg-white"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full px-3 py-2 border border-border-light rounded-lg font-ui text-sm focus:outline-none focus:border-brown focus:ring-1 focus:ring-brown/20 bg-white"
        />
      )}
    </label>
  );
}
