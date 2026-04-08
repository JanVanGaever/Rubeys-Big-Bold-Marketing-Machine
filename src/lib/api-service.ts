import { useConnectionStore } from '@/stores/connectionStore';
import { classifyError, getRetryDelay, addApiLog, type ApiError } from './api-error-handler';
import { validateResponseSchema } from './webhook-schemas';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorType?: ApiError['type'];
}

function getN8nBaseUrl(): string | null {
  const connections = useConnectionStore.getState().connections;
  const n8n = connections.find(c => c.id === 'n8n');
  if (!n8n || n8n.status !== 'connected' || !n8n.config.webhookUrl) return null;
  return n8n.config.webhookUrl;
}

async function callWebhook<T>(connectionId: string, action: string, payload: Record<string, unknown>): Promise<ApiResponse<T>> {
  const baseUrl = getN8nBaseUrl();
  if (!baseUrl) return { success: false, error: 'n8n webhook niet geconfigureerd', errorType: 'network' };

  if (!navigator.onLine) return { success: false, error: 'Geen internetverbinding', errorType: 'network' };

  const url = baseUrl.replace(/\/$/, '') + '/' + action;
  const body = JSON.stringify({ service: connectionId, action, payload, timestamp: new Date().toISOString() });

  let lastError: ApiResponse<T> = { success: false, error: 'Onbekende fout' };

  for (let attempt = 0; attempt <= 3; attempt++) {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const duration = Date.now() - start;

      if (response.ok) {
        const data = await response.json() as T;
        const schemaValid = validateResponseSchema(action, data);
        addApiLog({ timestamp: new Date().toISOString(), service: connectionId, action, status: 'success', durationMs: duration, schemaValid });
        if (!schemaValid) {
          console.warn(`[API] Response for ${action} does not match expected schema`, data);
        }
        return { success: true, data };
      }

      const apiErr = classifyError(response.status);
      addApiLog({ timestamp: new Date().toISOString(), service: connectionId, action, status: apiErr.retryable && attempt < apiErr.maxRetries ? 'retrying' : 'error', durationMs: duration, error: apiErr.message });

      if (apiErr.retryable && attempt < apiErr.maxRetries) {
        await new Promise(r => setTimeout(r, getRetryDelay(attempt)));
        continue;
      }
      return { success: false, error: apiErr.message, errorType: apiErr.type };
    } catch (err) {
      clearTimeout(timeout);
      const duration = Date.now() - start;
      const apiErr = classifyError(undefined, err instanceof Error ? err : new Error(String(err)));
      addApiLog({ timestamp: new Date().toISOString(), service: connectionId, action, status: apiErr.retryable && attempt < apiErr.maxRetries ? 'retrying' : 'error', durationMs: duration, error: apiErr.message });

      if (apiErr.retryable && attempt < apiErr.maxRetries) {
        await new Promise(r => setTimeout(r, getRetryDelay(attempt)));
        continue;
      }
      lastError = { success: false, error: apiErr.message, errorType: apiErr.type };
    }
  }
  return lastError;
}

// ── APOLLO ──
export interface ApolloEnrichResult {
  email?: string;
  phone?: string;
  personalEmail?: string;
  workEmail?: string;
  title?: string;
  company?: string;
  companySize?: string;
  industry?: string;
  linkedinUrl?: string;
}

export async function enrichContact(contact: { linkedinUrl: string; firstName: string; lastName: string; company?: string | null }): Promise<ApiResponse<ApolloEnrichResult>> {
  return callWebhook<ApolloEnrichResult>('apollo', 'apollo-enrich', {
    linkedinUrl: contact.linkedinUrl,
    firstName: contact.firstName,
    lastName: contact.lastName,
    company: contact.company || undefined,
  });
}

// ── DROPCONTACT ──
export interface DropcontactEnrichResult {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  company?: string;
  companyWebsite?: string;
  companyLinkedin?: string;
  civility?: string;
  isVerified?: boolean;
}

export async function enrichViaDropcontact(contact: {
  firstName: string;
  lastName: string;
  company?: string | null;
  companyWebsite?: string | null;
  email?: string | null;
}): Promise<ApiResponse<DropcontactEnrichResult>> {
  return callWebhook<DropcontactEnrichResult>('dropcontact', 'dropcontact-enrich', {
    firstName: contact.firstName,
    lastName: contact.lastName,
    company: contact.company || undefined,
    companyWebsite: contact.companyWebsite || undefined,
    email: contact.email || undefined,
  });
}

export async function enrichBatchViaDropcontact(contacts: Array<{
  id: string;
  firstName: string;
  lastName: string;
  company?: string | null;
  companyWebsite?: string | null;
  email?: string | null;
}>): Promise<ApiResponse<Record<string, DropcontactEnrichResult>>> {
  return callWebhook<Record<string, DropcontactEnrichResult>>('dropcontact', 'dropcontact-enrich-batch', {
    contacts: contacts.map(c => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      company: c.company || undefined,
      companyWebsite: c.companyWebsite || undefined,
      email: c.email || undefined,
    })),
  });
}

export function isDropcontactReady(): boolean {
  return isConnectionReady('dropcontact');
}

// ── WATERFALL ENRICHMENT ──
export interface WaterfallEnrichResult {
  email: string | null;
  phone: string | null;
  title: string | null;
  company: string | null;
  source: 'apollo' | 'dropcontact' | 'both';
  apolloResult: ApolloEnrichResult | null;
  dropcontactResult: DropcontactEnrichResult | null;
  emailVerified: boolean;
}

export async function waterfallEnrich(contact: {
  linkedinUrl: string;
  firstName: string;
  lastName: string;
  company?: string | null;
}): Promise<ApiResponse<WaterfallEnrichResult>> {
  const dropcontactReady = isDropcontactReady();

  // Step 1: Apollo
  const apolloResult = await enrichContact(contact);
  let email: string | null = null;
  let phone: string | null = null;
  let title: string | null = null;
  let company: string | null = null;
  let source: 'apollo' | 'dropcontact' | 'both' = 'apollo';
  let emailVerified = false;

  if (apolloResult.success && apolloResult.data) {
    const d = apolloResult.data;
    email = d.personalEmail || d.workEmail || d.email || null;
    phone = d.phone || null;
    title = d.title || null;
    company = d.company || null;
  }

  // Step 2: Dropcontact (if available)
  let dropcontactData: DropcontactEnrichResult | null = null;
  if (dropcontactReady) {
    try {
      const dcResult = await enrichViaDropcontact({
        firstName: contact.firstName,
        lastName: contact.lastName,
        company: contact.company,
        email: email,
      });

      if (dcResult.success && dcResult.data) {
        dropcontactData = dcResult.data;

        if (!email && dcResult.data.email) {
          email = dcResult.data.email;
          source = 'dropcontact';
        } else if (email && dcResult.data.email) {
          source = 'both';
          emailVerified = dcResult.data.isVerified ?? true;
        } else if (email) {
          source = 'apollo';
        }

        if (!title && dcResult.data.jobTitle) title = dcResult.data.jobTitle;
        if (!company && dcResult.data.company) company = dcResult.data.company;
      }
    } catch {
      // Graceful degradation: Dropcontact failed, use Apollo result
    }
  }

  return {
    success: true,
    data: {
      email,
      phone,
      title,
      company,
      source,
      apolloResult: apolloResult.data ?? null,
      dropcontactResult: dropcontactData,
      emailVerified,
    },
  };
}

export async function enrichBatch(contacts: Array<{ id: string; linkedinUrl: string; firstName: string; lastName: string; company?: string | null }>): Promise<ApiResponse<Record<string, ApolloEnrichResult>>> {
  return callWebhook<Record<string, ApolloEnrichResult>>('apollo', 'apollo-enrich-batch', {
    contacts: contacts.map(c => ({
      id: c.id, linkedinUrl: c.linkedinUrl, firstName: c.firstName, lastName: c.lastName, company: c.company || undefined,
    })),
  });
}

// ── HUBSPOT ──
export interface HubSpotSyncResult {
  created: number;
  updated: number;
  errors: number;
  details?: Array<{ contactId: string; hubspotId: string; status: 'created' | 'updated' | 'error'; error?: string }>;
}

export async function syncToHubSpot(contacts: Array<Record<string, unknown>>, mappings: Array<{ lc: string; hs: string }>): Promise<ApiResponse<HubSpotSyncResult>> {
  return callWebhook<HubSpotSyncResult>('hubspot', 'hubspot-push', { contacts, mappings });
}

export async function pullFromHubSpot(filters?: { lifecycleStage?: string }): Promise<ApiResponse<Array<Record<string, unknown>>>> {
  return callWebhook<Array<Record<string, unknown>>>('hubspot', 'hubspot-pull', { filters: filters || {} });
}

// ── LEMLIST ──
export interface LemlistPushResult {
  added: number;
  duplicates: number;
  errors: number;
  campaignId: string;
}

export async function pushToLemlist(contacts: Array<{ email: string; firstName: string; lastName: string; company?: string; linkedinUrl?: string }>, campaignId: string): Promise<ApiResponse<LemlistPushResult>> {
  return callWebhook<LemlistPushResult>('lemlist', 'lemlist-push', { contacts, campaignId });
}

export async function fetchLemlistCampaigns(): Promise<ApiResponse<Array<{ id: string; name: string; status: string; stats: { sent: number; opened: number; replied: number } }>>> {
  return callWebhook('lemlist', 'lemlist-campaigns', {});
}

// ── CONNECTION TEST ──
export async function testWebhookConnection(webhookUrl: string): Promise<ApiResponse<{ status: string }>> {
  if (!navigator.onLine) return { success: false, error: 'Geen internetverbinding' };
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(webhookUrl.replace(/\/$/, '') + '/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ping', timestamp: new Date().toISOString() }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    addApiLog({ timestamp: new Date().toISOString(), service: 'n8n', action: 'health', status: res.ok ? 'success' : 'error', durationMs: Date.now() - start });
    if (res.ok) return { success: true, data: { status: 'ok' } };
    return { success: false, error: `HTTP ${res.status}` };
  } catch (err) {
    clearTimeout(timeout);
    addApiLog({ timestamp: new Date().toISOString(), service: 'n8n', action: 'health', status: 'error', durationMs: Date.now() - start, error: String(err) });
    return { success: false, error: err instanceof Error ? err.message : 'Verbinding mislukt' };
  }
}

export async function testServiceViaWebhook(service: string): Promise<ApiResponse<{ valid: boolean }>> {
  return callWebhook<{ valid: boolean }>(service, `${service}-test`, {});
}

// ── HELPERS ──
export function isConnectionReady(connectionId: string): boolean {
  const connections = useConnectionStore.getState().connections;
  const conn = connections.find(c => c.id === connectionId);
  const n8n = connections.find(c => c.id === 'n8n');
  return !!(conn && conn.status === 'connected' && n8n && n8n.status === 'connected' && n8n.config.webhookUrl);
}
