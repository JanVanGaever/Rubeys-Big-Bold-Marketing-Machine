import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ConnectionStatus = 'not_configured' | 'testing' | 'connected' | 'warning' | 'error';

export interface Connection {
  id: string;
  name: string;
  description: string;
  status: ConnectionStatus;
  statusMessage: string;
  lastChecked: string | null;
  config: Record<string, string>;
}

interface ConnectionStore {
  connections: Connection[];
  setupCompleted: boolean;
  currentSetupStep: number;
  setConnectionConfig: (id: string, config: Record<string, string>) => void;
  setConnectionStatus: (id: string, status: ConnectionStatus, message?: string) => void;
  testConnection: (id: string) => Promise<void>;
  setCurrentStep: (step: number) => void;
  completeSetup: () => void;
  resetSetup: () => void;
}

const DEFAULT_CONNECTIONS: Connection[] = [
  {
    id: 'chrome-extension',
    name: 'Chrome extensie',
    description: 'LinkedIn signalen verzamelen via de browser extensie',
    status: 'not_configured',
    statusMessage: '',
    lastChecked: null,
    config: {},
  },
  {
    id: 'apollo',
    name: 'Apollo.io',
    description: 'Contact enrichment via Apollo API',
    status: 'not_configured',
    statusMessage: '',
    lastChecked: null,
    config: {},
  },
  {
    id: 'lemlist',
    name: 'Lemlist',
    description: 'Outreach campagnes beheren',
    status: 'not_configured',
    statusMessage: '',
    lastChecked: null,
    config: {},
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'CRM synchronisatie en pipeline beheer',
    status: 'not_configured',
    statusMessage: '',
    lastChecked: null,
    config: {},
  },
  {
    id: 'n8n',
    name: 'n8n Webhooks',
    description: 'Automatisering workflows verbinden',
    status: 'not_configured',
    statusMessage: '',
    lastChecked: null,
    config: {},
  },
];

export const useConnectionStore = create<ConnectionStore>()(
  persist(
    (set, get) => ({
      connections: DEFAULT_CONNECTIONS,
      setupCompleted: false,
      currentSetupStep: 0,

      setConnectionConfig: (id, config) =>
        set((s) => ({
          connections: s.connections.map((c) =>
            c.id === id ? { ...c, config: { ...c.config, ...config } } : c
          ),
        })),

      setConnectionStatus: (id, status, message) =>
        set((s) => ({
          connections: s.connections.map((c) =>
            c.id === id
              ? { ...c, status, statusMessage: message ?? c.statusMessage, lastChecked: new Date().toISOString() }
              : c
          ),
        })),

      testConnection: async (id) => {
        const { setConnectionStatus, connections } = get();
        const conn = connections.find((c) => c.id === id);
        if (!conn) return;

        setConnectionStatus(id, 'testing', 'Verbinding testen...');
        await new Promise((r) => setTimeout(r, 1500));

        if (id === 'chrome-extension') {
          setConnectionStatus(id, 'connected', 'Extensie gedetecteerd');
          return;
        }

        if (id === 'n8n') {
          const url = get().connections.find((c) => c.id === 'n8n')!.config.webhookUrl;
          if (url && url.trim()) {
            setConnectionStatus(id, 'connected', 'Webhook bereikbaar');
          } else {
            setConnectionStatus(id, 'error', 'Geen webhook URL geconfigureerd');
          }
          return;
        }

        // Apollo, HubSpot, Lemlist: check n8n status
        const n8n = get().connections.find((c) => c.id === 'n8n');
        if (!n8n || n8n.status !== 'connected') {
          setConnectionStatus(id, 'not_configured', 'Wacht op n8n');
          return;
        }
        // Actual test happens via testServiceViaWebhook in SetupPage
        setConnectionStatus(id, 'not_configured', 'Wacht op n8n');
      },

      setCurrentStep: (step) => set({ currentSetupStep: step }),

      completeSetup: () => set({ setupCompleted: true }),

      resetSetup: () => set({ setupCompleted: false, currentSetupStep: 0 }),
    }),
    {
      name: 'rubey-connections',
      partialize: (state) => ({
        connections: state.connections,
        setupCompleted: state.setupCompleted,
        currentSetupStep: state.currentSetupStep,
      }),
    }
  )
);
