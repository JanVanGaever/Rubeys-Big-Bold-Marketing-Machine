import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WatchlistOrg, Signal, Contact, Domain, AppSettings, LemlistCampaign } from '@/types';
import { TIER_WEIGHT } from '@/types';
import { SEED_ORGS, buildSignals, buildContacts, SEED_CAMPAIGNS, DEFAULT_SETTINGS } from '@/lib/seed-data';

interface AppState {
  watchlistOrgs: WatchlistOrg[];
  signals: Signal[];
  contacts: Contact[];
  campaigns: LemlistCampaign[];
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
}

function recompute(contacts: Contact[], signals: Signal[], settings: AppSettings): Contact[] {
  const domainKeys: Domain[] = ['kunst', 'beleggen', 'luxe'];

  return contacts.map(c => {
    const domains = {
      kunst: { signalCount: 0, lastSignalAt: null as string | null, weightedScore: 0 },
      beleggen: { signalCount: 0, lastSignalAt: null as string | null, weightedScore: 0 },
      luxe: { signalCount: 0, lastSignalAt: null as string | null, weightedScore: 0 },
    };

    const contactSignals = signals.filter(s => s.contactLinkedinUrl === c.linkedinUrl);
    for (const s of contactSignals) {
      const dp = domains[s.domain];
      dp.signalCount++;
      dp.weightedScore += TIER_WEIGHT[s.tier];
      if (!dp.lastSignalAt || s.detectedAt > dp.lastSignalAt) {
        dp.lastSignalAt = s.detectedAt;
      }
    }

    const activeDomainCount = domainKeys.filter(d => domains[d].signalCount > 0).length;
    const totalScore = domainKeys.reduce((sum, d) => sum + domains[d].weightedScore, 0);

    let status: Contact['status'] = 'cold';
    if (activeDomainCount >= 3) status = 'hot';
    else if (activeDomainCount === 2 && totalScore >= settings.hotScoreThreshold) status = 'hot';
    else if (activeDomainCount >= 2) status = 'warm';

    return { ...c, domains, activeDomainCount, totalScore, status };
  });
}

const seedSignals = buildSignals();
const seedContacts = buildContacts(seedSignals, DEFAULT_SETTINGS.hotScoreThreshold);

export const useStore = create<AppState>((set, get) => ({
  watchlistOrgs: SEED_ORGS,
  signals: seedSignals,
  contacts: seedContacts,
  campaigns: SEED_CAMPAIGNS,
  settings: DEFAULT_SETTINGS,

  addWatchlistOrg: (org) => set(s => ({ watchlistOrgs: [...s.watchlistOrgs, org] })),
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
    const contacts = recompute(s.contacts, signals, s.settings);
    return { signals, contacts };
  }),

  addContact: (contact) => set(s => {
    const contacts = [...s.contacts, contact];
    return { contacts: recompute(contacts, s.signals, s.settings) };
  }),
  updateContact: (id, updates) => set(s => ({
    contacts: s.contacts.map(c => c.id === id ? { ...c, ...updates } : c),
  })),

  updateSettings: (updates) => set(s => {
    const settings = { ...s.settings, ...updates };
    const contacts = recompute(s.contacts, s.signals, settings);
    return { settings, contacts };
  }),

  recomputeScores: () => set(s => ({
    contacts: recompute(s.contacts, s.signals, s.settings),
  })),
}));
