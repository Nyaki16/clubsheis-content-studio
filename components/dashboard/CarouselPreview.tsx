'use client';

import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';

export interface CarouselSlide {
  slide: number;
  type: 'cover' | 'content-light' | 'content-dark' | 'cta';
  headline?: string;
  hashtag?: string;
  heading?: string;
  body?: string;
  greeting?: string;
  name?: string;
  handle?: string;
  ctaText?: string;
}

interface CarouselPreviewProps {
  slides: CarouselSlide[];
  brandColour: string;
  clientName: string;
  handle?: string;
}

export default function CarouselPreview({
  slides,
  brandColour,
  clientName,
  handle,
}: CarouselPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportingCurrent, setExportingCurrent] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const totalSlides = slides.length;

  const prevSlide = () => {
    setCurrentIndex((i) => (i - 1 + totalSlides) % totalSlides);
  };

  const nextSlide = () => {
    setCurrentIndex((i) => (i + 1) % totalSlides);
  };

  const accentColor = lightenColor(brandColour, 40);

  const cssVars = {
    '--color-primary': brandColour,
    '--color-secondary': '#F5C842',
    '--color-accent': accentColor,
    '--color-bg': '#FAF7F2',
    '--color-text': '#2D2D2D',
  } as React.CSSProperties;

  const exportSlide = useCallback(async (index: number): Promise<void> => {
    if (!frameRef.current) return;

    const prevIndex = currentIndex;
    setCurrentIndex(index);

    // Wait for render
    await new Promise((r) => setTimeout(r, 150));

    const slideEl = frameRef.current.querySelector('.carousel-slide-active') as HTMLElement;
    if (!slideEl) return;

    const canvas = await html2canvas(slideEl, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
      width: 420,
      height: 525,
    });

    const link = document.createElement('a');
    link.download = `${clientName.toLowerCase().replace(/\s+/g, '-')}-slide-${index + 1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    setCurrentIndex(prevIndex);
  }, [currentIndex, clientName]);

  const exportAllSlides = useCallback(async () => {
    if (!frameRef.current) return;
    setExporting(true);

    for (let i = 0; i < totalSlides; i++) {
      setCurrentIndex(i);
      await new Promise((r) => setTimeout(r, 300));

      const slideEl = frameRef.current.querySelector('.carousel-slide-active') as HTMLElement;
      if (!slideEl) continue;

      const canvas = await html2canvas(slideEl, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        width: 420,
        height: 525,
      });

      const link = document.createElement('a');
      link.download = `${clientName.toLowerCase().replace(/\s+/g, '-')}-slide-${i + 1}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      await new Promise((r) => setTimeout(r, 200));
    }

    setExporting(false);
  }, [totalSlides, clientName]);

  const handleExportCurrent = useCallback(async () => {
    setExportingCurrent(true);
    await exportSlide(currentIndex);
    setExportingCurrent(false);
  }, [currentIndex, exportSlide]);

  const currentSlide = slides[currentIndex];

  return (
    <div style={cssVars}>
      {/* Slide Frame */}
      <div
        ref={frameRef}
        className="relative mx-auto"
        style={{ width: 420, height: 525 }}
      >
        {/* Render all slides but only show active */}
        {slides.map((slide, idx) => (
          <div
            key={slide.slide}
            className={`absolute inset-0 flex flex-col justify-center ${
              idx === currentIndex ? 'carousel-slide-active' : ''
            }`}
            style={{
              width: 420,
              height: 525,
              display: idx === currentIndex ? 'flex' : 'none',
              overflow: 'hidden',
              borderRadius: 4,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              ...getSlideBackground(slide.type, brandColour),
            }}
          >
            {slide.type === 'cover' && (
              <CoverSlide
                slide={slide}
                brandColour={brandColour}
                accentColor={accentColor}
                clientName={clientName}
              />
            )}
            {slide.type === 'content-light' && (
              <ContentSlide
                slide={slide}
                variant="light"
                brandColour={brandColour}
                totalSlides={totalSlides}
                handle={handle || clientName}
              />
            )}
            {slide.type === 'content-dark' && (
              <ContentSlide
                slide={slide}
                variant="dark"
                brandColour={brandColour}
                totalSlides={totalSlides}
                handle={handle || clientName}
              />
            )}
            {slide.type === 'cta' && (
              <CtaSlide slide={slide} brandColour={brandColour} />
            )}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-3 mt-5">
        <button
          onClick={prevSlide}
          className="px-4 py-2 rounded-lg font-ui text-sm text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: brandColour }}
        >
          Prev
        </button>
        <span className="font-ui text-sm text-text-secondary">
          {currentIndex + 1} / {totalSlides}
        </span>
        <button
          onClick={nextSlide}
          className="px-4 py-2 rounded-lg font-ui text-sm text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: brandColour }}
        >
          Next
        </button>
      </div>

      {/* Export Buttons */}
      <div className="flex items-center justify-center gap-3 mt-3">
        <button
          onClick={handleExportCurrent}
          disabled={exportingCurrent}
          className="px-5 py-2.5 rounded-lg font-display text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ backgroundColor: '#F5C842' }}
        >
          {exportingCurrent ? 'Exporting...' : 'Export Current Slide'}
        </button>
        <button
          onClick={exportAllSlides}
          disabled={exporting}
          className="px-5 py-2.5 rounded-lg font-display text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ backgroundColor: brandColour }}
        >
          {exporting ? 'Exporting...' : 'Export All as PNG'}
        </button>
      </div>

      {/* Slide dots */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className="w-2 h-2 rounded-full transition-all"
            style={{
              backgroundColor:
                idx === currentIndex ? brandColour : '#D1D1D1',
              transform: idx === currentIndex ? 'scale(1.3)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---- Helper: Slide background styles ---- */
function getSlideBackground(
  type: CarouselSlide['type'],
  primary: string
): React.CSSProperties {
  switch (type) {
    case 'cover':
      return { backgroundColor: primary, color: '#FAF7F2' };
    case 'content-light':
      return { backgroundColor: '#FAF7F2', color: '#2D2D2D' };
    case 'content-dark':
      return { backgroundColor: primary, color: '#FAF7F2' };
    case 'cta':
      return {
        backgroundColor: primary,
        color: '#FAF7F2',
        textAlign: 'center',
        alignItems: 'center',
      };
    default:
      return {};
  }
}

/* ---- Helper: Lighten a hex color ---- */
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
  const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(2.55 * percent));
  const b = Math.min(255, (num & 0x0000ff) + Math.round(2.55 * percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/* ---- Sub-components for each slide type ---- */

function CoverSlide({
  slide,
  brandColour,
  accentColor,
  clientName,
}: {
  slide: CarouselSlide;
  brandColour: string;
  accentColor: string;
  clientName: string;
}) {
  return (
    <div className="relative flex flex-col justify-center" style={{ padding: 40, width: 420, height: 525 }}>
      {/* Hashtag */}
      {slide.hashtag && (
        <div
          className="absolute"
          style={{
            top: 24,
            left: 40,
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: accentColor,
          }}
        >
          {slide.hashtag}
        </div>
      )}
      {/* Headline */}
      <div
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 36,
          fontWeight: 900,
          lineHeight: 1.15,
          textTransform: 'uppercase',
          letterSpacing: -0.5,
          maxWidth: 340,
          color: '#FAF7F2',
        }}
      >
        {slide.headline}
      </div>
      {/* Byline */}
      <div
        className="absolute"
        style={{
          bottom: 28,
          left: 40,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 12,
          fontWeight: 500,
          color: '#FAF7F2',
          opacity: 0.8,
        }}
      >
        by {clientName}
      </div>
      {/* Swipe arrow */}
      <div
        className="absolute"
        style={{
          bottom: 28,
          right: 40,
          fontSize: 18,
          color: '#FAF7F2',
          opacity: 0.6,
        }}
      >
        &rarr;
      </div>
    </div>
  );
}

function ContentSlide({
  slide,
  variant,
  brandColour,
  totalSlides,
  handle,
}: {
  slide: CarouselSlide;
  variant: 'light' | 'dark';
  brandColour: string;
  totalSlides: number;
  handle: string;
}) {
  const isLight = variant === 'light';
  const headColor = isLight ? brandColour : '#FAF7F2';
  const bodyColor = isLight ? '#2D2D2D' : '#FAF7F2';
  const badgeColor = isLight ? '#2D2D2D' : '#FAF7F2';

  return (
    <div className="relative flex flex-col justify-center" style={{ padding: 40, width: 420, height: 525 }}>
      {/* Badge */}
      <div
        className="absolute"
        style={{
          top: 24,
          right: 28,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
          opacity: 0.5,
          color: badgeColor,
        }}
      >
        {slide.slide}/{totalSlides}
      </div>
      {/* Heading */}
      <div
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 26,
          fontWeight: 700,
          lineHeight: 1.2,
          marginBottom: 16,
          color: headColor,
        }}
      >
        {slide.heading}
      </div>
      {/* Body */}
      <div
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 16,
          lineHeight: 1.5,
          color: bodyColor,
          opacity: isLight ? 1 : 0.9,
        }}
      >
        {slide.body}
      </div>
      {/* Emphasis line */}
      <div
        style={{
          width: 40,
          height: 3,
          backgroundColor: '#F5C842',
          marginTop: 20,
          borderRadius: 2,
        }}
      />
      {/* Handle */}
      <div
        className="absolute"
        style={{
          bottom: 24,
          left: 40,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 11,
          fontWeight: 500,
          opacity: 0.5,
          color: badgeColor,
        }}
      >
        {handle}
      </div>
    </div>
  );
}

function CtaSlide({
  slide,
  brandColour,
}: {
  slide: CarouselSlide;
  brandColour: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ padding: 40, width: 420, height: 525, textAlign: 'center' }}
    >
      {/* Greeting */}
      <div
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 16,
          fontWeight: 400,
          marginBottom: 4,
          opacity: 0.8,
          color: '#FAF7F2',
        }}
      >
        {slide.greeting || "Hey, I'm"}
      </div>
      {/* Name */}
      <div
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 32,
          fontWeight: 900,
          marginBottom: 8,
          color: '#FAF7F2',
        }}
      >
        {slide.name}
      </div>
      {/* Handle */}
      <div
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 14,
          fontWeight: 500,
          marginBottom: 28,
          opacity: 0.7,
          color: '#FAF7F2',
        }}
      >
        {slide.handle}
      </div>
      {/* CTA Button */}
      <div
        style={{
          display: 'inline-block',
          backgroundColor: '#F5C842',
          color: '#ffffff',
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 14,
          fontWeight: 700,
          padding: '14px 36px',
          borderRadius: 50,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {slide.ctaText || 'Follow for more'}
      </div>
    </div>
  );
}
