import { ContentType, DeliverableStyle } from '@/types';

export interface StylePreset {
  id: DeliverableStyle;
  label: string;
  description: string;
  defaults: Record<string, unknown>;
}

export interface ContentTypePresets {
  contentType: ContentType;
  label: string;
  styles: StylePreset[];
}

export const deliverablePresets: ContentTypePresets[] = [
  {
    contentType: 'newsletter',
    label: 'Newsletter',
    styles: [
      {
        id: 'visual-catalogue',
        label: 'Visual / Catalogue',
        description: 'Photo-heavy, designed layout — ideal for product showcases, furniture, fashion, e-commerce',
        defaults: {
          style: 'product-launch',
          sectionCount: 4,
          length: 'long',
          cta: 'Shop now',
        },
      },
      {
        id: 'copy-minimal',
        label: 'Copy-Focused / Minimal',
        description: 'Text-driven with links and buttons — ideal for updates, tips, community digests',
        defaults: {
          style: 'minimal',
          sectionCount: 3,
          length: 'medium',
          cta: 'Read more',
        },
      },
      {
        id: 'editorial',
        label: 'Editorial / Magazine',
        description: 'Featured story with supporting sections — ideal for thought leadership, personal brands',
        defaults: {
          style: 'editorial',
          sectionCount: 3,
          length: 'long',
          cta: 'Continue reading',
        },
      },
      {
        id: 'bold-promo',
        label: 'Bold / Promotional',
        description: 'Sales-driven with big CTAs and urgency — ideal for launches, offers, limited deals',
        defaults: {
          style: 'bold',
          sectionCount: 2,
          length: 'short',
          cta: 'Grab the deal',
        },
      },
    ],
  },
  {
    contentType: 'carousel',
    label: 'Carousel',
    styles: [
      {
        id: 'educational',
        label: 'Educational / Tips',
        description: 'Informational slides with numbered tips or key takeaways',
        defaults: {
          slideCount: 7,
          slideFormat: 'tips',
          ctaSlide: true,
        },
      },
      {
        id: 'storytelling',
        label: 'Story-Driven',
        description: 'Narrative arc across slides — hook, build, reveal, CTA',
        defaults: {
          slideCount: 8,
          slideFormat: 'story',
          ctaSlide: true,
        },
      },
      {
        id: 'quotes',
        label: 'Quotes / Inspiration',
        description: 'Branded quote cards with clean typography',
        defaults: {
          slideCount: 5,
          slideFormat: 'quote',
          ctaSlide: false,
        },
      },
      {
        id: 'product-showcase',
        label: 'Product Showcase',
        description: 'Visual product features with descriptions and pricing',
        defaults: {
          slideCount: 6,
          slideFormat: 'how-to',
          ctaSlide: true,
        },
      },
    ],
  },
  {
    contentType: 'reel',
    label: 'Reel Script',
    styles: [
      {
        id: 'talk-to-camera',
        label: 'Talk to Camera',
        description: 'Direct-to-camera speaking with on-screen text prompts',
        defaults: {
          format: 'talk-to-camera',
          duration: '60',
          hookStyle: 'bold-statement',
        },
      },
      {
        id: 'voiceover-broll',
        label: 'Voiceover + B-Roll',
        description: 'Narrated voiceover with footage instructions',
        defaults: {
          format: 'voiceover',
          duration: '30',
          hookStyle: 'relatable',
        },
      },
      {
        id: 'text-overlay',
        label: 'Text Overlay Only',
        description: 'No speaking — text on screen with music/trending audio',
        defaults: {
          format: 'text-only',
          duration: '15',
          hookStyle: 'controversial',
        },
      },
      {
        id: 'trending-audio',
        label: 'Trending Audio',
        description: 'Built around a trending sound — lip-sync or contextual',
        defaults: {
          format: 'text-only',
          duration: '15',
          hookStyle: 'relatable',
        },
      },
    ],
  },
  {
    contentType: 'email-sequence',
    label: 'Email Sequence',
    styles: [
      {
        id: 'nurture-soft',
        label: 'Nurture / Soft Sell',
        description: 'Value-first emails that build trust before asking for the sale',
        defaults: {
          sequenceGoal: 'nurture',
          emailCount: 5,
          sendCadence: 'Every 2-3 days',
        },
      },
      {
        id: 'launch-direct',
        label: 'Launch / Direct',
        description: 'High-energy launch sequence with urgency and scarcity',
        defaults: {
          sequenceGoal: 'launch',
          emailCount: 7,
          sendCadence: 'Daily during launch week',
        },
      },
      {
        id: 'welcome-warm',
        label: 'Welcome / Onboarding',
        description: 'Warm introduction sequence for new subscribers or members',
        defaults: {
          sequenceGoal: 'welcome',
          emailCount: 4,
          sendCadence: 'Day 0, 1, 3, 7',
        },
      },
      {
        id: 'post-event',
        label: 'Post-Event Follow-Up',
        description: 'Follow-up after webinar, workshop, or live event',
        defaults: {
          sequenceGoal: 'post-webinar',
          emailCount: 3,
          sendCadence: 'Day 0, 1, 3',
        },
      },
    ],
  },
  {
    contentType: 'caption',
    label: 'Caption / Social Post',
    styles: [
      {
        id: 'conversational',
        label: 'Conversational',
        description: 'Friendly, relatable tone — like texting a friend',
        defaults: {
          postType: 'engagement',
          includeHashtags: true,
          includeCta: true,
        },
      },
      {
        id: 'professional',
        label: 'Professional / Authority',
        description: 'Polished, thought-leader tone for LinkedIn or industry posts',
        defaults: {
          postType: 'informational',
          includeHashtags: false,
          includeCta: true,
        },
      },
      {
        id: 'punchy',
        label: 'Punchy / Bold',
        description: 'Short, impactful lines — stops the scroll',
        defaults: {
          postType: 'promotional',
          includeHashtags: true,
          includeCta: true,
        },
      },
      {
        id: 'storytelling',
        label: 'Storytelling',
        description: 'Mini-narrative that draws readers in with a personal angle',
        defaults: {
          postType: 'behind-the-scenes',
          includeHashtags: true,
          includeCta: false,
        },
      },
    ],
  },
  {
    contentType: 'ad-creative',
    label: 'Ad Creative',
    styles: [
      {
        id: 'direct-response',
        label: 'Direct Response',
        description: 'Conversion-focused with clear offer and strong CTA',
        defaults: {
          objective: 'conversion',
          adFormat: 'single-image',
          variationCount: 3,
        },
      },
      {
        id: 'brand-awareness',
        label: 'Brand Awareness',
        description: 'Top-of-funnel — introduces the brand story',
        defaults: {
          objective: 'awareness',
          adFormat: 'video',
          variationCount: 2,
        },
      },
      {
        id: 'retargeting',
        label: 'Retargeting',
        description: 'Re-engages warm audiences with social proof or urgency',
        defaults: {
          objective: 'conversion',
          adFormat: 'carousel',
          variationCount: 3,
        },
      },
      {
        id: 'ugc-style',
        label: 'UGC Style',
        description: 'Looks organic — testimonial or casual creator format',
        defaults: {
          objective: 'lead-gen',
          adFormat: 'video',
          variationCount: 2,
        },
      },
    ],
  },
  {
    contentType: 'static-image',
    label: 'Static Image / Poster',
    styles: [
      {
        id: 'clean-minimal',
        label: 'Clean / Minimal',
        description: 'Lots of white space, simple text, elegant',
        defaults: {
          imagePurpose: 'announcement',
          format: '1:1',
        },
      },
      {
        id: 'bold-graphic',
        label: 'Bold / Graphic',
        description: 'Strong colours, big text, attention-grabbing',
        defaults: {
          imagePurpose: 'promotion',
          format: '1:1',
        },
      },
      {
        id: 'photo-heavy',
        label: 'Photo-Heavy',
        description: 'Photography-first with text overlay',
        defaults: {
          imagePurpose: 'event',
          format: '4:5',
        },
      },
      {
        id: 'typographic',
        label: 'Typographic',
        description: 'Text-as-design — quotes, stats, or headlines as the visual',
        defaults: {
          imagePurpose: 'quote',
          format: '1:1',
        },
      },
    ],
  },
  {
    contentType: 'transcript',
    label: 'Transcript → Content',
    styles: [
      {
        id: 'blog-longform',
        label: 'Blog / Long-Form',
        description: 'Full article repurposed from transcript',
        defaults: {
          outputCounts: { summary: 1, newsletter: 1 },
        },
      },
      {
        id: 'social-snippets',
        label: 'Social Snippets',
        description: 'Pull key quotes and moments into social posts',
        defaults: {
          outputCounts: { caption: 5, carousel: 1 },
        },
      },
      {
        id: 'newsletter-recap',
        label: 'Newsletter Recap',
        description: 'Summarise transcript into a newsletter section',
        defaults: {
          outputCounts: { newsletter: 1 },
        },
      },
    ],
  },
];

export function getPresetsForType(contentType: ContentType): StylePreset[] {
  return deliverablePresets.find((p) => p.contentType === contentType)?.styles || [];
}

export function getPresetById(contentType: ContentType, styleId: string): StylePreset | undefined {
  return getPresetsForType(contentType).find((s) => s.id === styleId);
}
