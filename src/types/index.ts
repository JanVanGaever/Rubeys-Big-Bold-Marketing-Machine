export type Tier = 'kern' | 'extended' | 'peripheral';

export const TIER_WEIGHT: Record<Tier, number> = { kern: 3, extended: 2, peripheral: 1 };

export interface DomainDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
  weight: number;
  sortOrder: number;
  createdAt: string;
}

export const DEFAULT_DOMAINS: DomainDefinition[] = [
  { id: 'kunst', name: 'Kunst & Cultuur', description: 'Musea, galeries, kunstbeurzen en culturele instellingen', color: '#7F77DD', weight: 33, sortOrder: 0, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'beleggen', name: 'Beleggen & Financiën', description: 'Banken, vermogensbeheerders, family offices', color: '#378ADD', weight: 34, sortOrder: 1, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'luxe', name: 'Luxe & Lifestyle', description: 'Luxemerken, vastgoed, prestigieuze evenementen', color: '#D85A30', weight: 33, sortOrder: 2, createdAt: '2026-01-01T00:00:00Z' },
];

export function getDomainById(domains: DomainDefinition[], id: string): DomainDefinition | undefined {
  return domains.find(d => d.id === id);
}

export function getDomainColor(domains: DomainDefinition[], id: string): string {
  return getDomainById(domains, id)?.color ?? '#666';
}

export function getDomainName(domains: DomainDefinition[], id: string): string {
  return getDomainById(domains, id)?.name ?? id;
}

export interface WatchlistOrg {
  id: string;
  name: string;
  linkedinUrl: string;
  domain: string;
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
  domain: string;
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
  domains: Record<string, DomainPresence>;
  activeDomainCount: number;
  totalScore: number;
  status: 'cold' | 'warm' | 'hot';
  isEnriched: boolean;
  enrichedAt: string | null;
  lemlistCampaignId: string | null;
  lemlistPushedAt: string | null;
  lastContactedAt: string | null;
  notes: string;
  engagementScore: number;
  keywordScore: number;
  crossSignalScore: number;
  enrichmentScore: number;
  diversityScore: number;
  previousScore: number | null;
  scoreChangedAt: string | null;
  isCustomer: boolean;
  customerSince: string | null;
  enrichmentSource: 'none' | 'apollo' | 'dropcontact' | 'both';
  emailVerifiedByDropcontact: boolean;
  dropcontactEnrichedAt: string | null;
}

export interface AppSettings {
  hotScoreThreshold: number;
  tierWeights: Record<Tier, number>;
  manualAddWeight: number;
  recencyDecay: boolean;
  recencyDecayFactor: number;
  domains: DomainDefinition[];
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
  maxSignalsPerOrg: number;
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
  autoEnrichEnabled: boolean;
  hubspotFieldMappings: Array<{ lc: string; hs: string }>;
  hubspotSyncRules: {
    who: 'hot' | 'warm_hot' | 'all' | 'manual';
    when: 'auto' | 'daily' | 'manual';
    fields: {
      nameContact: boolean;
      scoreStatus: boolean;
      domainTags: boolean;
      signalHistory: boolean;
      enrichmentData: boolean;
      notes: boolean;
    };
  };
}

export interface EnrichmentRecord {
  id: string;
  contactId: string;
  contactName: string;
  date: string;
  status: 'success' | 'error' | 'partial';
  fieldsFound: string[];
  fieldsMissing: string[];
}

export interface SyncRecord {
  id: string;
  date: string;
  direction: 'push' | 'pull';
  records: number;
  created: number;
  updated: number;
  errors: number;
  status: 'success' | 'partial' | 'error';
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

export type CalibrationLevel = 1 | 2 | 3;

export interface CalibrationSuggestion {
  id: string;
  level: CalibrationLevel;
  type: 'rank_change' | 'add_org' | 'remove_org' | 'domain_rename';
  title: string;
  explanation: string;
  evidence: {
    customerCount: number;
    totalCustomers: number;
    percentage: number;
  };
  domain?: string;
  orgId?: string;
  orgName?: string;
  suggestedRank?: number;
  suggestedOrgName?: string;
  suggestedOrgUrl?: string;
  suggestedTier?: string;
  suggestedDomainName?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  decidedAt: string | null;
}
