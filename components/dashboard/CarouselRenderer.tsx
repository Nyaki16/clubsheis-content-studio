'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import html2canvas from 'html2canvas';
import {
  listLibraryImages,
  saveLibraryImage,
  removeLibraryImage,
  type LibraryImage,
} from '@/lib/image-library';

export interface CarouselSlide {
  slide: number;
  type: 'cover' | 'content-light' | 'content-dark' | 'cta';
  headline?: string;
  subtitle?: string;
  hashtag?: string;
  heading?: string;
  body?: string;
  greeting?: string;
  name?: string;
  handle?: string;
  ctaText?: string;
}

export interface StyleSettings {
  overlayOpacity: 'light' | 'medium' | 'heavy';
  textAlignment: 'left' | 'bottom-left' | 'centered';
  fontSize: 'small' | 'medium' | 'large';
  preset?: string;
}

export interface ReferenceStyle {
  backgroundColor?: string;
  backgroundPattern?: 'none' | 'grid' | 'dots' | 'lines';
  textColor?: string;
  headlineColor?: string;
  accentColor?: string;
  highlightStyle?: 'none' | 'box' | 'underline';
  ctaColor?: string;
  headlineFont?: string;
  bodyFont?: string;
}

interface SlideImage {
  base64: string;
  name: string;
  usage: 'background' | 'inline';
  // 0-based slide index this image is pinned to. null/undefined = auto.
  slideAssignment?: number | null;
}

interface CarouselRendererProps {
  slides: CarouselSlide[];
  brandColour: string;
  clientName: string;
  handle?: string;
  slideImages?: SlideImage[];
  styleSettings?: StyleSettings;
  referenceStyle?: ReferenceStyle;
}

const defaultStyle: StyleSettings = {
  overlayOpacity: 'medium',
  textAlignment: 'left',
  fontSize: 'medium',
};

// Stable empty-array reference so the default doesn't change identity each render
// (which would otherwise trip useEffect([propImages]) into an infinite update loop).
const EMPTY_IMAGES: SlideImage[] = [];

// Curated font list — must match families loaded in app/layout.tsx
const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Bebas Neue (display)', value: "'Bebas Neue', sans-serif" },
  { label: 'Barlow Condensed', value: "'Barlow Condensed', sans-serif" },
  { label: 'Playfair Display (serif)', value: "'Playfair Display', serif" },
  { label: 'Lora (serif)', value: "'Lora', serif" },
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Montserrat', value: "'Montserrat', sans-serif" },
  { label: 'Poppins', value: "'Poppins', sans-serif" },
  { label: 'Oswald', value: "'Oswald', sans-serif" },
  { label: 'DM Sans', value: "'DM Sans', sans-serif" },
  { label: 'Space Grotesk', value: "'Space Grotesk', sans-serif" },
  { label: 'Raleway', value: "'Raleway', sans-serif" },
];

// Three opinionated templates the user can switch between in one click
const TEMPLATES: Record<string, {
  label: string;
  swatch: string;
  style: StyleSettings;
  refStyle: ReferenceStyle;
}> = {
  minimalist: {
    label: 'Minimalist',
    swatch: '#FAFAFA',
    style: { overlayOpacity: 'medium', textAlignment: 'centered', fontSize: 'medium' },
    refStyle: {
      backgroundColor: '#FAFAFA',
      backgroundPattern: 'none',
      textColor: '#1A1A1A',
      headlineColor: '#1A1A1A',
      accentColor: '#C4A574',
      highlightStyle: 'none',
      ctaColor: '#1A1A1A',
      headlineFont: "'Inter', sans-serif",
      bodyFont: "'Inter', sans-serif",
    },
  },
  bold: {
    label: 'Bold',
    swatch: '#1A1A1A',
    style: { overlayOpacity: 'heavy', textAlignment: 'left', fontSize: 'large' },
    refStyle: {
      backgroundColor: '#1A1A1A',
      backgroundPattern: 'none',
      textColor: '#FFFFFF',
      headlineColor: '#FFFFFF',
      accentColor: '#FF4500',
      highlightStyle: 'box',
      ctaColor: '#FF4500',
      headlineFont: "'Bebas Neue', sans-serif",
      bodyFont: "'Barlow Condensed', sans-serif",
    },
  },
  earthy: {
    label: 'Earthy',
    swatch: '#D4A574',
    style: { overlayOpacity: 'medium', textAlignment: 'bottom-left', fontSize: 'medium' },
    refStyle: {
      backgroundColor: '#D4A574',
      backgroundPattern: 'none',
      textColor: '#3D2817',
      headlineColor: '#3D2817',
      accentColor: '#8B5A2B',
      highlightStyle: 'underline',
      ctaColor: '#3D2817',
      headlineFont: "'Playfair Display', serif",
      bodyFont: "'Lora', serif",
    },
  },
};

export default function CarouselRenderer({
  slides: propSlides,
  brandColour,
  clientName,
  handle,
  slideImages: propImages = EMPTY_IMAGES,
  styleSettings: propStyle,
  referenceStyle: propRefStyle,
}: CarouselRendererProps) {
  // Internal state initialized from props
  const [localSlides, setLocalSlides] = useState<CarouselSlide[]>(propSlides);
  const [localImages, setLocalImages] = useState<SlideImage[]>(propImages);
  const [style, setStyle] = useState<StyleSettings>(propStyle || defaultStyle);
  const [refStyle, setRefStyle] = useState<ReferenceStyle | undefined>(propRefStyle);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportingCurrent, setExportingCurrent] = useState(false);
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [showCopyPanel, setShowCopyPanel] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [library, setLibrary] = useState<LibraryImage[]>([]);
  const [savedIdsThisRow, setSavedIdsThisRow] = useState<Record<number, string>>({});
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load saved image library on mount
  useEffect(() => {
    listLibraryImages().then(setLibrary).catch(() => setLibrary([]));
  }, []);

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
    setLocalImages(prev => [
      ...prev,
      { base64: libImg.base64, name: libImg.name, usage: 'background' },
    ]);
  };

  const handleRemoveFromLibrary = async (id: string) => {
    await removeLibraryImage(id);
    setLibrary(prev => prev.filter(i => i.id !== id));
  };

  // Re-initialize when props change (e.g. regeneration)
  useEffect(() => { setLocalSlides(propSlides); }, [propSlides]);
  useEffect(() => { setLocalImages(propImages); }, [propImages]);
  useEffect(() => { if (propStyle) setStyle(propStyle); }, [propStyle]);
  useEffect(() => { setRefStyle(propRefStyle); }, [propRefStyle]);

  const totalSlides = localSlides.length;
  // Use accent from reference style, or fall back to default yellow
  const secondaryColor = refStyle?.accentColor || '#F5C842';

  // Style-derived values
  const overlayAlpha = style.overlayOpacity === 'light' ? 0.3 : style.overlayOpacity === 'heavy' ? 0.7 : 0.5;
  const fontScale = style.fontSize === 'small' ? 0.85 : style.fontSize === 'large' ? 1.15 : 1;

  // Distribute images across slides
  const bgImages = localImages.filter(img => img.usage === 'background');

  const getSlideImage = (slideIdx: number): string | undefined => {
    if (bgImages.length === 0) return undefined;
    // 1. Explicit pin wins
    const pinned = bgImages.find(img => img.slideAssignment === slideIdx);
    if (pinned) return pinned.base64;
    // 2. Auto-distribute the unpinned images across ALL slides (cover included),
    //    skipping any slot already filled by a pinned image so the same image
    //    doesn't appear twice in a row.
    const unpinned = bgImages.filter(img => img.slideAssignment == null);
    if (unpinned.length === 0) return undefined;
    if (unpinned.length === 1) return unpinned[0].base64;
    return unpinned[slideIdx % unpinned.length]?.base64;
  };

  const prevSlide = () =>
    setCurrentIndex((i) => (i - 1 + totalSlides) % totalSlides);
  const nextSlide = () =>
    setCurrentIndex((i) => (i + 1) % totalSlides);

  // Slide text editing
  const updateSlideField = (idx: number, field: string, value: string) => {
    setLocalSlides(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  // Image management
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = [...localImages];
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
    setLocalImages(newImages);
  };

  const removeImage = (idx: number) => {
    setLocalImages(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleImageUsage = (idx: number) => {
    setLocalImages(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], usage: next[idx].usage === 'background' ? 'inline' : 'background' };
      return next;
    });
  };

  const setImageAssignment = (idx: number, slideIdx: number | null) => {
    setLocalImages(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], slideAssignment: slideIdx };
      return next;
    });
  };

  // Style controls
  const updateRefStyle = (patch: Partial<ReferenceStyle>) => {
    setRefStyle(prev => ({ ...(prev || {}), ...patch }));
    setActiveTemplate(null);
  };
  const updateStyle = (patch: Partial<StyleSettings>) => {
    setStyle(prev => ({ ...prev, ...patch }));
    setActiveTemplate(null);
  };
  const applyTemplate = (key: keyof typeof TEMPLATES) => {
    const t = TEMPLATES[key];
    setRefStyle(t.refStyle);
    setStyle(t.style);
    setActiveTemplate(key);
  };

  const captureSlide = useCallback(
    async (index: number): Promise<HTMLCanvasElement | null> => {
      const el = slideRefs.current[index];
      if (!el) return null;
      return html2canvas(el, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        width: 420,
        height: 525,
      });
    },
    []
  );

  const exportSlide = useCallback(
    async (index: number) => {
      const canvas = await captureSlide(index);
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `${clientName.toLowerCase().replace(/\s+/g, '-')}-slide-${index + 1}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    },
    [captureSlide, clientName]
  );

  const handleExportCurrent = useCallback(async () => {
    setExportingCurrent(true);
    await exportSlide(currentIndex);
    setExportingCurrent(false);
  }, [currentIndex, exportSlide]);

  const handleExportAll = useCallback(async () => {
    setExporting(true);
    for (let i = 0; i < totalSlides; i++) {
      await exportSlide(i);
      await new Promise((r) => setTimeout(r, 250));
    }
    setExporting(false);
  }, [totalSlides, exportSlide]);

  const renderSlide = (slide: CarouselSlide, idx: number, isActive: boolean) => {
    const bgImage = getSlideImage(idx);
    const hasImage = !!bgImage;

    return (
      <div
        key={`slide-${slide.slide}-${isActive ? 'active' : 'offscreen'}`}
        ref={(el) => { slideRefs.current[idx] = el; }}
        style={{
          position: isActive ? 'relative' : 'absolute',
          top: 0,
          left: isActive ? 0 : -9999,
          width: 420,
          height: 525,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: isActive ? 8 : 0,
          boxShadow: isActive ? '0 8px 32px rgba(0,0,0,0.18)' : 'none',
        }}
      >
        {/* Background layer */}
        {hasImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/jpeg;base64,${bgImage}`}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 420,
                height: 525,
                objectFit: 'cover',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 420,
                height: 525,
                background: slide.type === 'cover'
                  ? `linear-gradient(180deg, rgba(0,0,0,${overlayAlpha * 0.3}) 0%, rgba(0,0,0,${overlayAlpha}) 100%)`
                  : `linear-gradient(180deg, rgba(0,0,0,${overlayAlpha * 0.4}) 0%, rgba(0,0,0,${overlayAlpha * 1.2}) 100%)`,
              }}
            />
          </>
        ) : (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 420,
              height: 525,
              ...getSlideBackground(slide.type, brandColour, refStyle),
            }}
          />
        )}

        {/* Background pattern overlay */}
        {!hasImage && refStyle?.backgroundPattern && refStyle.backgroundPattern !== 'none' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 420,
              height: 525,
              opacity: 0.12,
              backgroundImage: refStyle.backgroundPattern === 'grid'
                ? 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)'
                : refStyle.backgroundPattern === 'dots'
                  ? 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)'
                  : refStyle.backgroundPattern === 'lines'
                    ? 'repeating-linear-gradient(0deg, rgba(255,255,255,0.3), rgba(255,255,255,0.3) 1px, transparent 1px, transparent 40px)'
                    : 'none',
              backgroundSize: refStyle.backgroundPattern === 'grid'
                ? '40px 40px'
                : refStyle.backgroundPattern === 'dots'
                  ? '20px 20px'
                  : '100% 40px',
            }}
          />
        )}

        {/* Content layer */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: 420,
            height: 525,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: slide.type === 'cta'
              ? 'center'
              : style.textAlignment === 'centered' ? 'center' : 'flex-end',
            alignItems: slide.type === 'cta'
              ? 'center'
              : style.textAlignment === 'centered' ? 'center' : 'flex-start',
          }}
        >
          {slide.type === 'cover' && (
            <CoverSlide
              slide={slide}
              slideIndex={idx}
              hasImage={hasImage}
              brandColour={brandColour}
              fontScale={fontScale}
              textAlignment={style.textAlignment}
              onUpdate={updateSlideField}
              refStyle={refStyle}
            />
          )}
          {(slide.type === 'content-light' || slide.type === 'content-dark') && (
            <ContentSlide
              slide={slide}
              slideIndex={idx}
              brandColour={brandColour}
              secondaryColor={secondaryColor}
              totalSlides={totalSlides}
              handle={handle || `@${clientName.toLowerCase().replace(/\s+/g, '')}`}
              hasImage={hasImage}
              fontScale={fontScale}
              textAlignment={style.textAlignment}
              onUpdate={updateSlideField}
              refStyle={refStyle}
            />
          )}
          {slide.type === 'cta' && (
            <CtaSlide
              slide={slide}
              slideIndex={idx}
              secondaryColor={secondaryColor}
              hasImage={hasImage}
              fontScale={fontScale}
              onUpdate={updateSlideField}
              refStyle={refStyle}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      {/* Main slide viewer with navigation arrows */}
      <div className="relative flex items-center gap-3">
        <button
          onClick={prevSlide}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: brandColour }}
          aria-label="Previous slide"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="relative" style={{ width: 420, height: 525 }}>
          {localSlides.map((slide, idx) => renderSlide(slide, idx, idx === currentIndex))}
        </div>

        <button
          onClick={nextSlide}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: brandColour }}
          aria-label="Next slide"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Slide counter */}
      <div className="mt-4 font-ui text-sm font-semibold text-text-secondary">
        Slide {currentIndex + 1} of {totalSlides}
      </div>

      {/* Thumbnail strip */}
      <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 px-1">
        {localSlides.map((slide, idx) => {
          const bgImg = getSlideImage(idx);
          return (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className="flex-shrink-0 rounded-md overflow-hidden transition-all"
              style={{
                width: 64,
                height: 80,
                border: idx === currentIndex ? `2px solid ${brandColour}` : '2px solid transparent',
                opacity: idx === currentIndex ? 1 : 0.6,
              }}
              aria-label={`Go to slide ${idx + 1}`}
            >
              <div
                style={{
                  width: 60,
                  height: 76,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                  fontSize: 7,
                  lineHeight: 1.2,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  overflow: 'hidden',
                  position: 'relative',
                  ...(bgImg ? {} : getSlideBackground(slide.type, brandColour, refStyle)),
                }}
              >
                {bgImg && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/jpeg;base64,${bgImg}`}
                      alt=""
                      style={{ position: 'absolute', top: 0, left: 0, width: 60, height: 76, objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: 0, left: 0, width: 60, height: 76, background: 'rgba(0,0,0,0.4)' }} />
                  </>
                )}
                <span
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 8,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    color: '#FAF7F2',
                  }}
                >
                  {slide.type === 'cover' && truncate(slide.headline || '', 25)}
                  {(slide.type === 'content-light' || slide.type === 'content-dark') && truncate(slide.headline || slide.heading || '', 25)}
                  {slide.type === 'cta' && (slide.ctaText || 'Follow')}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Export buttons */}
      <div className="flex items-center justify-center gap-3 mt-5">
        <button
          onClick={handleExportCurrent}
          disabled={exportingCurrent}
          className="px-5 py-2.5 rounded-full font-ui text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ backgroundColor: secondaryColor, color: '#2D2D2D' }}
        >
          {exportingCurrent ? 'Exporting...' : 'Export Current Slide'}
        </button>
        <button
          onClick={handleExportAll}
          disabled={exporting}
          className="px-5 py-2.5 rounded-full font-ui text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ backgroundColor: brandColour }}
        >
          {exporting ? `Exporting ${totalSlides} slides...` : 'Export All as PNG'}
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
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide">
                    Saved ({library.length}) — click to add
                  </p>
                </div>
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
                {(() => {
                  // Compute auto-assigned slide for each unpinned image so we can show a slide number badge
                  const unpinnedOrder = localImages
                    .map((img, i) => ({ img, i }))
                    .filter(({ img }) => img.usage === 'background' && img.slideAssignment == null);
                  const autoSlideFor = new Map<number, number>();
                  unpinnedOrder.forEach(({ i }, order) => {
                    autoSlideFor.set(i, order % Math.max(localSlides.length, 1));
                  });
                  return localImages.map((img, idx) => {
                    const isBg = img.usage === 'background';
                    const resolvedSlide = img.slideAssignment ?? autoSlideFor.get(idx);
                    const slideLabel = !isBg
                      ? 'Inline'
                      : img.slideAssignment != null
                        ? `Slide ${img.slideAssignment + 1}`
                        : resolvedSlide != null
                          ? `Slide ${resolvedSlide + 1} (auto)`
                          : 'Auto';
                    return (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-cream/40 rounded-lg border border-border-light">
                        <div className="relative flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`data:image/jpeg;base64,${img.base64}`}
                            alt={img.name}
                            className="rounded"
                            style={{ width: 48, height: 60, objectFit: 'cover' }}
                          />
                          {isBg && resolvedSlide != null && (
                            <span
                              className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full flex items-center justify-center font-ui text-[11px] font-bold text-white shadow"
                              style={{ backgroundColor: brandColour }}
                              title={img.slideAssignment != null ? `Pinned to slide ${img.slideAssignment + 1}` : `Auto-assigned to slide ${resolvedSlide + 1}`}
                            >
                              {resolvedSlide + 1}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-ui text-xs text-text-primary truncate">{img.name}</p>
                          <button
                            type="button"
                            onClick={() => toggleImageUsage(idx)}
                            className="font-ui text-[10px] text-brown hover:underline mt-0.5"
                          >
                            {img.usage === 'background' ? 'Background' : 'Inline'} — tap to switch
                          </button>
                        </div>
                        {isBg && (
                          <select
                            value={img.slideAssignment ?? ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setImageAssignment(idx, v === '' ? null : Number(v));
                            }}
                            className="font-ui text-xs px-2 py-1 rounded-md border border-border-light bg-white focus:outline-none focus:border-brown flex-shrink-0"
                            title={slideLabel}
                          >
                            <option value="">Auto</option>
                            {localSlides.map((s, i) => (
                              <option key={i} value={i}>
                                Slide {i + 1}
                                {s.type === 'cover' ? ' (cover)' : s.type === 'cta' ? ' (CTA)' : ''}
                              </option>
                            ))}
                          </select>
                        )}
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
                    );
                  });
                })()}
              </div>
            )}
            {localImages.length === 0 && (
              <p className="font-ui text-xs text-text-muted text-center py-2">No images yet. Upload photos to use as slide backgrounds.</p>
            )}
          </div>
        )}
      </div>

      {/* Style section — templates + manual controls */}
      <div className="w-full mt-4">
        <button
          onClick={() => setShowStylePanel(!showStylePanel)}
          className="flex items-center gap-2 font-ui text-sm font-semibold text-brown hover:opacity-80 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          Style
          <svg
            className={`w-3 h-3 transition-transform ${showStylePanel ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showStylePanel && (
          <div className="mt-3 p-4 bg-white rounded-xl border border-border-light space-y-4">
            {/* Templates */}
            <div>
              <p className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">Template</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(TEMPLATES) as (keyof typeof TEMPLATES)[]).map((key) => {
                  const t = TEMPLATES[key];
                  const isActive = activeTemplate === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyTemplate(key)}
                      className={`flex flex-col items-stretch rounded-lg border-2 overflow-hidden transition-all ${
                        isActive ? 'border-brown shadow-md' : 'border-border-light hover:border-brown/60'
                      }`}
                    >
                      <div
                        className="h-16 flex items-end justify-start p-2"
                        style={{
                          backgroundColor: t.refStyle.backgroundColor,
                          color: t.refStyle.headlineColor,
                          fontFamily: t.refStyle.headlineFont,
                        }}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider">Aa</span>
                      </div>
                      <div className="px-2 py-1.5 bg-cream/40 text-left">
                        <span className="font-ui text-xs font-semibold text-text-primary">{t.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-3">
              <ColorRow
                label="Background"
                value={refStyle?.backgroundColor || '#FAF7F2'}
                onChange={(v) => updateRefStyle({ backgroundColor: v })}
              />
              <ColorRow
                label="Accent"
                value={refStyle?.accentColor || '#F5C842'}
                onChange={(v) => updateRefStyle({ accentColor: v })}
              />
              <ColorRow
                label="Headline"
                value={refStyle?.headlineColor || '#1A1A1A'}
                onChange={(v) => updateRefStyle({ headlineColor: v })}
              />
              <ColorRow
                label="Body text"
                value={refStyle?.textColor || '#2D2D2D'}
                onChange={(v) => updateRefStyle({ textColor: v })}
              />
            </div>

            {/* Fonts */}
            <div className="grid grid-cols-2 gap-3">
              <FontRow
                label="Headline font"
                value={refStyle?.headlineFont || "'Bebas Neue', sans-serif"}
                onChange={(v) => updateRefStyle({ headlineFont: v })}
              />
              <FontRow
                label="Body font"
                value={refStyle?.bodyFont || "'Barlow Condensed', sans-serif"}
                onChange={(v) => updateRefStyle({ bodyFont: v })}
              />
            </div>

            {/* Placement + Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">Text placement</p>
                <div className="flex rounded-lg border border-border-light overflow-hidden">
                  {(['left', 'centered', 'bottom-left'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updateStyle({ textAlignment: opt })}
                      className={`flex-1 px-2 py-1.5 font-ui text-[11px] capitalize transition-colors ${
                        style.textAlignment === opt
                          ? 'bg-brown text-white'
                          : 'bg-white text-text-secondary hover:bg-cream/60'
                      }`}
                    >
                      {opt.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">Text size</p>
                <div className="flex rounded-lg border border-border-light overflow-hidden">
                  {(['small', 'medium', 'large'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updateStyle({ fontSize: opt })}
                      className={`flex-1 px-2 py-1.5 font-ui text-[11px] capitalize transition-colors ${
                        style.fontSize === opt
                          ? 'bg-brown text-white'
                          : 'bg-white text-text-secondary hover:bg-cream/60'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Highlight + Pattern */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">Headline highlight</p>
                <div className="flex rounded-lg border border-border-light overflow-hidden">
                  {(['none', 'box', 'underline'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updateRefStyle({ highlightStyle: opt })}
                      className={`flex-1 px-2 py-1.5 font-ui text-[11px] capitalize transition-colors ${
                        (refStyle?.highlightStyle || 'none') === opt
                          ? 'bg-brown text-white'
                          : 'bg-white text-text-secondary hover:bg-cream/60'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">Background pattern</p>
                <div className="flex rounded-lg border border-border-light overflow-hidden">
                  {(['none', 'grid', 'dots', 'lines'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updateRefStyle({ backgroundPattern: opt })}
                      className={`flex-1 px-2 py-1.5 font-ui text-[11px] capitalize transition-colors ${
                        (refStyle?.backgroundPattern || 'none') === opt
                          ? 'bg-brown text-white'
                          : 'bg-white text-text-secondary hover:bg-cream/60'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Copy section — explicit text inputs for every slide */}
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
              Edit any field below — changes appear instantly on the slide. You can also click directly on slide text to edit in place.
            </p>
            {localSlides.map((slide, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-cream/40 border border-border-light space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-ui text-[10px] font-semibold text-brown bg-brown/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Slide {idx + 1}
                  </span>
                  <span className="font-ui text-[10px] text-text-muted uppercase tracking-wider">{slide.type}</span>
                </div>

                {slide.type === 'cover' && (
                  <>
                    <CopyField label="Headline" value={slide.headline || ''} onChange={(v) => updateSlideField(idx, 'headline', v)} />
                    <CopyField label="Subtitle" value={slide.subtitle || ''} onChange={(v) => updateSlideField(idx, 'subtitle', v)} multiline />
                    <CopyField label="Hashtag" value={slide.hashtag || ''} onChange={(v) => updateSlideField(idx, 'hashtag', v)} />
                  </>
                )}

                {(slide.type === 'content-light' || slide.type === 'content-dark') && (
                  <>
                    <CopyField
                      label="Headline"
                      value={slide.headline || slide.heading || ''}
                      onChange={(v) => updateSlideField(idx, slide.headline !== undefined ? 'headline' : 'heading', v)}
                    />
                    <CopyField label="Body" value={slide.body || ''} onChange={(v) => updateSlideField(idx, 'body', v)} multiline />
                  </>
                )}

                {slide.type === 'cta' && (
                  <>
                    <CopyField label="Greeting" value={slide.greeting || ''} onChange={(v) => updateSlideField(idx, 'greeting', v)} />
                    <CopyField label="Name" value={slide.name || ''} onChange={(v) => updateSlideField(idx, 'name', v)} />
                    <CopyField label="Handle" value={slide.handle || ''} onChange={(v) => updateSlideField(idx, 'handle', v)} />
                    <CopyField label="CTA text" value={slide.ctaText || ''} onChange={(v) => updateSlideField(idx, 'ctaText', v)} />
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Color picker row ---- */
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
    <label className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-9 h-9 rounded-lg border border-border-light cursor-pointer p-0.5 bg-white flex-shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide">{label}</p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full font-ui text-xs px-2 py-1 border border-border-light rounded-md bg-white focus:outline-none focus:border-brown"
        />
      </div>
    </label>
  );
}

/* ---- Font picker row ---- */
function FontRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label>
      <p className="font-ui text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full font-ui text-xs px-2 py-1.5 border border-border-light rounded-md bg-white focus:outline-none focus:border-brown"
        style={{ fontFamily: value }}
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
            {f.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ---- Single field row in Edit Copy panel ---- */
function CopyField({
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
          rows={3}
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

/* ---- Editable text field ---- */
function EditableText({
  value,
  onChange,
  style: textStyle,
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  style: React.CSSProperties;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => { setLocalVal(value); }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  if (editing) {
    const shared: React.CSSProperties = {
      ...textStyle,
      background: 'rgba(255,255,255,0.15)',
      border: '1px solid rgba(255,255,255,0.3)',
      borderRadius: 4,
      padding: '2px 6px',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box',
    };

    const handleDone = () => {
      setEditing(false);
      onChange(localVal);
    };

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onBlur={handleDone}
          onKeyDown={(e) => { if (e.key === 'Escape') handleDone(); }}
          style={{ ...shared, resize: 'vertical', minHeight: 60 }}
          rows={3}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={handleDone}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') handleDone();
        }}
        style={shared}
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      style={{
        ...textStyle,
        cursor: 'pointer',
        position: 'relative',
      }}
      className="group/edit"
      title="Click to edit"
    >
      {value || '(click to edit)'}
      <svg
        className="opacity-0 group-hover/edit:opacity-70 transition-opacity"
        style={{
          position: 'absolute',
          top: -2,
          right: -18,
          width: 14,
          height: 14,
        }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </div>
  );
}

/* ---- Slide background helper ---- */
function getSlideBackground(
  type: CarouselSlide['type'],
  primary: string,
  refStyle?: ReferenceStyle
): React.CSSProperties {
  // If reference style has a background colour, use it
  if (refStyle?.backgroundColor) {
    const bg = refStyle.backgroundColor;
    // For light slides, lighten the background slightly
    if (type === 'content-light') {
      return { backgroundColor: lightenColor(bg, 15) };
    }
    return { backgroundColor: bg };
  }

  switch (type) {
    case 'cover':
      return { backgroundColor: primary };
    case 'content-light':
      return { backgroundColor: '#FAF7F2' };
    case 'content-dark':
      return { backgroundColor: primary };
    case 'cta':
      return { backgroundColor: primary };
    default:
      return {};
  }
}

/* ---- Colour utilities ---- */
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * percent / 100));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * percent / 100));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * percent / 100));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

function isLightColor(hex: string): boolean {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

/* ---- Truncate helper ---- */
function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '...' : str;
}

/* ================================================================
   Slide sub-components — Editorial style with headline + body
   ================================================================ */

function CoverSlide({
  slide,
  slideIndex,
  hasImage,
  brandColour,
  fontScale,
  textAlignment,
  onUpdate,
  refStyle,
}: {
  slide: CarouselSlide;
  slideIndex: number;
  hasImage: boolean;
  brandColour: string;
  fontScale: number;
  textAlignment: string;
  onUpdate: (idx: number, field: string, value: string) => void;
  refStyle?: ReferenceStyle;
}) {
  const isCentered = textAlignment === 'centered';
  const bgIsDark = refStyle?.backgroundColor ? !isLightColor(refStyle.backgroundColor) : true;
  const headColor = refStyle?.headlineColor || '#FFFFFF';
  const textColor = refStyle?.textColor || 'rgba(255,255,255,0.85)';
  const accentColor = refStyle?.accentColor || (brandColour === '#F5C842' ? '#FFFFFF' : '#F5C842');
  const highlight = refStyle?.highlightStyle || 'none';
  const headFont = refStyle?.headlineFont || "'Bebas Neue', sans-serif";
  const bodyFont = refStyle?.bodyFont || "'Barlow Condensed', sans-serif";

  return (
    <div style={{ padding: '0 36px 36px', width: 420, textAlign: isCentered ? 'center' : 'left' }}>
      {/* Slide badge top-right */}
      {slide.hashtag && (
        <div
          style={{
            position: 'absolute',
            top: 24,
            right: 28,
            fontFamily: bodyFont,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 1,
            color: hasImage ? 'rgba(255,255,255,0.7)' : (bgIsDark ? 'rgba(250,247,242,0.6)' : 'rgba(45,45,45,0.5)'),
            backgroundColor: hasImage ? 'rgba(0,0,0,0.3)' : 'transparent',
            padding: hasImage ? '4px 10px' : 0,
            borderRadius: 20,
          }}
        >
          {slide.hashtag}
        </div>
      )}

      {/* Large headline — editable, with optional highlight box */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {highlight === 'box' && (
          <div style={{
            position: 'absolute',
            top: -4,
            left: -8,
            right: -8,
            bottom: -4,
            backgroundColor: accentColor,
            borderRadius: 8,
            zIndex: 0,
          }} />
        )}
        <EditableText
          value={slide.headline || ''}
          onChange={(v) => onUpdate(slideIndex, 'headline', v)}
          style={{
            position: 'relative',
            zIndex: 1,
            fontFamily: headFont,
            fontSize: Math.round((hasImage ? 44 : 40) * fontScale),
            fontWeight: 900,
            lineHeight: 1.05,
            textTransform: 'uppercase' as const,
            letterSpacing: -0.5,
            color: highlight === 'box' ? (isLightColor(accentColor) ? '#1a1a1a' : '#FFFFFF') : headColor,
            textShadow: hasImage ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
            marginBottom: slide.subtitle ? 16 : 0,
            ...(highlight === 'underline' ? { borderBottom: `4px solid ${accentColor}`, paddingBottom: 4, display: 'inline' } : {}),
          }}
        />
      </div>

      {/* Subtitle — editable */}
      {slide.subtitle !== undefined && (
        <EditableText
          value={slide.subtitle || ''}
          onChange={(v) => onUpdate(slideIndex, 'subtitle', v)}
          style={{
            fontFamily: bodyFont,
            fontSize: Math.round(15 * fontScale),
            lineHeight: 1.5,
            color: textColor,
            textShadow: hasImage ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
            maxWidth: isCentered ? 'none' : 340,
          }}
          multiline
        />
      )}

      {/* Swipe indicator — bottom-right only (handle removed to avoid overlap with subtitle) */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          right: 36,
        }}
      >
        <span
          style={{
            fontFamily: bodyFont,
            fontSize: 18,
            color: bgIsDark ? 'rgba(255,255,255,0.45)' : 'rgba(45,45,45,0.3)',
          }}
        >
          &rarr;
        </span>
      </div>

    </div>
  );
}

function ContentSlide({
  slide,
  slideIndex,
  brandColour,
  secondaryColor,
  totalSlides,
  handle,
  hasImage,
  fontScale,
  textAlignment,
  onUpdate,
  refStyle,
}: {
  slide: CarouselSlide;
  slideIndex: number;
  brandColour: string;
  secondaryColor: string;
  totalSlides: number;
  handle: string;
  hasImage: boolean;
  fontScale: number;
  textAlignment: string;
  onUpdate: (idx: number, field: string, value: string) => void;
  refStyle?: ReferenceStyle;
}) {
  const isLight = !hasImage && slide.type === 'content-light';
  const bgIsDark = refStyle?.backgroundColor ? !isLightColor(refStyle.backgroundColor) : (hasImage || !isLight);
  const textColor = refStyle?.textColor || (bgIsDark ? '#FFFFFF' : '#2D2D2D');
  const headColor = refStyle?.headlineColor || (bgIsDark ? '#FFFFFF' : brandColour);
  const metaColor = bgIsDark ? 'rgba(255,255,255,0.5)' : 'rgba(45,45,45,0.45)';
  const accentColor = refStyle?.accentColor || secondaryColor;
  const highlight = refStyle?.highlightStyle || 'none';
  const isCentered = textAlignment === 'centered';
  const headFont = refStyle?.headlineFont || "'Bebas Neue', sans-serif";
  const bodyFont = refStyle?.bodyFont || "'Barlow Condensed', sans-serif";

  return (
    <div style={{ padding: '0 36px 36px', width: 420, textAlign: isCentered ? 'center' : 'left' }}>
      {/* Slide badge top-right */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          right: 28,
          fontFamily: bodyFont,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1,
          color: metaColor,
          backgroundColor: hasImage ? 'rgba(0,0,0,0.3)' : 'transparent',
          padding: hasImage ? '3px 8px' : 0,
          borderRadius: 12,
        }}
      >
        {slide.slide}/{totalSlides}
      </div>

      {/* Bold headline — editable, with optional highlight */}
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
        {highlight === 'box' && (
          <div style={{
            position: 'absolute',
            top: -3,
            left: -6,
            right: -6,
            bottom: -3,
            backgroundColor: accentColor,
            borderRadius: 6,
            zIndex: 0,
          }} />
        )}
        <EditableText
          value={slide.headline || slide.heading || ''}
          onChange={(v) => onUpdate(slideIndex, slide.headline !== undefined ? 'headline' : 'heading', v)}
          style={{
            position: 'relative',
            zIndex: 1,
            fontFamily: headFont,
            fontSize: Math.round((hasImage ? 34 : 30) * fontScale),
            fontWeight: 900,
            lineHeight: 1.08,
            textTransform: 'uppercase' as const,
            letterSpacing: -0.3,
            color: highlight === 'box' ? (isLightColor(accentColor) ? '#1a1a1a' : '#FFFFFF') : headColor,
            textShadow: hasImage ? '0 2px 6px rgba(0,0,0,0.4)' : 'none',
            ...(highlight === 'underline' ? { borderBottom: `3px solid ${accentColor}`, paddingBottom: 3 } : {}),
          }}
        />
      </div>

      {/* Body text — editable */}
      <EditableText
        value={slide.body || ''}
        onChange={(v) => onUpdate(slideIndex, 'body', v)}
        style={{
          fontFamily: bodyFont,
          fontSize: Math.round(15 * fontScale),
          lineHeight: 1.55,
          color: hasImage ? 'rgba(255,255,255,0.9)' : textColor,
          textShadow: hasImage ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
          opacity: hasImage ? 1 : 0.9,
        }}
        multiline
      />

      {/* Emphasis line */}
      {highlight === 'none' && (
        <div
          style={{
            width: 40,
            height: 3,
            backgroundColor: accentColor,
            marginTop: 18,
            borderRadius: 2,
            opacity: hasImage ? 0.9 : 1,
            marginLeft: isCentered ? 'auto' : 0,
            marginRight: isCentered ? 'auto' : 0,
          }}
        />
      )}

      {/* Handle — bottom left */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 36,
          fontFamily: bodyFont,
          fontSize: 12,
          fontWeight: 500,
          color: metaColor,
        }}
      >
        {handle}
      </div>
    </div>
  );
}

function CtaSlide({
  slide,
  slideIndex,
  secondaryColor,
  hasImage,
  fontScale,
  onUpdate,
  refStyle,
}: {
  slide: CarouselSlide;
  slideIndex: number;
  secondaryColor: string;
  hasImage: boolean;
  fontScale: number;
  onUpdate: (idx: number, field: string, value: string) => void;
  refStyle?: ReferenceStyle;
}) {
  const bgIsDark = refStyle?.backgroundColor ? !isLightColor(refStyle.backgroundColor) : true;
  const textColor = refStyle?.textColor || '#FAF7F2';
  const ctaBg = refStyle?.ctaColor || refStyle?.accentColor || secondaryColor;
  const ctaTextColor = isLightColor(ctaBg) ? '#1a1a1a' : '#FFFFFF';
  const headFont = refStyle?.headlineFont || "'Bebas Neue', sans-serif";
  const bodyFont = refStyle?.bodyFont || "'Barlow Condensed', sans-serif";

  return (
    <div
      style={{
        padding: 40,
        width: 420,
        height: 525,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Greeting — editable */}
      <EditableText
        value={slide.greeting || "Hey, I'm"}
        onChange={(v) => onUpdate(slideIndex, 'greeting', v)}
        style={{
          fontFamily: bodyFont,
          fontSize: Math.round(17 * fontScale),
          fontWeight: 400,
          marginBottom: 6,
          opacity: 0.8,
          color: textColor,
          textShadow: hasImage ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
        }}
      />
      {/* Name — editable */}
      <EditableText
        value={slide.name || ''}
        onChange={(v) => onUpdate(slideIndex, 'name', v)}
        style={{
          fontFamily: headFont,
          fontSize: Math.round(38 * fontScale),
          fontWeight: 900,
          marginBottom: 8,
          letterSpacing: 1,
          color: bgIsDark ? '#FAF7F2' : '#1a1a1a',
          textShadow: hasImage ? '0 2px 6px rgba(0,0,0,0.4)' : 'none',
        }}
      />
      {/* Handle — editable */}
      <EditableText
        value={slide.handle || ''}
        onChange={(v) => onUpdate(slideIndex, 'handle', v)}
        style={{
          fontFamily: bodyFont,
          fontSize: Math.round(15 * fontScale),
          fontWeight: 500,
          marginBottom: 32,
          opacity: 0.65,
          color: textColor,
        }}
      />
      {/* CTA button — editable */}
      <EditableText
        value={slide.ctaText || 'Follow for more'}
        onChange={(v) => onUpdate(slideIndex, 'ctaText', v)}
        style={{
          display: 'inline-block',
          backgroundColor: ctaBg,
          color: ctaTextColor,
          fontFamily: headFont,
          fontSize: Math.round(15 * fontScale),
          fontWeight: 700,
          padding: '14px 40px',
          borderRadius: 50,
          textTransform: 'uppercase' as const,
          letterSpacing: 1.5,
        }}
      />
    </div>
  );
}
