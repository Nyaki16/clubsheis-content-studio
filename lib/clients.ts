import { SelectedClient } from '@/types';

export const hardcodedClients: SelectedClient[] = [
  {
    id: 'clubsheis',
    name: 'ClubSheIs',
    brandColour: '#F5C842',
    tone: 'Direct, grounded, warm. No corporate fluff. Addresses women entrepreneurs with confidence and empowerment.',
    isOwnBrand: true,
    logoUrl: undefined,
    canvaBrandKitId: undefined,
    deliverables: [
      {
        id: 'del-csi-newsletter',
        contentType: 'newsletter',
        label: 'Weekly Member Newsletter',
        frequency: 'Weekly',
        style: 'copy-minimal',
        notes: 'Copy-focused with links to resources, upcoming events, and member spotlights',
      },
      {
        id: 'del-csi-carousel',
        contentType: 'carousel',
        label: 'Educational Carousel',
        frequency: 'Bi-weekly',
        style: 'educational',
      },
      {
        id: 'del-csi-reel',
        contentType: 'reel',
        label: 'Weekly Reel',
        frequency: 'Weekly',
        style: 'talk-to-camera',
      },
    ],
  },
  {
    id: 'palesa-dooms',
    name: 'Palesa Dooms / Unforgettable Speakers',
    brandColour: '#FF6B6B',
    tone: "Warm, inspiring, youth-focused. Encouraging children and parents toward confident public speaking.",
    isOwnBrand: false,
    logoUrl: undefined,
    canvaBrandKitId: undefined,
    deliverables: [
      {
        id: 'del-pd-newsletter',
        contentType: 'newsletter',
        label: 'Parent Newsletter',
        frequency: 'Monthly',
        style: 'editorial',
        notes: 'Inspiring stories from young speakers, tips for parents, programme updates',
      },
      {
        id: 'del-pd-caption',
        contentType: 'caption',
        label: 'Social Posts',
        frequency: 'Weekly',
        style: 'conversational',
      },
    ],
  },
  {
    id: 'sibulele-sibaca',
    name: 'Sibulele Sibaca / Sibu',
    brandColour: '#4ECDC4',
    tone: 'Purpose-driven, compassionate, action-oriented. Focused on NGO growth and social impact.',
    isOwnBrand: false,
    logoUrl: undefined,
    canvaBrandKitId: undefined,
    deliverables: [
      {
        id: 'del-ss-carousel',
        contentType: 'carousel',
        label: 'Impact Stories',
        frequency: 'Bi-weekly',
        style: 'storytelling',
        notes: 'Before/after stories, beneficiary spotlights, impact stats',
      },
      {
        id: 'del-ss-caption',
        contentType: 'caption',
        label: 'LinkedIn Posts',
        frequency: 'Weekly',
        style: 'professional',
      },
    ],
  },
];
