import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ScoreWeights {
  engagement: number;
  profileKeywords: number;
  crossSignal: number;
  enrichment: number;
  orgDiversity: number;
}

export interface HubSpotMapping {
  leadSource: string;
  lifecycleStage: string;
  contactOwner: string;
}

export interface LemlistConfig {
  dailySendLimit: number;
  defaultCampaignId: string;
}

export interface AppearanceConfig {
  theme: 'dark' | 'light' | 'system';
  compactMode: boolean;
  accentColor: 'coral' | 'blue' | 'emerald' | 'amber' | 'purple';
}

export interface NotificationConfig {
  newHotLead: boolean;
  enrichmentFailed: boolean;
  connectionDown: boolean;
  dailyDigest: boolean;
}

interface ConfigStore {
  scoreWeights: ScoreWeights;
  hotThreshold: number;
  warmThreshold: number;
  decayDaysUntilCold: number;
  positiveKeywords: string[];
  negativeKeywords: string[];
  hubspotMapping: HubSpotMapping;
  lemlistConfig: LemlistConfig;
  appearance: AppearanceConfig;
  notifications: NotificationConfig;

  updateScoreWeights: (weights: Partial<ScoreWeights>) => void;
  setThreshold: (type: 'hot' | 'warm', value: number) => void;
  setDecayDays: (days: number) => void;
  addKeyword: (keyword: string, type: 'positive' | 'negative') => void;
  removeKeyword: (keyword: string, type: 'positive' | 'negative') => void;
  updateHubSpotMapping: (mapping: Partial<HubSpotMapping>) => void;
  updateLemlistConfig: (config: Partial<LemlistConfig>) => void;
  updateAppearance: (config: Partial<AppearanceConfig>) => void;
  updateNotifications: (config: Partial<NotificationConfig>) => void;
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      scoreWeights: { engagement: 30, profileKeywords: 25, crossSignal: 25, enrichment: 10, orgDiversity: 10 },
      hotThreshold: 70,
      warmThreshold: 40,
      decayDaysUntilCold: 30,
      positiveKeywords: ['kunst', 'investeren', 'collectie', 'galerie', 'beleggen', 'portefeuille', 'oldtimer', 'classic car', 'luxe', 'vermogensbeheer'],
      negativeKeywords: ['stage', 'student', 'gratis', 'goedkoop', 'crypto', 'NFT'],
      hubspotMapping: { leadSource: "Rubey's Big Bold Marketing Machine", lifecycleStage: 'lead', contactOwner: 'jan.van.gaever@rubey.be' },
      lemlistConfig: { dailySendLimit: 50, defaultCampaignId: '' },
      appearance: { theme: 'dark', compactMode: false, accentColor: 'coral' },
      notifications: { newHotLead: true, enrichmentFailed: true, connectionDown: true, dailyDigest: false },

      updateScoreWeights: (weights) =>
        set((s) => ({ scoreWeights: { ...s.scoreWeights, ...weights } })),

      setThreshold: (type, value) =>
        set((s) => {
          if (type === 'warm') {
            return { warmThreshold: value, hotThreshold: Math.max(s.hotThreshold, value + 1) };
          }
          return { hotThreshold: value, warmThreshold: Math.min(s.warmThreshold, value - 1) };
        }),

      setDecayDays: (days) => set({ decayDaysUntilCold: days }),

      addKeyword: (keyword, type) =>
        set((s) => {
          const key = type === 'positive' ? 'positiveKeywords' : 'negativeKeywords';
          if (s[key].includes(keyword.toLowerCase())) return s;
          return { [key]: [...s[key], keyword.toLowerCase()] };
        }),

      removeKeyword: (keyword, type) =>
        set((s) => {
          const key = type === 'positive' ? 'positiveKeywords' : 'negativeKeywords';
          return { [key]: s[key].filter((k) => k !== keyword) };
        }),

      updateHubSpotMapping: (mapping) =>
        set((s) => ({ hubspotMapping: { ...s.hubspotMapping, ...mapping } })),

      updateLemlistConfig: (config) =>
        set((s) => ({ lemlistConfig: { ...s.lemlistConfig, ...config } })),

      updateAppearance: (config) =>
        set((s) => ({ appearance: { ...s.appearance, ...config } })),

      updateNotifications: (config) =>
        set((s) => ({ notifications: { ...s.notifications, ...config } })),
    }),
    { name: 'rubey-config' }
  )
);
