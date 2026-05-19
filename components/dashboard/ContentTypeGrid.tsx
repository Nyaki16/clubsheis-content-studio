'use client';

import { ContentType, ContentTypeOption } from '@/types';

const contentTypes: ContentTypeOption[] = [
  { id: 'newsletter', label: 'Newsletter', description: 'Weekly member or client newsletter', icon: 'newsletter' },
  { id: 'carousel', label: 'Carousel', description: 'Multi-slide Instagram carousel', icon: 'carousel' },
  { id: 'reel', label: 'Reel Script', description: 'Short-form video script (30–90s)', icon: 'reel' },
  { id: 'static-image', label: 'Static Image / Poster', description: 'One-frame graphic or announcement', icon: 'static' },
  { id: 'video-animation', label: 'Video Animation', description: 'Animated explainer video with Remotion', icon: 'video' },
  { id: 'ad-creative', label: 'Ad Studio', description: 'Brand-matched static ads — opens Ad Studio', icon: 'ad', href: 'https://static-ad-studio.vercel.app' },
  { id: 'caption', label: 'Caption / Social Post', description: 'Single platform social post', icon: 'caption' },
  { id: 'transcript', label: 'Transcript → Content', description: 'Repurpose a transcript into multiple formats', icon: 'transcript' },
];

function ContentIcon({ type }: { type: string }) {
  const iconClass = 'w-6 h-6';
  switch (type) {
    case 'newsletter':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'carousel':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    case 'reel':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      );
    case 'static':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'video':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    case 'ad':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      );
    case 'caption':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'transcript':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    default:
      return null;
  }
}

interface Props {
  selectedType: ContentType | null;
  onSelect: (type: ContentType) => void;
}

export default function ContentTypeGrid({ selectedType, onSelect }: Props) {
  return (
    <div>
      <h2 className="font-ui text-xs font-semibold tracking-wider text-text-muted uppercase mb-4">
        Content Type
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {contentTypes.map((ct) => {
          const isSelected = !ct.href && selectedType === ct.id;
          const cardClass = `text-left p-5 rounded-xl border transition-all duration-200 hover:shadow-md group block ${
            isSelected
              ? 'bg-brown text-white border-brown shadow-md'
              : 'bg-white border-border-light hover:border-border'
          }`;
          const inner = (
            <>
              <div
                className={`mb-3 flex items-center gap-1 ${
                  isSelected ? 'text-white/80' : 'text-text-muted group-hover:text-brown'
                }`}
              >
                <ContentIcon type={ct.icon} />
                {ct.href && (
                  <svg className="w-3.5 h-3.5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 5h5v5m0-5L10 14M9 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-3" />
                  </svg>
                )}
              </div>
              <h3
                className={`font-ui font-semibold text-sm mb-0.5 ${
                  isSelected ? 'text-white' : 'text-text-primary'
                }`}
              >
                {ct.label}
              </h3>
              <p
                className={`font-ui text-xs ${
                  isSelected ? 'text-white/60' : 'text-text-muted'
                }`}
              >
                {ct.description}
              </p>
            </>
          );

          return ct.href ? (
            <a key={ct.id} href={ct.href} target="_blank" rel="noopener noreferrer" className={cardClass}>
              {inner}
            </a>
          ) : (
            <button key={ct.id} onClick={() => onSelect(ct.id)} className={cardClass}>
              {inner}
            </button>
          );
        })}
      </div>
    </div>
  );
}
