import { SelectedClient, ContentType } from '@/types';

export function buildCanvaPrompt(
  generatedCopy: string,
  client: SelectedClient,
  designType: string,
  slideCount?: number,
  firstSlideHeadline?: string
): string {
  const parts = [
    `${client.name} brand ${designType}.`,
    slideCount ? `${slideCount} slides.` : '',
    firstSlideHeadline ? `Headline: ${firstSlideHeadline}.` : '',
    `Brand colour: ${client.brandColour}.`,
    `Style: clean, editorial, bold typography. Black and white with ${client.brandColour} accent.`,
    `No stock photo clichés. Typography-led design.`,
  ];
  return parts.filter(Boolean).join(' ');
}

export function getCanvaDesignType(contentType: ContentType): string {
  switch (contentType) {
    case 'carousel':
      return 'instagram_post';
    case 'static-image':
      return 'poster';
    default:
      return 'poster';
  }
}

export interface CanvaGenerateParams {
  designType: string;
  query: string;
  brandKitId?: string;
}

export interface CanvaGenerateResult {
  jobId: string;
  candidateId: string;
  thumbnailUrl?: string;
}

export interface CanvaMaterialiseResult {
  designId: string;
  designUrl: string;
}

export interface CanvaExportResult {
  downloadUrl: string;
}
