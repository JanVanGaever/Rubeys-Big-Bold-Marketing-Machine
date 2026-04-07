import type { Contact, Domain, LemlistCampaign, AppSettings } from '@/types';

export const MOCK_CONTACTS: Contact[] = [
  {
    id: '1', firstName: 'Marie', lastName: 'Janssens',
    title: 'Partner', company: 'Mercier Vanderlinden',
    linkedinUrl: 'https://linkedin.com/in/marie-janssens',
    emailPersonal: 'marie.janssens@gmail.com', emailWork: 'mjanssens@merciervanderlinden.be',
    phone: '+32 478 12 34 56', location: 'Antwerpen, België',
    score: 87, status: 'hot',
    signals: [
      { type: 'kunst', source: 'KMSKA', weight: 25, date: '2026-04-05' },
      { type: 'kunst', source: 'KMSKA', weight: 25, date: '2026-04-01' },
      { type: 'vermogen', source: 'Bank Delen', weight: 25, date: '2026-04-03' },
      { type: 'luxe', source: 'Patek Philippe', weight: 15, date: '2026-03-28' },
    ],
    sourceType: 'chrome_extension', outreachStatus: 'not_contacted',
    createdAt: '2026-04-05', updatedAt: '2026-04-06',
  },
  {
    id: '2', firstName: 'Thomas', lastName: 'De Smedt',
    title: 'CEO', company: 'De Smedt Capital',
    linkedinUrl: 'https://linkedin.com/in/thomas-de-smedt',
    emailPersonal: 'thomas.desmedt@gmail.com', emailWork: 'thomas@desmedtcapital.be',
    location: 'Gent, België',
    score: 74, status: 'hot',
    signals: [
      { type: 'kunst', source: "Christie's", weight: 25, date: '2026-04-04' },
      { type: 'vermogen', source: 'Degroof Petercam', weight: 25, date: '2026-04-02' },
      { type: 'luxe', source: 'Zoute Grand Prix', weight: 13, date: '2026-03-30' },
    ],
    sourceType: 'phantombuster', outreachStatus: 'in_sequence', lemlistStatus: 'sent',
    createdAt: '2026-04-04', updatedAt: '2026-04-05',
  },
  {
    id: '3', firstName: 'Sophie', lastName: 'Claes',
    title: 'CFO', company: 'Claes & Partners',
    emailWork: 's.claes@claespartners.be',
    location: 'Brussel, België',
    score: 62, status: 'warm',
    signals: [
      { type: 'kunst', source: 'Bozar', weight: 15, date: '2026-04-03' },
      { type: 'vermogen', source: 'Bank Delen', weight: 25, date: '2026-04-01' },
    ],
    sourceType: 'apollo', outreachStatus: 'not_contacted',
    createdAt: '2026-04-03', updatedAt: '2026-04-04',
  },
  {
    id: '4', firstName: 'Pieter', lastName: 'Van den Berg',
    title: 'Director Wealth Management', company: 'Puilaetco',
    linkedinUrl: 'https://linkedin.com/in/pieter-vdberg',
    emailWork: 'p.vandenberg@puilaetco.be',
    location: 'Brussel, België',
    score: 55, status: 'warm',
    signals: [
      { type: 'kunst', source: 'BRAFA', weight: 15, date: '2026-04-02' },
      { type: 'vermogen', source: 'Quintet', weight: 15, date: '2026-03-29' },
    ],
    sourceType: 'apollo', outreachStatus: 'replied', lemlistStatus: 'replied',
    createdAt: '2026-04-01', updatedAt: '2026-04-05',
  },
  {
    id: '5', firstName: 'Isabelle', lastName: 'Maes',
    title: 'Managing Director', company: 'IM Investments',
    emailPersonal: 'isabelle.maes@hotmail.com',
    location: 'Knokke, België',
    score: 48, status: 'warm',
    signals: [
      { type: 'luxe', source: 'Zoute Grand Prix', weight: 13, date: '2026-04-01' },
      { type: 'vermogen', source: 'Econopolis', weight: 8, date: '2026-03-27' },
    ],
    sourceType: 'phantombuster', outreachStatus: 'not_contacted',
    createdAt: '2026-03-30', updatedAt: '2026-04-01',
  },
  {
    id: '6', firstName: 'Luc', lastName: 'Vermeersch',
    title: 'Bestuurder', company: 'Vermeersch Holding',
    linkedinUrl: 'https://linkedin.com/in/luc-vermeersch',
    emailWork: 'luc@vermeersch.be',
    location: 'Antwerpen, België',
    score: 35, status: 'cold',
    signals: [
      { type: 'kunst', source: 'Art Brussels', weight: 8, date: '2026-03-25' },
    ],
    sourceType: 'apollo', outreachStatus: 'not_contacted',
    createdAt: '2026-03-25', updatedAt: '2026-03-26',
  },
  {
    id: '7', firstName: 'Charlotte', lastName: 'Dubois',
    title: 'Partner', company: 'Dubois Family Office',
    emailWork: 'c.dubois@dubois-fo.be',
    location: 'Brussel, België',
    score: 79, status: 'hot',
    signals: [
      { type: 'kunst', source: 'Tefaf Maastricht', weight: 15, date: '2026-04-04' },
      { type: 'vermogen', source: 'Bank Delen', weight: 35, date: '2026-04-03' },
      { type: 'luxe', source: "Sotheby's Realty", weight: 8, date: '2026-03-31' },
    ],
    sourceType: 'chrome_extension', outreachStatus: 'meeting_booked', hubspotSynced: true,
    createdAt: '2026-04-03', updatedAt: '2026-04-06',
  },
  {
    id: '8', firstName: 'Alexis', lastName: 'Laurent',
    title: 'VP Private Banking', company: 'Degroof Petercam',
    emailWork: 'a.laurent@degroofpetercam.be',
    location: 'Brussel, België',
    score: 28, status: 'cold',
    signals: [
      { type: 'vermogen', source: 'Degroof Petercam', weight: 8, date: '2026-03-20' },
    ],
    sourceType: 'apollo', outreachStatus: 'not_contacted',
    createdAt: '2026-03-20', updatedAt: '2026-03-21',
  },
];

export const MOCK_DOMAINS: Domain[] = [
  {
    id: 'kunst', name: 'Kunst & Cultuur', description: 'Musea, galeries, kunstbeurzen en culturele instellingen', color: '#534AB7', maxPoints: 35, sortOrder: 1, isActive: true, createdAt: '2026-01-01T00:00:00Z',
    items: [
      { id: 'k1', name: 'KMSKA',           city: 'Antwerpen',  country: 'België',    domainId: 'kunst', rank: 1, active: true,  likes: 84, comments: 31 },
      { id: 'k2', name: "Christie's",       city: 'Brussel',    country: 'België',    domainId: 'kunst', rank: 2, active: true,  likes: 61, comments: 19 },
      { id: 'k3', name: 'Bozar',            city: 'Brussel',    country: 'België',    domainId: 'kunst', rank: 3, active: true,  likes: 47, comments: 12 },
      { id: 'k4', name: 'BRAFA',            city: 'Brussel',    country: 'België',    domainId: 'kunst', rank: 4, active: true,  likes: 29, comments: 8  },
      { id: 'k5', name: 'Art Brussels',     city: 'Brussel',    country: 'België',    domainId: 'kunst', rank: 5, active: true,  likes: 21, comments: 5  },
      { id: 'k6', name: 'Tefaf Maastricht', city: 'Maastricht', country: 'Nederland', domainId: 'kunst', rank: 6, active: true,  likes: 52, comments: 16 },
      { id: 'k7', name: "Sotheby's België", city: 'Brussel',    country: 'België',    domainId: 'kunst', rank: 7, active: false, likes: 33, comments: 11 },
      { id: 'k8', name: 'M Leuven',         city: 'Leuven',     country: 'België',    domainId: 'kunst', rank: 8, active: false, likes: 18, comments: 4  },
    ],
  },
  {
    id: 'vermogen', name: 'Vermogen & Banking', description: 'Private banks, vermogensbeheerders en family offices', color: '#0fb57a', maxPoints: 35, sortOrder: 2, isActive: true, createdAt: '2026-01-01T00:00:00Z',
    items: [
      { id: 'v1', name: 'Bank Delen',       city: 'Antwerpen', country: 'België', domainId: 'vermogen', rank: 1, active: true,  likes: 73, comments: 28 },
      { id: 'v2', name: 'Degroof Petercam', city: 'Brussel',   country: 'België', domainId: 'vermogen', rank: 2, active: true,  likes: 58, comments: 17 },
      { id: 'v3', name: 'Puilaetco',        city: 'Brussel',   country: 'België', domainId: 'vermogen', rank: 3, active: true,  likes: 22, comments: 6  },
      { id: 'v4', name: 'Quintet (KBL)',    city: 'Brussel',   country: 'België', domainId: 'vermogen', rank: 4, active: true,  likes: 16, comments: 4  },
      { id: 'v5', name: 'Econopolis',       city: 'Gent',      country: 'België', domainId: 'vermogen', rank: 5, active: false, likes: 11, comments: 3  },
    ],
  },
  {
    id: 'luxe', name: 'Luxe & Kapitaal', description: 'Luxemerken, vastgoed en prestigieuze evenementen', color: '#f4a261', maxPoints: 20, sortOrder: 3, isActive: true, createdAt: '2026-01-01T00:00:00Z',
    items: [
      { id: 'l1', name: 'Patek Philippe',   city: 'Brussel', country: 'België', domainId: 'luxe', rank: 1, active: true,  likes: 38, comments: 9  },
      { id: 'l2', name: 'Zoute Grand Prix', city: 'Knokke',  country: 'België', domainId: 'luxe', rank: 2, active: true,  likes: 44, comments: 14 },
      { id: 'l3', name: "Sotheby's Realty", city: 'Brussel', country: 'België', domainId: 'luxe', rank: 3, active: true,  likes: 19, comments: 4  },
      { id: 'l4', name: 'Rolex',            city: 'Brussel', country: 'België', domainId: 'luxe', rank: 4, active: false, likes: 31, comments: 7  },
    ],
  },
];

export const MOCK_CAMPAIGNS: LemlistCampaign[] = [
  { id: 'c1', name: 'Rubey — Kunst & Beleggen', status: 'active',  leadsCount: 24, repliesCount: 4 },
  { id: 'c2', name: 'Rubey — Familie Office',   status: 'active',  leadsCount: 12, repliesCount: 2 },
  { id: 'c3', name: 'Rubey — Nederlandstalig',  status: 'paused',  leadsCount: 8,  repliesCount: 1 },
  { id: 'c4', name: 'Rubey — HERstory launch',  status: 'draft',   leadsCount: 0,  repliesCount: 0 },
];

export const DEFAULT_SETTINGS: AppSettings = {
  hotThreshold: 70,
  warmThreshold: 40,
  scoreWeights: {
    engagement: 25,
    profileKeywords: 25,
    crossSignal: 25,
    enrichment: 15,
    orgDiversity: 10,
  },
  positiveKeywords: [
    'wealth management', 'private banking', 'family office', 'vermogensbeheer',
    'partner', 'director', 'CEO', 'CFO', 'bestuurder', 'aandeelhouder',
    'investeerder', 'asset management', 'beleggingsadviseur',
  ],
  negativeKeywords: [
    'conservator', 'curator', 'gids', 'intern', 'stagiair', 'student', 'vrijwilliger',
  ],
  apolloApiKey: '',
  lemlistApiKey: '',
  hubspotToken: '',
  phantombusterApiKey: '',
};

export function getScoreBadge(score: number): { label: string; className: string } {
  if (score >= 70) return { label: 'Hot', className: 'bg-red-500/20 text-red-400 border border-red-500/30' };
  if (score >= 40) return { label: 'Warm', className: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' };
  return { label: 'Cold', className: 'bg-slate-500/20 text-slate-400 border border-slate-500/30' };
}

export function getOutreachLabel(status: string): string {
  const labels: Record<string, string> = {
    not_contacted: 'Niet gecontacteerd',
    in_sequence: 'In sequence',
    replied: 'Geantwoord',
    meeting_booked: 'Meeting gepland',
    converted: 'Geconverteerd',
  };
  return labels[status] ?? status;
}

export function getPts(index: number, maxPts: number): number {
  const ratios = [1, 0.71, 0.43, 0.43, 0.23, 0.23, 0.14, 0.14, 0.09, 0.09];
  return Math.max(1, Math.round(maxPts * (ratios[index] ?? 0.09)));
}
