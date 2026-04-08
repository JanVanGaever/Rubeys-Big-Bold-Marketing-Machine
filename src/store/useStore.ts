import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WatchlistOrg, Signal, Contact, Domain, AppSettings, ImportRecord } from '@/types';
import { SEED_ORGS, buildSignals, buildContacts, SEED_CAMPAIGNS, DEFAULT_SETTINGS } from '@/lib/seed-data';
import type { LemlistCampaign } from '@/types';

interface AppState {
  watchlistOrgs: WatchlistOrg[];
  signals: Signal[];
  contacts: Contact[];
  campaigns: LemlistCampaign[];
  importHistory: ImportRecord[];
  settings: AppSettings;

  // Actions
  addWatchlistOrg: (org: WatchlistOrg) => void;
  updateOrg: (id: string, updates: Partial<WatchlistOrg>) => void;
  removeOrg: (id: string) => void;
  toggleOrgActive: (id: string) => void;

  addSignal: (signal: Signal) => void;

  addContact: (contact: Contact) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;

  updateSettings: (updates: Partial<AppSettings>) => void;

  recomputeScores: () => void;

  // Config actions
  addKeyword: (keyword: string, type: 'positive' | 'negative') => void;
  removeKeyword: (keyword: string, type: 'positive' | 'negative') => void;
  updateHubSpotMapping: (mapping: Partial<AppSettings['hubspotMapping']>) => void;
  updateLemlistConfig: (config: Partial<AppSettings['lemlistConfig']>) => void;
  updateAppearance: (config: Partial<AppSettings['appearance']>) => void;
  updateNotifications: (config: Partial<AppSettings['notifications']>) => void;
  updateScoreWeights: (weights: Partial<AppSettings['scoreWeights']>) => void;
  setThreshold: (type: 'hot' | 'warm', value: number) => void;
  setDecayDays: (days: number) => void;
  updateOrgRank: (id: string, newRank: number) => void;
  addImportRecord: (record: ImportRecord) => void;
}

const ENGAGEMENT_CAP = 30;

function recompute(
  contacts: Contact[],
  signals: Signal[],
  settings: AppSettings,
  watchlistOrgs: WatchlistOrg[]
): Contact[] {
  const domainKeys: Domain[] = ['kunst', 'beleggen', 'luxe'];
  const orgMap = new Map(watchlistOrgs.map(o => [o.id, o]));

  return contacts.map(c => {
    const domains = {
      kunst: { signalCount: 0, lastSignalAt: null as string | null, weightedScore: 0 },
      beleggen: { signalCount: 0, lastSignalAt: null as string | null, weightedScore: 0 },
      luxe: { signalCount: 0, lastSignalAt: null as string | null, weightedScore: 0 },
    };

    const contactSignals = signals.filter(s => s.contactLinkedinUrl === c.linkedinUrl);

    // 1. ENGAGEMENT SCORE
    let rawEngagement = 0;
    const uniqueOrgs = new Set<string>();

    for (const s of contactSignals) {
      const dp = domains[s.domain];
      dp.signalCount++;
      const org = orgMap.get(s.orgId);
      const tierWeight = settings.tierWeights[s.tier] ?? 1;
      const rank = org?.rank ?? 1;
      const orgScore = tierWeight / rank;
      dp.weightedScore += orgScore;
      if (!dp.lastSignalAt || s.detectedAt > dp.lastSignalAt) {
        dp.lastSignalAt = s.detectedAt;
      }
      const multiplier = s.engagementType === 'comment' ? 3 : 1;
      rawEngagement += orgScore * multiplier;
      uniqueOrgs.add(s.orgId);
    }

    const engagementScore = Math.min(100, Math.round((rawEngagement / ENGAGEMENT_CAP) * 100));

    // 2. PROFIEL KEYWORDS SCORE
    const profileText = `${(c.title ?? '').toLowerCase()} ${(c.company ?? '').toLowerCase()}`;
    let keywordRaw = 0;
    for (const kw of settings.positiveKeywords) {
      if (profileText.includes(kw.toLowerCase())) keywordRaw += 15;
    }
    for (const kw of settings.negativeKeywords) {
      if (profileText.includes(kw.toLowerCase())) keywordRaw -= 25;
    }
    const keywordScore = Math.max(0, Math.min(100, keywordRaw));

    // 3. CROSS-SIGNAAL SCORE
    const activeDomainCount = domainKeys.filter(d => domains[d].signalCount > 0).length;
    const crossMap: Record<number, number> = { 0: 0, 1: 20, 2: 60, 3: 100 };
    const crossSignalScore = crossMap[activeDomainCount] ?? 0;

    // 4. ENRICHMENT SCORE
    let enrichmentScore = 0;
    if (c.isEnriched) enrichmentScore += 50;
    if (c.email) enrichmentScore += 25;
    if (c.phone) enrichmentScore += 25;

    // 5. ORGANISATIE DIVERSITEIT
    const orgCount = uniqueOrgs.size;
    const diversityScore = orgCount >= 5 ? 100 : orgCount * 20;

    // TOTAL
    const w = settings.scoreWeights;
    const totalScore = Math.round(
      (engagementScore * w.engagement +
       keywordScore * w.profileKeywords +
       crossSignalScore * w.crossSignal +
       enrichmentScore * w.enrichment +
       diversityScore * w.orgDiversity) / 100
    );

    let status: Contact['status'] = 'cold';
    if (totalScore >= settings.hotScoreThreshold) status = 'hot';
    else if (totalScore >= settings.warmThreshold) status = 'warm';

    return {
      ...c,
      domains,
      activeDomainCount,
      totalScore,
      status,
      engagementScore,
      keywordScore,
      crossSignalScore,
      enrichmentScore,
      diversityScore,
    };
  });
}

const seedSignals = buildSignals();
const seedContacts = buildContacts(seedSignals, DEFAULT_SETTINGS.hotScoreThreshold);

export const useStore = create<AppState>()(persist((set, get) => ({
  watchlistOrgs: SEED_ORGS,
  signals: seedSignals,
  contacts: seedContacts,
  campaigns: SEED_CAMPAIGNS,
  importHistory: [],
  settings: DEFAULT_SETTINGS,

  addWatchlistOrg: (org) => set(s => {
    const orgs = [...s.watchlistOrgs, org];
    return { watchlistOrgs: orgs };
  }),
  updateOrg: (id, updates) => set(s => ({
    watchlistOrgs: s.watchlistOrgs.map(o => o.id === id ? { ...o, ...updates } : o),
  })),
  removeOrg: (id) => set(s => ({
    watchlistOrgs: s.watchlistOrgs.filter(o => o.id !== id),
  })),
  toggleOrgActive: (id) => set(s => ({
    watchlistOrgs: s.watchlistOrgs.map(o => o.id === id ? { ...o, isActive: !o.isActive } : o),
  })),

  addSignal: (signal) => set(s => {
    const signals = [...s.signals, signal];
    const contacts = recompute(s.contacts, signals, s.settings, s.watchlistOrgs);
    return { signals, contacts };
  }),

  addContact: (contact) => set(s => {
    const contacts = [...s.contacts, contact];
    return { contacts: recompute(contacts, s.signals, s.settings, s.watchlistOrgs) };
  }),
  updateContact: (id, updates) => set(s => ({
    contacts: s.contacts.map(c => c.id === id ? { ...c, ...updates } : c),
  })),

  updateSettings: (updates) => set(s => {
    const settings = { ...s.settings, ...updates };
    const contacts = recompute(s.contacts, s.signals, settings, s.watchlistOrgs);
    return { settings, contacts };
  }),

  recomputeScores: () => set(s => ({
    contacts: recompute(s.contacts, s.signals, s.settings, s.watchlistOrgs),
  })),

  // Config actions
  addKeyword: (keyword, type) => set(s => {
    const key = type === 'positive' ? 'positiveKeywords' : 'negativeKeywords';
    const kw = keyword.toLowerCase();
    if (s.settings[key].includes(kw)) return s;
    const settings = { ...s.settings, [key]: [...s.settings[key], kw] };
    return { settings, contacts: recompute(s.contacts, s.signals, settings, s.watchlistOrgs) };
  }),

  removeKeyword: (keyword, type) => set(s => {
    const key = type === 'positive' ? 'positiveKeywords' : 'negativeKeywords';
    const settings = { ...s.settings, [key]: s.settings[key].filter(k => k !== keyword) };
    return { settings, contacts: recompute(s.contacts, s.signals, settings, s.watchlistOrgs) };
  }),

  updateHubSpotMapping: (mapping) => set(s => ({
    settings: { ...s.settings, hubspotMapping: { ...s.settings.hubspotMapping, ...mapping } },
  })),

  updateLemlistConfig: (config) => set(s => ({
    settings: { ...s.settings, lemlistConfig: { ...s.settings.lemlistConfig, ...config } },
  })),

  updateAppearance: (config) => set(s => ({
    settings: { ...s.settings, appearance: { ...s.settings.appearance, ...config } },
  })),

  updateNotifications: (config) => set(s => ({
    settings: { ...s.settings, notifications: { ...s.settings.notifications, ...config } },
  })),

  updateScoreWeights: (weights) => set(s => {
    const settings = { ...s.settings, scoreWeights: { ...s.settings.scoreWeights, ...weights } };
    return { settings, contacts: recompute(s.contacts, s.signals, settings, s.watchlistOrgs) };
  }),

  setThreshold: (type, value) => set(s => {
    let settings: AppSettings;
    if (type === 'warm') {
      settings = { ...s.settings, warmThreshold: value, hotScoreThreshold: Math.max(s.settings.hotScoreThreshold, value + 1) };
    } else {
      settings = { ...s.settings, hotScoreThreshold: value, warmThreshold: Math.min(s.settings.warmThreshold, value - 1) };
    }
    return { settings, contacts: recompute(s.contacts, s.signals, settings, s.watchlistOrgs) };
  }),

  setDecayDays: (days) => set(s => {
    const settings = { ...s.settings, decayDaysUntilCold: days };
    return { settings, contacts: recompute(s.contacts, s.signals, settings, s.watchlistOrgs) };
  }),

  updateOrgRank: (id, newRank) => set(s => {
    const org = s.watchlistOrgs.find(o => o.id === id);
    if (!org) return s;
    const oldRank = org.rank;
    const updated = s.watchlistOrgs.map(o => {
      if (o.id === id) return { ...o, rank: newRank };
      if (o.domain === org.domain && o.tier === org.tier) {
        if (newRank < oldRank && o.rank >= newRank && o.rank < oldRank) {
          return { ...o, rank: o.rank + 1 };
        }
        if (newRank > oldRank && o.rank <= newRank && o.rank > oldRank) {
          return { ...o, rank: o.rank - 1 };
        }
      }
      return o;
    });
    const settings = s.settings;
    return { watchlistOrgs: updated, contacts: recompute(s.contacts, s.signals, settings, updated) };
  }),

  addImportRecord: (record) => set(s => ({
    importHistory: [record, ...s.importHistory],
  })),
}), {
  name: 'rubey-store',
  partialize: (state) => ({
    watchlistOrgs: state.watchlistOrgs,
    signals: state.signals,
    contacts: state.contacts,
    campaigns: state.campaigns,
    importHistory: state.importHistory,
    settings: state.settings,
  }),
}));
