import type { ApolloEnrichResult, HubSpotSyncResult, LemlistPushResult, DropcontactEnrichResult } from './api-service';

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

export function isDropcontactEnrichResult(data: unknown): data is DropcontactEnrichResult {
  if (!isObject(data)) return false;
  return typeof data.email === 'string' || typeof data.jobTitle === 'string' || typeof data.company === 'string';
}

const VALIDATORS: Record<string, (data: unknown) => boolean> = {
  'apollo-enrich': isApolloEnrichResult,
  'apollo-enrich-batch': isObject,
  'hubspot-push': isHubSpotSyncResult,
  'hubspot-pull': (d) => Array.isArray(d),
  'lemlist-push': isLemlistPushResult,
  'lemlist-campaigns': (d) => Array.isArray(d),
  'dropcontact-enrich': isDropcontactEnrichResult,
  'dropcontact-enrich-batch': isObject,
};

export function validateResponseSchema(action: string, data: unknown): boolean {
  const validator = VALIDATORS[action];
  if (!validator) return true;
  return validator(data);
}
