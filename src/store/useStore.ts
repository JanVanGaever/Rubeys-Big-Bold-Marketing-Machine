import { create } from "zustand";
import { persist } from "zustand/middleware";
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
import { SEED_ORGS, buildSignals, buildContacts, SEED_CAMPAIGNS, DEFAULT_SETTINGS } from "@/lib/seed-data";

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

  addWatchlistOrg: (org: WatchlistOrg) => void;
  updateOrg: (id: string, updates: Partial<WatchlistOrg>) => void;
  removeOrg: (id: string) => void;
  toggleOrgActive: (id: string) => void;
  addSignal: (signal: Signal) => void;
  addContact: (contact: Contact) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
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
  updateOrgRank: (id: string, newRank: number) => void;
  addImportRecord: (record: ImportRecord) => void;
  addEnrichmentRecord: (record: EnrichmentRecord) => void;
  addSyncRecord: (record: SyncRecord) => void;
  addCalibrationSuggestion: (suggestion: CalibrationSuggestion) => void;
  acceptSuggestion: (id: string) => void;
  rejectSuggestion: (id: string) => void;
  toggleCustomer: (contactId: string) => void;
  addDomain: (domain: DomainDefinition) => void;
  updateDomain: (id: string, updates: Partial<Omit<DomainDefinition, 'id'>>) => void;
  removeDomain: (id: string) => void;
  reorderDomains: (orderedIds: string[]) => void;
}

const ENGAGEMENT_CAP = 30;

/** Migrate old domainConfig format to new domains array */
function migrateDomainConfig(input: any): DomainDefinition[] | undefined {
  if (input?.domainConfig && !input?.domains) {
    const cfg = input.domainConfig as Record<string, { name: string; color: string; description: string }>;
    return Object.entries(cfg).map(([id, v], i) => ({
      id,
      name: v.name,
      description: v.description,
      color: v.color,
      weight: Math.round(100 / Object.keys(cfg).length),
      sortOrder: i,
      createdAt: '2026-01-01T00:00:00Z',
    }));
  }
  return undefined;
}

function normalizeSettings(settings?: Partial<AppSettings> | null): AppSettings {
  const input = (settings ?? {}) as any;

  // Migrate old domainConfig to domains array
  const migratedDomains = migrateDomainConfig(input);
  const domains = migratedDomains ?? input.domains ?? DEFAULT_SETTINGS.domains;

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
      fields: {
        ...DEFAULT_SETTINGS.hubspotSyncRules.fields,
        ...(input.hubspotSyncRules?.fields ?? {}),
      },
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
    // Also preserve any domains from signals not in current domain list
    for (const key of Object.keys(c.domains)) {
      if (!domains[key]) {
        domains[key] = { signalCount: 0, lastSignalAt: null, weightedScore: 0 };
      }
    }

    const contactSignals = signals.filter((s) => s.contactLinkedinUrl === c.linkedinUrl);

    let rawEngagement = 0;
    const uniqueOrgs = new Set<string>();

    const now = Date.now();
    const decayEnabled = normalizedSettings.recencyDecay;
    const decayDays = normalizedSettings.decayDaysUntilCold;

    for (const s of contactSignals) {
      if (!domains[s.domain]) {
        domains[s.domain] = { signalCount: 0, lastSignalAt: null, weightedScore: 0 };
      }
      const dp = domains[s.domain];
      dp.signalCount++;
      const org = orgMap.get(s.orgId);
      const tierWeight = normalizedSettings.tierWeights[s.tier] ?? 1;
      const rank = org?.rank ?? 1;
      const orgScore = tierWeight / rank;
      dp.weightedScore += orgScore;
      if (!dp.lastSignalAt || s.detectedAt > dp.lastSignalAt) dp.lastSignalAt = s.detectedAt;
      const multiplier = s.engagementType === "comment" ? 3 : 1;

      let decayFactor = 1;
      if (decayEnabled && decayDays > 0) {
        const ageMs = now - new Date(s.detectedAt).getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        decayFactor = Math.max(0, 1 - ageDays / decayDays);
      }

      rawEngagement += orgScore * multiplier * decayFactor;
      uniqueOrgs.add(s.orgId);
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
    
    // Dynamic cross-signal scoring based on total domains
    let crossSignalScore = 0;
    if (totalDomains > 0) {
      if (activeDomainCount === 0) crossSignalScore = 0;
      else if (activeDomainCount === 1) crossSignalScore = 20;
      else if (activeDomainCount === totalDomains) crossSignalScore = 100;
      else {
        // Linear interpolation between 20 (1 domain) and 100 (all domains)
        crossSignalScore = Math.round(20 + ((activeDomainCount - 1) / (totalDomains - 1)) * 80);
      }
    }

    let enrichmentScore = 0;
    if (c.isEnriched) enrichmentScore += 50;
    if (c.email) enrichmentScore += 25;
    if (c.phone) enrichmentScore += 25;

    const orgCount = uniqueOrgs.size;
    const diversityScore = orgCount >= 5 ? 100 : orgCount * 20;

    const w = normalizedSettings.scoreWeights;
    const wSum = w.engagement + w.profileKeywords + w.crossSignal + w.enrichment + w.orgDiversity;
    const totalScore =
      wSum > 0
        ? Math.round(
            (engagementScore * w.engagement +
              keywordScore * w.profileKeywords +
              crossSignalScore * w.crossSignal +
              enrichmentScore * w.enrichment +
              diversityScore * w.orgDiversity) /
              wSum,
          )
        : 0;

    let status: Contact["status"] = "cold";
    if (totalScore >= normalizedSettings.hotScoreThreshold) status = "hot";
    else if (totalScore >= normalizedSettings.warmThreshold) status = "warm";

    const previousScore = c.totalScore !== 0 ? c.totalScore : c.previousScore;
    const scoreChanged = totalScore !== c.totalScore && c.totalScore !== 0;

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
      previousScore: scoreChanged ? c.totalScore : (c.previousScore ?? previousScore),
      scoreChangedAt: scoreChanged ? new Date().toISOString() : c.scoreChangedAt,
    };
  });
}

const seedSignals = buildSignals();
const seedContacts = buildContacts(seedSignals, DEFAULT_SETTINGS.hotScoreThreshold);

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      watchlistOrgs: SEED_ORGS,
      signals: seedSignals,
      contacts: seedContacts,
      campaigns: SEED_CAMPAIGNS,
      importHistory: [],
      enrichmentHistory: [],
      syncHistory: [],
      settings: normalizeSettings(DEFAULT_SETTINGS),
      calibrationSuggestions: [],

      addWatchlistOrg: (org) => set((s) => ({ watchlistOrgs: [...s.watchlistOrgs, org] })),
      updateOrg: (id, updates) =>
        set((s) => ({ watchlistOrgs: s.watchlistOrgs.map((o) => (o.id === id ? { ...o, ...updates } : o)) })),
      removeOrg: (id) => set((s) => ({ watchlistOrgs: s.watchlistOrgs.filter((o) => o.id !== id) })),
      toggleOrgActive: (id) =>
        set((s) => ({
          watchlistOrgs: s.watchlistOrgs.map((o) => (o.id === id ? { ...o, isActive: !o.isActive } : o)),
        })),

      addSignal: (signal) =>
        set((s) => {
          const signals = [...s.signals, signal];
          return { signals, contacts: recompute(s.contacts, signals, s.settings, s.watchlistOrgs) };
        }),

      addContact: (contact) =>
        set((s) => {
          const contacts = [...s.contacts, contact];
          return { contacts: recompute(contacts, s.signals, s.settings, s.watchlistOrgs) };
        }),
      updateContact: (id, updates) =>
        set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),

      updateSettings: (updates) =>
        set((s) => {
          const settings = normalizeSettings({ ...s.settings, ...updates });
          return { settings, contacts: recompute(s.contacts, s.signals, settings, s.watchlistOrgs) };
        }),

      recomputeScores: () => set((s) => ({ contacts: recompute(s.contacts, s.signals, s.settings, s.watchlistOrgs) })),

      addKeyword: (keyword, type) =>
        set((s) => {
          const currentSettings = normalizeSettings(s.settings);
          const key = type === "positive" ? "positiveKeywords" : "negativeKeywords";
          const kw = keyword.toLowerCase();
          if (currentSettings[key].includes(kw)) return s;
          const settings = normalizeSettings({ ...currentSettings, [key]: [...currentSettings[key], kw] });
          return { settings, contacts: recompute(s.contacts, s.signals, settings, s.watchlistOrgs) };
        }),

      removeKeyword: (keyword, type) =>
        set((s) => {
          const currentSettings = normalizeSettings(s.settings);
          const key = type === "positive" ? "positiveKeywords" : "negativeKeywords";
          const settings = normalizeSettings({
            ...currentSettings,
            [key]: currentSettings[key].filter((k) => k !== keyword),
          });
          return { settings, contacts: recompute(s.contacts, s.signals, settings, s.watchlistOrgs) };
        }),

      updateHubSpotMapping: (mapping) =>
        set((s) => {
          const currentSettings = normalizeSettings(s.settings);
          return {
            settings: normalizeSettings({
              ...currentSettings,
              hubspotMapping: { ...currentSettings.hubspotMapping, ...mapping },
            }),
          };
        }),
      updateLemlistConfig: (config) =>
        set((s) => {
          const currentSettings = normalizeSettings(s.settings);
          return {
            settings: normalizeSettings({
              ...currentSettings,
              lemlistConfig: { ...currentSettings.lemlistConfig, ...config },
            }),
          };
        }),
      updateAppearance: (config) =>
        set((s) => {
          const currentSettings = normalizeSettings(s.settings);
          return {
            settings: normalizeSettings({
              ...currentSettings,
              appearance: { ...currentSettings.appearance, ...config },
            }),
          };
        }),
      updateNotifications: (config) =>
        set((s) => {
          const currentSettings = normalizeSettings(s.settings);
          return {
            settings: normalizeSettings({
              ...currentSettings,
              notifications: { ...currentSettings.notifications, ...config },
            }),
          };
        }),

      updateScoreWeights: (weights) =>
        set((s) => {
          const currentSettings = normalizeSettings(s.settings);
          const settings = normalizeSettings({
            ...currentSettings,
            scoreWeights: { ...currentSettings.scoreWeights, ...weights },
          });
          return { settings, contacts: recompute(s.contacts, s.signals, settings, s.watchlistOrgs) };
        }),

      setThreshold: (type, value) =>
        set((s) => {
          const currentSettings = normalizeSettings(s.settings);
          let settings: AppSettings;
          if (type === "warm") {
            settings = normalizeSettings({
              ...currentSettings,
              warmThreshold: value,
              hotScoreThreshold: Math.max(currentSettings.hotScoreThreshold, value + 1),
            });
          } else {
            settings = normalizeSettings({
              ...currentSettings,
              hotScoreThreshold: value,
              warmThreshold: Math.min(currentSettings.warmThreshold, value - 1),
            });
          }
          return { settings, contacts: recompute(s.contacts, s.signals, settings, s.watchlistOrgs) };
        }),

      setDecayDays: (days) =>
        set((s) => {
          const settings = normalizeSettings({ ...normalizeSettings(s.settings), decayDaysUntilCold: days });
          return { settings, contacts: recompute(s.contacts, s.signals, settings, s.watchlistOrgs) };
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
          return { watchlistOrgs: updated, contacts: recompute(s.contacts, s.signals, s.settings, updated) };
        }),

      addImportRecord: (record) => set((s) => ({ importHistory: [record, ...s.importHistory] })),
      addEnrichmentRecord: (record) => set((s) => ({ enrichmentHistory: [record, ...s.enrichmentHistory] })),
      addSyncRecord: (record) => set((s) => ({ syncHistory: [record, ...s.syncHistory] })),

      addCalibrationSuggestion: (suggestion) =>
        set((s) => ({ calibrationSuggestions: [...s.calibrationSuggestions, suggestion] })),

      acceptSuggestion: (id) =>
        set((s) => {
          const suggestion = s.calibrationSuggestions.find((su) => su.id === id);
          if (!suggestion) return s;

          const updated = s.calibrationSuggestions.map((su) =>
            su.id === id ? { ...su, status: "accepted" as const, decidedAt: new Date().toISOString() } : su,
          );
          let newState: Partial<AppState> = { calibrationSuggestions: updated };

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
            }
          } else if (suggestion.type === "add_org" && suggestion.suggestedOrgName) {
            const domain = suggestion.domain ?? "kunst";
            const tier = (suggestion.suggestedTier ?? "extended") as any;
            const sameGroup = s.watchlistOrgs.filter((o) => o.domain === domain && o.tier === tier);
            const newOrg: WatchlistOrg = {
              id: `org-cal-${Date.now()}`,
              name: suggestion.suggestedOrgName,
              linkedinUrl: suggestion.suggestedOrgUrl ?? "",
              domain,
              tier,
              isActive: true,
              postsScrapedCount: 0,
              lastScrapedAt: null,
              rank: sameGroup.length + 1,
            };
            const updatedOrgs = [...s.watchlistOrgs, newOrg];
            newState.watchlistOrgs = updatedOrgs;
            newState.contacts = recompute(s.contacts, s.signals, s.settings, updatedOrgs);
          } else if (suggestion.type === "remove_org" && suggestion.orgId) {
            const updatedOrgs = s.watchlistOrgs.filter((o) => o.id !== suggestion.orgId);
            newState.watchlistOrgs = updatedOrgs;
            newState.contacts = recompute(s.contacts, s.signals, s.settings, updatedOrgs);
          } else if (suggestion.type === "domain_rename" && suggestion.domain && suggestion.suggestedDomainName) {
            const domainId = suggestion.domain;
            const updatedDomains = s.settings.domains.map(d =>
              d.id === domainId ? { ...d, name: suggestion.suggestedDomainName! } : d
            );
            const settings = { ...s.settings, domains: updatedDomains };
            newState.settings = settings;
          }

          return newState;
        }),

      rejectSuggestion: (id) =>
        set((s) => ({
          calibrationSuggestions: s.calibrationSuggestions.map((su) =>
            su.id === id ? { ...su, status: "rejected" as const, decidedAt: new Date().toISOString() } : su,
          ),
        })),

      toggleCustomer: (contactId) =>
        set((s) => ({
          contacts: s.contacts.map((c) => {
            if (c.id !== contactId) return c;
            return { ...c, isCustomer: !c.isCustomer, customerSince: !c.isCustomer ? new Date().toISOString() : null };
          }),
        })),

      addDomain: (domain) =>
        set((s) => {
          const domains = [...s.settings.domains, domain];
          const settings = normalizeSettings({ ...s.settings, domains });
          // Add empty domain presence to all contacts
          const contacts = s.contacts.map(c => ({
            ...c,
            domains: { ...c.domains, [domain.id]: { signalCount: 0, lastSignalAt: null, weightedScore: 0 } },
          }));
          return { settings, contacts: recompute(contacts, s.signals, settings, s.watchlistOrgs) };
        }),

      updateDomain: (id, updates) =>
        set((s) => {
          const domains = s.settings.domains.map(d => d.id === id ? { ...d, ...updates } : d);
          const settings = normalizeSettings({ ...s.settings, domains });
          const needsRecompute = 'weight' in updates;
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
          return {
            settings,
            watchlistOrgs,
            signals,
            contacts: recompute(contacts, signals, settings, watchlistOrgs),
          };
        }),

      reorderDomains: (orderedIds) =>
        set((s) => {
          const domains = s.settings.domains.map(d => ({
            ...d,
            sortOrder: orderedIds.indexOf(d.id),
          })).sort((a, b) => a.sortOrder - b.sortOrder);
          return { settings: { ...s.settings, domains } };
        }),
    }),
    {
      name: "rubey-store",
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppState> | undefined;

        return {
          ...currentState,
          ...persisted,
          settings: normalizeSettings(persisted?.settings as Partial<AppSettings> | undefined),
        };
      },
      partialize: (state) => ({
        watchlistOrgs: state.watchlistOrgs,
        signals: state.signals,
        contacts: state.contacts,
        campaigns: state.campaigns,
        importHistory: state.importHistory,
        enrichmentHistory: state.enrichmentHistory,
        syncHistory: state.syncHistory,
        settings: state.settings,
        calibrationSuggestions: state.calibrationSuggestions,
      }),
    },
  ),
);
