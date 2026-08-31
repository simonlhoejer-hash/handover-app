export const PARTIS: Record<string, string[]> = {
  galley: [
    'SYD',
    'KULL varmt',
    'KULL koldt',
    'Konditor',
    'Besætning',
    'Opsætter',
    'Varm Skagerak',
    'Stilling 2',
    'Stilling 1',
    'Slagter',
    'Kældermand',
    'Dagskyller',
    'Natskyller',
  ],
  pearl: [
    'SYD',
    'KULL',
    'Konditor',
    'Besætning',
    'Varm Skagerak',
    'Stilling 1',
    'Slagter',
    'KOLD A LA CARDE',
    'BAGER',
    'KONDIT SPLIT',
    'KOLD SKAGERAK',
    'MESSEN',
    'KÆLDERMAND',
    'POTTEN',
    'STOR SKYLLERI',
    'KULL SKYLLERI',
    'SKAGERAK',
    'NATSKYLLER',
  ],
  shop: [
  'Tøj',
  'Sprut',
  'Slik',
  'Parfume',
  ],
}

export const CROWN_PARTI_GROUPS = [
  {
    title: 'Partier',
    items: [
      'SYD',
      'KULL varmt',
      'KULL koldt',
      'Konditor',
      'Besætning',
      'Opsætter',
      'Varm Skagerak',
      'Stilling 2',
      'Stilling 1',
      'Slagter',
      'Kældermand',
    ],
  },
  {
    title: 'Skyllerier',
    items: ['Dagskyller', 'Natskyller'],
  },
] as const

export const PEARL_PARTI_GROUPS = [
  {
    title: 'Partier',
    items: [
      'SYD',
      'KULL',
      'Konditor',
      'Besætning',
      'Varm Skagerak',
      'Stilling 1',
      'Slagter',
      'KOLD A LA CARDE',
      'BAGER',
      'KONDIT SPLIT',
      'KOLD SKAGERAK',
      'MESSEN',
      'KÆLDERMAND',
    ],
  },
  {
    title: 'Skyllerier',
    items: ['POTTEN', 'STOR SKYLLERI', 'KULL SKYLLERI', 'SKAGERAK', 'NATSKYLLER'],
  },
] as const

const PEARL_PARTI_LABELS: Record<string, string> = {
  SYD: 'Syd',
  KULL: 'Kull',
  'KOLD A LA CARDE': 'Kold à la carte',
  BAGER: 'Bager',
  'KONDIT SPLIT': 'Kondit split',
  'KOLD SKAGERAK': 'Kold Skagerak',
  MESSEN: 'Messen',
  'KÆLDERMAND': 'Kældermand',
  POTTEN: 'Potten',
  'STOR SKYLLERI': 'Stor skylleri',
  'KULL SKYLLERI': 'Kull skylleri',
  SKAGERAK: 'Skagerak',
  NATSKYLLER: 'Natskyller',
}

export function displayPartiName(name: string, department: string) {
  return department === 'pearl' ? PEARL_PARTI_LABELS[name] ?? name : name
}
