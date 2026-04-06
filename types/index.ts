export interface SelectedClient {
  id: string;
  name: string;
  brandColour: string;
  tone: string;
  canvaBrandKitId?: string;
  logoUrl?: string;
  isOwnBrand: boolean;
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
  sectionCount: number;
  cta: string;
  length: 'short' | 'medium' | 'long';
}

// Carousel
export interface CarouselConfig {
  slideCount: number;
  slideFormat: 'tips' | 'story' | 'before-after' | 'how-to' | 'quote';
  ctaSlide: boolean;
  canvaOutput: boolean;
  referenceImages: InspirationFile[];
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
export interface TranscriptConfig {
  transcriptFile?: InspirationFile;
  outputFormats: string[];
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
}

export interface CanvaResult {
  jobId: string;
  candidateId: string;
  thumbnailUrl?: string;
  designId?: string;
  designUrl?: string;
}

export type DashboardStep = 1 | 2 | 3 | 4;
