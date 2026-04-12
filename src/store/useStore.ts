import { create } from "zustand";
import type {
  WatchlistOrg,
  Signal,
  Contact,
  AppSettings,
  ImportRecord,
  CalibrationSuggestion,
  EnrichmentRecord,
  SyncRecord,
  LemlistCampaign,
  DomainDefinition,
  DomainPresence,
} from "@/types";
import { DEFAULT_DOMAINS } from "@/types";
import { DEFAULT_SETTINGS } from "@/lib/seed-data";
import { normalizeLinkedInUrl } from "@/lib/normalize";
import * as db from "@/lib/supabase-queries";

interface AppState {
  watchlistOrgs: WatchlistOrg[];
  signals: Signal[];
  contacts: Contact[];
  campaigns: LemlistCampaign[];
  importHistory: ImportRecord[];
  enrichmentHistory: EnrichmentRecord[];
  syncHistory: SyncRecord[];
  settings: AppSettings;
  calibrationSuggestions: CalibrationSuggestion[];
  isLoading: boolean;
  isInitialized: boolean;
  lastError: string | null;

  // Init
  initialize: () => Promise<void>;

  // Orgs
  addWatchlistOrg: (org: WatchlistOrg) => void;
  updateOrg: (id: string, updates: Partial<WatchlistOrg>) => void;
  removeOrg: (id: string) => void;
  toggleOrgActive: (id: string) => void;
  updateOrgRank: (id: string, newRank: number) => void;

  // Signals & Contacts
  addSignal: (signal: Signal) => void;
  addContact: (contact: Contact) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;

  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void;
  recomputeScores: () => void;
  addKeyword: (keyword: string, type: "positive" | "negative") => void;
  removeKeyword: (keyword: string, type: "positive" | "negative") => void;
  updateHubSpotMapping: (mapping: Partial<AppSettings["hubspotMapping"]>) => void;
  updateLemlistConfig: (config: Partial<AppSettings["lemlistConfig"]>) => void;
  updateAppearance: (config: Partial<AppSettings["appearance"]>) => void;
  updateNotifications: (config: Partial<AppSettings["notifications"]>) => void;
  updateScoreWeights: (weights: Partial<AppSettings["scoreWeights"]>) => void;
  setThreshold: (type: "hot" | "warm", value: number) => void;
  setDecayDays: (days: number) => void;

  // History
  addImportRecord: (record: ImportRecord) => void;
  addEnrichmentRecord: (record: EnrichmentRecord) => void;
  addSyncRecord: (record: SyncRecord) => void;

  // Calibration
  addCalibrationSuggestion: (suggestion: CalibrationSuggestion) => void;
  acceptSuggestion: (id: string) => void;
  rejectSuggestion: (id: string) => void;

  // Customers
  toggleCustomer: (contactId: string) => void;

  // Domains
  addDomain: (domain: DomainDefinition) => void;
  updateDomain: (id: string, updates: Partial<Omit<DomainDefinition, 'id'>>) => void;
  removeDomain: (id: string) => void;
  reorderDomains: (orderedIds: string[]) => void;
}

const ENGAGEMENT_CAP = 30;

function normalizeSettings(settings?: Partial<AppSettings> | null): AppSettings {
  const input = (settings ?? {}) as any;

  // Migrate old domainConfig to domains array
  let domains = input.domains ?? DEFAULT_SETTINGS.domains;
  if (input?.domainConfig && !input?.domains) {
    const cfg = input.domainConfig as Record<string, { name: string; color: string; description: string }>;
    domains = Object.entries(cfg).map(([id, v], i) => ({
      id, name: v.name, description: v.description, color: v.color,
      weight: Math.round(100 / Object.keys(cfg).length), sortOrder: i, createdAt: '2026-01-01T00:00:00Z',
    }));
  }

  return {
    ...DEFAULT_SETTINGS,
    ...input,
    domains: domains.length > 0 ? domains : DEFAULT_SETTINGS.domains,
    tierWeights: { ...DEFAULT_SETTINGS.tierWeights, ...(input.tierWeights ?? {}) },
    scoreWeights: { ...DEFAULT_SETTINGS.scoreWeights, ...(input.scoreWeights ?? {}) },
    positiveKeywords: input.positiveKeywords ?? DEFAULT_SETTINGS.positiveKeywords,
    negativeKeywords: input.negativeKeywords ?? DEFAULT_SETTINGS.negativeKeywords,
    hubspotMapping: { ...DEFAULT_SETTINGS.hubspotMapping, ...(input.hubspotMapping ?? {}) },
    lemlistConfig: { ...DEFAULT_SETTINGS.lemlistConfig, ...(input.lemlistConfig ?? {}) },
    appearance: { ...DEFAULT_SETTINGS.appearance, ...(input.appearance ?? {}) },
    notifications: { ...DEFAULT_SETTINGS.notifications, ...(input.notifications ?? {}) },
    hubspotFieldMappings: input.hubspotFieldMappings ?? DEFAULT_SETTINGS.hubspotFieldMappings,
    hubspotSyncRules: {
      ...DEFAULT_SETTINGS.hubspotSyncRules,
      ...(input.hubspotSyncRules ?? {}),
      fields: { ...DEFAULT_SETTINGS.hubspotSyncRules.fields, ...(input.hubspotSyncRules?.fields ?? {}) },
    },
  };
}

function recompute(
  contacts: Contact[],
  signals: Signal[],
  settings: AppSettings,
  watchlistOrgs: WatchlistOrg[],
): Contact[] {
  const normalizedSettings = normalizeSettings(settings);
  const domainKeys = normalizedSettings.domains.map(d => d.id);
  const totalDomains = domainKeys.length;
  const orgMap = new Map(watchlistOrgs.map((o) => [o.id, o]));

  return contacts.map((c) => {
    const domains: Record<string, DomainPresence> = {};
    for (const dk of domainKeys) {
      domains[dk] = { signalCount: 0, lastSignalAt: null, weightedScore: 0 };
    }
    for (const key of Object.keys(c.domains)) {
      if (!domains[key]) domains[key] = { signalCount: 0, lastSignalAt: null, weightedScore: 0 };
    }

    const contactSignals = signals
      .filter((s) => s.contactLinkedinUrl === c.linkedinUrl)
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());

    let rawEngagement = 0;
    const uniqueOrgs = new Set<string>();
    const now = Date.now();
    const decayEnabled = normalizedSettings.recencyDecay;
    const decayDays = normalizedSettings.decayDaysUntilCold;
    const maxPerOrg = normalizedSettings.maxSignalsPerOrg ?? 5;
    const orgSignalCount = new Map<string, number>();

    for (const s of contactSignals) {
      if (!domains[s.domain]) domains[s.domain] = { signalCount: 0, lastSignalAt: null, weightedScore: 0 };
      const dp = domains[s.domain];
      dp.signalCount++;
      const org = orgMap.get(s.orgId);
      const tierWeight = normalizedSettings.tierWeights[s.tier] ?? 1;
      const rank = org?.rank ?? 1;
      const orgScore = tierWeight / rank;
      dp.weightedScore += orgScore;
      if (!dp.lastSignalAt || s.detectedAt > dp.lastSignalAt) dp.lastSignalAt = s.detectedAt;

      const orgCount = orgSignalCount.get(s.orgId) ?? 0;
      uniqueOrgs.add(s.orgId);
      if (orgCount >= maxPerOrg) continue;
      orgSignalCount.set(s.orgId, orgCount + 1);

      const multiplier = s.engagementType === "comment" ? 3 : 1;
      let decayFactor = 1;
      if (decayEnabled && decayDays > 0) {
        const ageMs = now - new Date(s.detectedAt).getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        decayFactor = Math.max(0, 1 - ageDays / decayDays);
      }
      rawEngagement += orgScore * multiplier * decayFactor;
    }

    const engagementScore = Math.min(100, Math.round((rawEngagement / ENGAGEMENT_CAP) * 100));

    const profileText = `${(c.title ?? "").toLowerCase()} ${(c.company ?? "").toLowerCase()}`;
    let keywordRaw = 0;
    for (const kw of normalizedSettings.positiveKeywords) {
      if (profileText.includes(kw.toLowerCase())) keywordRaw += 15;
    }
    for (const kw of normalizedSettings.negativeKeywords) {
      if (profileText.includes(kw.toLowerCase())) keywordRaw -= 25;
    }
    const keywordScore = Math.max(0, Math.min(100, keywordRaw));

    const activeDomainCount = domainKeys.filter((d) => (domains[d]?.signalCount ?? 0) > 0).length;
    let crossSignalScore = 0;
    if (totalDomains > 0) {
      if (activeDomainCount === 0) crossSignalScore = 0;
      else if (activeDomainCount === 1) crossSignalScore = 20;
      else if (activeDomainCount === totalDomains) crossSignalScore = 100;
      else crossSignalScore = Math.round(20 + ((activeDomainCount - 1) / (totalDomains - 1)) * 80);
    }

    let enrichmentScore = 0;
    if (c.isEnriched) enrichmentScore += 50;
    if (c.email) enrichmentScore += 25;
    if (c.phone) enrichmentScore += 25;

    const orgCount = uniqueOrgs.size;
    const diversityScore = orgCount >= 5 ? 100 : orgCount * 20;

    const w = normalizedSettings.scoreWeights;
    const wSum = w.engagement + w.profileKeywords + w.crossSignal + w.enrichment + w.orgDiversity;
    const totalScore = wSum > 0
      ? Math.round((engagementScore * w.engagement + keywordScore * w.profileKeywords + crossSignalScore * w.crossSignal + enrichmentScore * w.enrichment + diversityScore * w.orgDiversity) / wSum)
      : 0;

    let status: Contact["status"] = "cold";
    if (totalScore >= normalizedSettings.hotScoreThreshold) status = "hot";
    else if (totalScore >= normalizedSettings.warmThreshold) status = "warm";

    const previousScore = c.totalScore !== 0 ? c.totalScore : c.previousScore;
    const scoreChanged = totalScore !== c.totalScore && c.totalScore !== 0;

    return {
      ...c, domains, activeDomainCount, totalScore, status,
      engagementScore, keywordScore, crossSignalScore, enrichmentScore, diversityScore,
      previousScore: scoreChanged ? c.totalScore : (c.previousScore ?? previousScore),
      scoreChangedAt: scoreChanged ? new Date().toISOString() : c.scoreChangedAt,
    };
  });
}

/** Fire-and-forget DB sync — log errors but don't block UI */
function syncToDb(fn: () => Promise<void>) {
  fn().catch(err => {
    console.error('[Supabase sync error]', err);
  });
}

export const useStore = create<AppState>()(
  (set, get) => ({
    watchlistOrgs: [],
    signals: [],
    contacts: [],
    campaigns: [],
    importHistory: [],
    enrichmentHistory: [],
    syncHistory: [],
    settings: normalizeSettings(DEFAULT_SETTINGS),
    calibrationSuggestions: [],
    isLoading: true,
    isInitialized: false,
    lastError: null,

    initialize: async () => {
      if (get().isInitialized) return;
      set({ isLoading: true, lastError: null });
      try {
        const data = await db.fetchAllData();
        const settings = normalizeSettings(data.settings);
        // Merge fetched domains into settings
        if (data.domains.length > 0) {
          settings.domains = data.domains;
        }
        const contacts = recompute(data.contacts, data.signals, settings, data.orgs);
        set({
          watchlistOrgs: data.orgs,
          signals: data.signals,
          contacts,
          campaigns: data.campaigns,
          importHistory: data.importHistory,
          enrichmentHistory: data.enrichmentHistory,
          syncHistory: data.syncHistory,
          calibrationSuggestions: data.suggestions,
          settings,
          isLoading: false,
          isInitialized: true,
        });
      } catch (err: any) {
        console.error('[Store init error]', err);
        set({ isLoading: false, lastError: err.message ?? 'Failed to load data' });
      }
    },

    addWatchlistOrg: (org) => {
      set((s) => ({ watchlistOrgs: [...s.watchlistOrgs, org] }));
      syncToDb(() => db.upsertOrg(org));
    },

    updateOrg: (id, updates) =>
      set((s) => {
        const updated = s.watchlistOrgs.map((o) => (o.id === id ? { ...o, ...updates } : o));
        const changed = updated.find(o => o.id === id);
        if (changed) syncToDb(() => db.upsertOrg(changed));
        return { watchlistOrgs: updated };
      }),

    removeOrg: (id) => {
      set((s) => ({ watchlistOrgs: s.watchlistOrgs.filter((o) => o.id !== id) }));
      syncToDb(() => db.deleteOrg(id));
    },

    toggleOrgActive: (id) =>
      set((s) => {
        const updated = s.watchlistOrgs.map((o) => (o.id === id ? { ...o, isActive: !o.isActive } : o));
        const changed = updated.find(o => o.id === id);
        if (changed) syncToDb(() => db.upsertOrg(changed));
        return { watchlistOrgs: updated };
      }),

    addSignal: (signal) =>
      set((s) => {
        const normalized = { ...signal, contactLinkedinUrl: normalizeLinkedInUrl(signal.contactLinkedinUrl) };
        const signals = [...s.signals, normalized];
        syncToDb(() => db.insertSignal(normalized));
        return { signals, contacts: recompute(s.contacts, signals, s.settings, s.watchlistOrgs) };
      }),

    addContact: (contact) =>
      set((s) => {
        const normalized = { ...contact, linkedinUrl: normalizeLinkedInUrl(contact.linkedinUrl) };
        const contacts = [...s.contacts, normalized];
        const recomputed = recompute(contacts, s.signals, s.settings, s.watchlistOrgs);
        const final = recomputed.find(c => c.id === normalized.id);
        if (final) syncToDb(() => db.upsertContact(final));
        return { contacts: recomputed };
      }),

    updateContact: (id, updates) =>
      set((s) => {
        const updated = s.contacts.map((c) => (c.id === id ? { ...c, ...updates } : c));
        const changed = updated.find(c => c.id === id);
        if (changed) syncToDb(() => db.upsertContact(changed));
        return { contacts: updated };
      }),

    updateSettings: (updates) =>
      set((s) => {
        const settings = normalizeSettings({ ...s.settings, ...updates });
        const contacts = recompute(s.contacts, s.signals, settings, s.watchlistOrgs);
        syncToDb(() => db.saveSettings(settings));
        syncToDb(() => db.upsertContacts(contacts));
        return { settings, contacts };
      }),

    recomputeScores: () =>
      set((s) => {
        const contacts = recompute(s.contacts, s.signals, s.settings, s.watchlistOrgs);
        syncToDb(() => db.upsertContacts(contacts));
        return { contacts };
      }),

    addKeyword: (keyword, type) =>
      set((s) => {
        const currentSettings = normalizeSettings(s.settings);
        const key = type === "positive" ? "positiveKeywords" : "negativeKeywords";
        const kw = keyword.toLowerCase();
        if (currentSettings[key].includes(kw)) return s;
        const settings = normalizeSettings({ ...currentSettings, [key]: [...currentSettings[key], kw] });
        const contacts = recompute(s.contacts, s.signals, settings, s.watchlistOrgs);
        syncToDb(() => db.saveSettings(settings));
        return { settings, contacts };
      }),

    removeKeyword: (keyword, type) =>
      set((s) => {
        const currentSettings = normalizeSettings(s.settings);
        const key = type === "positive" ? "positiveKeywords" : "negativeKeywords";
        const settings = normalizeSettings({ ...currentSettings, [key]: currentSettings[key].filter((k) => k !== keyword) });
        const contacts = recompute(s.contacts, s.signals, settings, s.watchlistOrgs);
        syncToDb(() => db.saveSettings(settings));
        return { settings, contacts };
      }),

    updateHubSpotMapping: (mapping) =>
      set((s) => {
        const settings = normalizeSettings({ ...s.settings, hubspotMapping: { ...s.settings.hubspotMapping, ...mapping } });
        syncToDb(() => db.saveSettings(settings));
        return { settings };
      }),

    updateLemlistConfig: (config) =>
      set((s) => {
        const settings = normalizeSettings({ ...s.settings, lemlistConfig: { ...s.settings.lemlistConfig, ...config } });
        syncToDb(() => db.saveSettings(settings));
        return { settings };
      }),

    updateAppearance: (config) =>
      set((s) => {
        const settings = normalizeSettings({ ...s.settings, appearance: { ...s.settings.appearance, ...config } });
        syncToDb(() => db.saveSettings(settings));
        return { settings };
      }),

    updateNotifications: (config) =>
      set((s) => {
        const settings = normalizeSettings({ ...s.settings, notifications: { ...s.settings.notifications, ...config } });
        syncToDb(() => db.saveSettings(settings));
        return { settings };
      }),

    updateScoreWeights: (weights) =>
      set((s) => {
        const settings = normalizeSettings({ ...s.settings, scoreWeights: { ...s.settings.scoreWeights, ...weights } });
        const contacts = recompute(s.contacts, s.signals, settings, s.watchlistOrgs);
        syncToDb(() => db.saveSettings(settings));
        syncToDb(() => db.upsertContacts(contacts));
        return { settings, contacts };
      }),

    setThreshold: (type, value) =>
      set((s) => {
        const cur = normalizeSettings(s.settings);
        const settings = type === "warm"
          ? normalizeSettings({ ...cur, warmThreshold: value, hotScoreThreshold: Math.max(cur.hotScoreThreshold, value + 1) })
          : normalizeSettings({ ...cur, hotScoreThreshold: value, warmThreshold: Math.min(cur.warmThreshold, value - 1) });
        const contacts = recompute(s.contacts, s.signals, settings, s.watchlistOrgs);
        syncToDb(() => db.saveSettings(settings));
        return { settings, contacts };
      }),

    setDecayDays: (days) =>
      set((s) => {
        const settings = normalizeSettings({ ...normalizeSettings(s.settings), decayDaysUntilCold: days });
        const contacts = recompute(s.contacts, s.signals, settings, s.watchlistOrgs);
        syncToDb(() => db.saveSettings(settings));
        return { settings, contacts };
      }),

    updateOrgRank: (id, newRank) =>
      set((s) => {
        const org = s.watchlistOrgs.find((o) => o.id === id);
        if (!org) return s;
        const oldRank = org.rank;
        const updated = s.watchlistOrgs.map((o) => {
          if (o.id === id) return { ...o, rank: newRank };
          if (o.domain === org.domain && o.tier === org.tier) {
            if (newRank < oldRank && o.rank >= newRank && o.rank < oldRank) return { ...o, rank: o.rank + 1 };
            if (newRank > oldRank && o.rank <= newRank && o.rank > oldRank) return { ...o, rank: o.rank - 1 };
          }
          return o;
        });
        syncToDb(() => db.upsertOrgs(updated.filter(o => o.domain === org.domain && o.tier === org.tier)));
        return { watchlistOrgs: updated, contacts: recompute(s.contacts, s.signals, s.settings, updated) };
      }),

    addImportRecord: (record) => {
      set((s) => ({ importHistory: [record, ...s.importHistory] }));
      syncToDb(() => db.insertImportRecord(record));
    },

    addEnrichmentRecord: (record) => {
      set((s) => ({ enrichmentHistory: [record, ...s.enrichmentHistory] }));
      syncToDb(() => db.insertEnrichmentRecord(record));
    },

    addSyncRecord: (record) => {
      set((s) => ({ syncHistory: [record, ...s.syncHistory] }));
      syncToDb(() => db.insertSyncRecord(record));
    },

    addCalibrationSuggestion: (suggestion) => {
      set((s) => ({ calibrationSuggestions: [...s.calibrationSuggestions, suggestion] }));
      syncToDb(() => db.upsertSuggestion(suggestion));
    },

    acceptSuggestion: (id) =>
      set((s) => {
        const suggestion = s.calibrationSuggestions.find((su) => su.id === id);
        if (!suggestion) return s;

        const updated = s.calibrationSuggestions.map((su) =>
          su.id === id ? { ...su, status: "accepted" as const, decidedAt: new Date().toISOString() } : su,
        );
        let newState: Partial<AppState> = { calibrationSuggestions: updated };
        const accepted = updated.find(su => su.id === id)!;
        syncToDb(() => db.upsertSuggestion(accepted));

        if (suggestion.type === "rank_change" && suggestion.orgId && suggestion.suggestedRank) {
          const org = s.watchlistOrgs.find((o) => o.id === suggestion.orgId);
          if (org) {
            const oldRank = org.rank;
            const newRank = suggestion.suggestedRank;
            const updatedOrgs = s.watchlistOrgs.map((o) => {
              if (o.id === suggestion.orgId) return { ...o, rank: newRank };
              if (o.domain === org.domain && o.tier === org.tier) {
                if (newRank < oldRank && o.rank >= newRank && o.rank < oldRank) return { ...o, rank: o.rank + 1 };
                if (newRank > oldRank && o.rank <= newRank && o.rank > oldRank) return { ...o, rank: o.rank - 1 };
              }
              return o;
            });
            newState.watchlistOrgs = updatedOrgs;
            newState.contacts = recompute(s.contacts, s.signals, s.settings, updatedOrgs);
            syncToDb(() => db.upsertOrgs(updatedOrgs));
          }
        } else if (suggestion.type === "add_org" && suggestion.suggestedOrgName) {
          const domain = suggestion.domain ?? "kunst";
          const tier = (suggestion.suggestedTier ?? "extended") as any;
          const sameGroup = s.watchlistOrgs.filter((o) => o.domain === domain && o.tier === tier);
          const newOrg: WatchlistOrg = {
            id: `org-cal-${Date.now()}`, name: suggestion.suggestedOrgName,
            linkedinUrl: suggestion.suggestedOrgUrl ?? "", domain, tier,
            isActive: true, postsScrapedCount: 0, lastScrapedAt: null, rank: sameGroup.length + 1,
          };
          const updatedOrgs = [...s.watchlistOrgs, newOrg];
          newState.watchlistOrgs = updatedOrgs;
          newState.contacts = recompute(s.contacts, s.signals, s.settings, updatedOrgs);
          syncToDb(() => db.upsertOrg(newOrg));
        } else if (suggestion.type === "remove_org" && suggestion.orgId) {
          const updatedOrgs = s.watchlistOrgs.filter((o) => o.id !== suggestion.orgId);
          newState.watchlistOrgs = updatedOrgs;
          newState.contacts = recompute(s.contacts, s.signals, s.settings, updatedOrgs);
          syncToDb(() => db.deleteOrg(suggestion.orgId!));
        } else if (suggestion.type === "domain_rename" && suggestion.domain && suggestion.suggestedDomainName) {
          const domainId = suggestion.domain;
          const updatedDomains = s.settings.domains.map(d =>
            d.id === domainId ? { ...d, name: suggestion.suggestedDomainName! } : d
          );
          const settings = { ...s.settings, domains: updatedDomains };
          newState.settings = settings;
          const updatedDomain = updatedDomains.find(d => d.id === domainId);
          if (updatedDomain) syncToDb(() => db.upsertDomain(updatedDomain));
        }

        return newState;
      }),

    rejectSuggestion: (id) =>
      set((s) => {
        const updated = s.calibrationSuggestions.map((su) =>
          su.id === id ? { ...su, status: "rejected" as const, decidedAt: new Date().toISOString() } : su,
        );
        const rejected = updated.find(su => su.id === id);
        if (rejected) syncToDb(() => db.upsertSuggestion(rejected));
        return { calibrationSuggestions: updated };
      }),

    toggleCustomer: (contactId) =>
      set((s) => {
        const updated = s.contacts.map((c) => {
          if (c.id !== contactId) return c;
          return { ...c, isCustomer: !c.isCustomer, customerSince: !c.isCustomer ? new Date().toISOString() : null };
        });
        const changed = updated.find(c => c.id === contactId);
        if (changed) syncToDb(() => db.upsertContact(changed));
        return { contacts: updated };
      }),

    addDomain: (domain) =>
      set((s) => {
        const domains = [...s.settings.domains, domain];
        const settings = normalizeSettings({ ...s.settings, domains });
        const contacts = s.contacts.map(c => ({
          ...c, domains: { ...c.domains, [domain.id]: { signalCount: 0, lastSignalAt: null, weightedScore: 0 } },
        }));
        const recomputed = recompute(contacts, s.signals, settings, s.watchlistOrgs);
        syncToDb(() => db.upsertDomain(domain));
        syncToDb(() => db.saveSettings(settings));
        return { settings, contacts: recomputed };
      }),

    updateDomain: (id, updates) =>
      set((s) => {
        const domains = s.settings.domains.map(d => d.id === id ? { ...d, ...updates } : d);
        const settings = normalizeSettings({ ...s.settings, domains });
        const needsRecompute = 'weight' in updates;
        const updatedDomain = domains.find(d => d.id === id);
        if (updatedDomain) syncToDb(() => db.upsertDomain(updatedDomain));
        syncToDb(() => db.saveSettings(settings));
        return needsRecompute
          ? { settings, contacts: recompute(s.contacts, s.signals, settings, s.watchlistOrgs) }
          : { settings };
      }),

    removeDomain: (id) =>
      set((s) => {
        if (s.settings.domains.length <= 1) return s;
        const domains = s.settings.domains.filter(d => d.id !== id);
        const settings = normalizeSettings({ ...s.settings, domains });
        const watchlistOrgs = s.watchlistOrgs.filter(o => o.domain !== id);
        const signals = s.signals.filter(sig => sig.domain !== id);
        const contacts = s.contacts.map(c => {
          const { [id]: _, ...rest } = c.domains;
          return { ...c, domains: rest };
        });
        syncToDb(() => db.deleteDomain(id));
        syncToDb(() => db.saveSettings(settings));
        syncToDb(() => db.deleteSignalsByDomain(id));
        return {
          settings, watchlistOrgs, signals,
          contacts: recompute(contacts, signals, settings, watchlistOrgs),
        };
      }),

    reorderDomains: (orderedIds) =>
      set((s) => {
        const domains = s.settings.domains.map(d => ({
          ...d, sortOrder: orderedIds.indexOf(d.id),
        })).sort((a, b) => a.sortOrder - b.sortOrder);
        const settings = { ...s.settings, domains };
        syncToDb(async () => {
          for (const d of domains) await db.upsertDomain(d);
        });
        return { settings };
      }),
  }),
);
