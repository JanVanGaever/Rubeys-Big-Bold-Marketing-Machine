import type { ApolloEnrichResult, HubSpotSyncResult, LemlistPushResult } from './api-service';

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function isApolloEnrichResult(data: unknown): data is ApolloEnrichResult {
  if (!isObject(data)) return false;
  return typeof data.email === 'string' || typeof data.phone === 'string' || typeof data.title === 'string';
}

export function isHubSpotSyncResult(data: unknown): data is HubSpotSyncResult {
  if (!isObject(data)) return false;
  return typeof data.created === 'number' && typeof data.updated === 'number' && typeof data.errors === 'number';
}

export function isLemlistPushResult(data: unknown): data is LemlistPushResult {
  if (!isObject(data)) return false;
  return typeof data.added === 'number' && typeof data.campaignId === 'string';
}

const VALIDATORS: Record<string, (data: unknown) => boolean> = {
  'apollo-enrich': isApolloEnrichResult,
  'apollo-enrich-batch': isObject,
  'hubspot-push': isHubSpotSyncResult,
  'hubspot-pull': (d) => Array.isArray(d),
  'lemlist-push': isLemlistPushResult,
  'lemlist-campaigns': (d) => Array.isArray(d),
};

export function validateResponseSchema(action: string, data: unknown): boolean {
  const validator = VALIDATORS[action];
  if (!validator) return true; // no validator = assume valid
  return validator(data);
}
