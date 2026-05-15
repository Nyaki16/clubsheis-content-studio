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
  | 'email-sequence'
  | 'ad-creative'
  | 'caption'
  | 'transcript';

export interface ContentTypeOption {
  id: ContentType;
  label: string;
  description: string;
  icon: string;
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

// Email Sequence
export interface EmailSequenceConfig {
  sequenceGoal: 'nurture' | 'launch' | 'welcome' | 're-engagement' | 'post-webinar';
  emailCount: number;
  sendCadence: string;
  offer: string;
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
  | { type: 'email-sequence'; config: EmailSequenceConfig }
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
export type EmailStyle = 'nurture-soft' | 'launch-direct' | 'welcome-warm' | 'post-event';
export type CaptionStyle = 'conversational' | 'professional' | 'punchy' | 'storytelling';
export type AdStyle = 'direct-response' | 'brand-awareness' | 'retargeting' | 'ugc-style';
export type StaticStyle = 'clean-minimal' | 'bold-graphic' | 'photo-heavy' | 'typographic';
export type TranscriptStyle = 'blog-longform' | 'social-snippets' | 'newsletter-recap';

export type DeliverableStyle =
  | NewsletterStyle
  | CarouselStyle
  | ReelStyle
  | EmailStyle
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
