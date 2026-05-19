export interface SelectedClient {
  id: string;
  name: string;
  brandColour: string;
  tone: string;
  canvaBrandKitId?: string;
  logoUrl?: string;
  isOwnBrand: boolean;
  deliverables?: DeliverableProfile[];
}

export type ContentType =
  | 'newsletter'
  | 'carousel'
  | 'reel'
  | 'static-image'
  | 'video-animation'
  | 'ad-creative'
  | 'caption'
  | 'transcript';

export interface ContentTypeOption {
  id: ContentType;
  label: string;
  description: string;
  icon: string;
  /** When set, the card links out to this URL in a new tab instead of opening the in-app config. */
  href?: string;
}

// Universal fields
export interface UniversalConfig {
  topic: string;
  toneOverride: string;
  inspirationFiles: InspirationFile[];
  inspirationUrl?: string;
}

export interface InspirationFile {
  name: string;
  type: string;
  base64: string;
  mediaType: string;
}

// Newsletter
export interface NewsletterConfig {
  subjectLineAngle: string;
  cta: string;
  ctaUrl: string;
  length: 'short' | 'medium' | 'long';
  productImages?: { base64: string; name: string; caption?: string }[];
  style?: 'editorial' | 'product-launch' | 'minimal' | 'bold';
}

// Carousel
export interface CarouselImage {
  base64: string;
  name: string;
  usage: 'background' | 'inline';
  // Pin this image to a specific slide index (0-based). null/undefined = auto-distribute.
  slideAssignment?: number | null;
}

export interface CarouselConfig {
  slideCount: number;
  slideFormat: 'tips' | 'story' | 'before-after' | 'how-to' | 'quote';
  ctaSlide: boolean;
  canvaOutput: boolean;
  referenceImages: InspirationFile[];
  slideImages: CarouselImage[];
}

// Reel
export interface ReelConfig {
  duration: '15' | '30' | '60' | '90';
  hookStyle: 'bold-statement' | 'question' | 'controversial' | 'relatable' | 'stat';
  format: 'talk-to-camera' | 'voiceover' | 'text-only';
  platform: 'instagram' | 'tiktok' | 'youtube-shorts';
}

// Static Image / Poster
export interface StaticImageConfig {
  imagePurpose: 'announcement' | 'quote' | 'promotion' | 'event' | 'testimonial';
  format: '1:1' | '4:5' | '9:16' | '16:9';
  textToFeature: string;
  canvaOutput: boolean;
}

// Video Animation (Remotion)
export type VideoAspectRatio = '9:16' | '1:1' | '16:9' | '4:5';

export interface VideoColors {
  background: string;
  primaryText: string;
  accent: string;
  emphasis: string;
}

export interface VideoAnimationConfig {
  aspectRatio: VideoAspectRatio;
  durationSeconds: number;
  colors: VideoColors;
}

export type VideoSceneTemplate =
  | 'title'
  | 'flowchart'
  | 'stat'
  | 'iconGrid'
  | 'diagram'
  | 'particles';

export interface VideoSceneStat {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

export interface VideoSceneItem {
  icon: string;
  label: string;
}

export interface VideoScene {
  template: VideoSceneTemplate;
  eyebrow?: string;
  headline: string;
  body: string;
  cta?: string;
  steps?: string[];
  items?: VideoSceneItem[];
  stat?: VideoSceneStat;
  diagram?: { centerLabel: string; nodes: string[] };
  visualNote?: string;
}

export interface VideoScript {
  title: string;
  scenes: VideoScene[];
}

// Ad Creative
export interface AdCreativeConfig {
  platforms: string[];
  adFormat: 'single-image' | 'video' | 'carousel' | 'story';
  objective: 'awareness' | 'lead-gen' | 'conversion';
  variationCount: number;
}

// Caption / Social Post
export interface CaptionConfig {
  platform: 'instagram' | 'linkedin' | 'facebook' | 'twitter' | 'tiktok';
  postType: 'informational' | 'promotional' | 'engagement' | 'behind-the-scenes' | 'testimonial';
  includeHashtags: boolean;
  includeCta: boolean;
}

// Transcript → Content
export type TranscriptFormat = 'carousel' | 'reel' | 'caption' | 'newsletter' | 'email' | 'summary';
export interface TranscriptConfig {
  transcriptText?: string;
  transcriptFile?: InspirationFile;
  outputCounts: Partial<Record<TranscriptFormat, number>>;
  keyThemes: string;
}

export type TypeSpecificConfig =
  | { type: 'newsletter'; config: NewsletterConfig }
  | { type: 'carousel'; config: CarouselConfig }
  | { type: 'reel'; config: ReelConfig }
  | { type: 'static-image'; config: StaticImageConfig }
  | { type: 'ad-creative'; config: AdCreativeConfig }
  | { type: 'caption'; config: CaptionConfig }
  | { type: 'transcript'; config: TranscriptConfig };

export interface GenerationRequest {
  client: SelectedClient;
  universal: UniversalConfig;
  typeSpecific: TypeSpecificConfig;
}

export interface GeneratedOutput {
  content: string;
  rawJson?: string;
  contentType: ContentType;
  clientName: string;
  brandColour?: string;
  slideImages?: CarouselImage[];
  productImages?: { base64: string; name: string; caption?: string }[];
}

export interface CanvaResult {
  jobId: string;
  candidateId: string;
  thumbnailUrl?: string;
  designId?: string;
  designUrl?: string;
}

// Deliverable style presets per content type
export type NewsletterStyle = 'visual-catalogue' | 'copy-minimal' | 'editorial' | 'bold-promo';
export type CarouselStyle = 'educational' | 'storytelling' | 'quotes' | 'product-showcase';
export type ReelStyle = 'talk-to-camera' | 'voiceover-broll' | 'text-overlay' | 'trending-audio';
export type VideoStyle = 'explainer' | 'promo' | 'tutorial' | 'data-story';
export type CaptionStyle = 'conversational' | 'professional' | 'punchy' | 'storytelling';
export type AdStyle = 'direct-response' | 'brand-awareness' | 'retargeting' | 'ugc-style';
export type StaticStyle = 'clean-minimal' | 'bold-graphic' | 'photo-heavy' | 'typographic';
export type TranscriptStyle = 'blog-longform' | 'social-snippets' | 'newsletter-recap';

export type DeliverableStyle =
  | NewsletterStyle
  | CarouselStyle
  | ReelStyle
  | VideoStyle
  | CaptionStyle
  | AdStyle
  | StaticStyle
  | TranscriptStyle;

export interface DeliverableProfile {
  id: string;
  contentType: ContentType;
  label: string;
  frequency?: string;
  style: DeliverableStyle;
  notes?: string;
}

export type DashboardStep = 1 | 2 | 3 | 4;
