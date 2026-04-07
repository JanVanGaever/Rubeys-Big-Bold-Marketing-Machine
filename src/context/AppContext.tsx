import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { MOCK_DOMAINS, MOCK_CONTACTS, MOCK_CAMPAIGNS, DEFAULT_SETTINGS } from '@/lib/mock-data';
import { recalculateAll, calculateScore, type ScoreBreakdown } from '@/lib/scoring';
import type { Contact, Domain, AppSettings, LemlistCampaign } from '@/types';

interface AppContextType {
  // Data
  contacts: Contact[];
  domains: Domain[];
  settings: AppSettings;
  campaigns: LemlistCampaign[];

  // Domain mutations
  setDomains: (fn: (prev: Domain[]) => Domain[]) => void;
  updateDomain: (id: string, partial: Partial<Domain>) => void;
  addDomain: (domain: Domain) => void;
  deleteDomain: (id: string) => void;

  // Settings mutations
  setSettings: (fn: (prev: AppSettings) => AppSettings) => void;

  // Contact mutations
  setContacts: (fn: (prev: Contact[]) => Contact[]) => void;

  // Scoring helpers
  getBreakdown: (contact: Contact) => ScoreBreakdown;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsRaw] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [domains, setDomainsRaw] = useState<Domain[]>(MOCK_DOMAINS);
  const [campaigns] = useState<LemlistCampaign[]>(MOCK_CAMPAIGNS);

  // Contacts are derived: recalculated whenever domains or settings change
  const [baseContacts, setBaseContacts] = useState<Contact[]>(MOCK_CONTACTS);

  const contacts = useMemo(
    () => recalculateAll(baseContacts, domains, settings),
    [baseContacts, domains, settings]
  );

  const setDomains = useCallback((fn: (prev: Domain[]) => Domain[]) => {
    setDomainsRaw(fn);
  }, []);

  const updateDomain = useCallback((id: string, partial: Partial<Domain>) => {
    setDomainsRaw(prev => prev.map(d => d.id === id ? { ...d, ...partial } : d));
  }, []);

  const addDomain = useCallback((domain: Domain) => {
    setDomainsRaw(prev => [...prev, domain]);
  }, []);

  const deleteDomain = useCallback((id: string) => {
    setDomainsRaw(prev => {
      const filtered = prev.filter(d => d.id !== id);
      return filtered.map((d, i) => ({ ...d, sortOrder: i + 1 }));
    });
  }, []);

  const setSettings = useCallback((fn: (prev: AppSettings) => AppSettings) => {
    setSettingsRaw(fn);
  }, []);

  const setContacts = useCallback((fn: (prev: Contact[]) => Contact[]) => {
    setBaseContacts(fn);
  }, []);

  const getBreakdown = useCallback((contact: Contact) => {
    return calculateScore(contact, domains, settings);
  }, [domains, settings]);

  const value = useMemo<AppContextType>(() => ({
    contacts, domains, settings, campaigns,
    setDomains, updateDomain, addDomain, deleteDomain,
    setSettings, setContacts, getBreakdown,
  }), [contacts, domains, settings, campaigns, setDomains, updateDomain, addDomain, deleteDomain, setSettings, setContacts, getBreakdown]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
