export type Domain = 'kunst' | 'beleggen' | 'luxe';
export type Tier = 'kern' | 'extended' | 'peripheral';

export const TIER_WEIGHT: Record<Tier, number> = { kern: 3, extended: 2, peripheral: 1 };

export const DOMAIN_META: Record<Domain, { name: string; color: string; description: string }> = {
  kunst: { name: 'Kunst & Cultuur', color: '#7F77DD', description: 'Musea, galeries, kunstbeurzen en culturele instellingen' },
  beleggen: { name: 'Beleggen & Financiën', color: '#378ADD', description: 'Banken, vermogensbeheerders, family offices' },
  luxe: { name: 'Luxe & Lifestyle', color: '#D85A30', description: 'Luxemerken, vastgoed, prestigieuze evenementen' },
};

export const ALL_DOMAINS: Domain[] = ['kunst', 'beleggen', 'luxe'];

export interface WatchlistOrg {
  id: string;
  name: string;
  linkedinUrl: string;
  domain: Domain;
  tier: Tier;
  isActive: boolean;
  postsScrapedCount: number;
  lastScrapedAt: string | null;
  rank: number;
}

export interface Signal {
  id: string;
  contactLinkedinUrl: string;
  contactName: string;
  contactTitle: string | null;
  orgId: string;
  orgName: string;
  domain: Domain;
  tier: Tier;
  engagementType: 'like' | 'comment';
  commentText: string | null;
  detectedAt: string;
  postUrl: string | null;
}

export interface DomainPresence {
  signalCount: number;
  lastSignalAt: string | null;
  weightedScore: number;
}

export interface Contact {
  id: string;
  linkedinUrl: string;
  firstName: string;
  lastName: string;
  title: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  source: 'auto' | 'manual' | 'import';
  addedAt: string;
  domains: Record<Domain, DomainPresence>;
  activeDomainCount: number;
  totalScore: number;
  status: 'cold' | 'warm' | 'hot';
  isEnriched: boolean;
  enrichedAt: string | null;
  lemlistCampaignId: string | null;
  lemlistPushedAt: string | null;
  lastContactedAt: string | null;
  notes: string;
  // Score breakdown
  engagementScore: number;
  keywordScore: number;
  crossSignalScore: number;
  enrichmentScore: number;
  diversityScore: number;
  // Score delta tracking
  previousScore: number | null;
  scoreChangedAt: string | null;
}

export interface AppSettings {
  hotScoreThreshold: number;
  tierWeights: Record<Tier, number>;
  manualAddWeight: number;
  recencyDecay: boolean;
  recencyDecayFactor: number;
  domainConfig: Record<Domain, { name: string; color: string; description: string }>;
  profileName: string;
  profileEmail: string;
  scoreWeights: {
    engagement: number;
    profileKeywords: number;
    crossSignal: number;
    enrichment: number;
    orgDiversity: number;
  };
  warmThreshold: number;
  decayDaysUntilCold: number;
  positiveKeywords: string[];
  negativeKeywords: string[];
  hubspotMapping: {
    leadSource: string;
    lifecycleStage: string;
    contactOwner: string;
  };
  lemlistConfig: {
    dailySendLimit: number;
    defaultCampaignId: string;
  };
  appearance: {
    theme: 'dark' | 'light' | 'system';
    compactMode: boolean;
    accentColor: 'coral' | 'blue' | 'emerald' | 'amber' | 'purple';
  };
  notifications: {
    newHotLead: boolean;
    enrichmentFailed: boolean;
    connectionDown: boolean;
    dailyDigest: boolean;
  };
}

export interface ImportRecord {
  id: string;
  date: string;
  type: 'CSV' | 'Phantombuster';
  records: number;
  imported: number;
  duplicates: number;
  errors: number;
  status: 'success' | 'partial' | 'error';
}

export interface LemlistCampaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  leadsCount: number;
  emailsSent: number;
  opens: number;
  replies: number;
}
