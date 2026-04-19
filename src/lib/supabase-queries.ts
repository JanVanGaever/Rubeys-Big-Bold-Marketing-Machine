import { supabase } from '@/integrations/supabase/client';
import { normalizeLinkedInUrl } from '@/lib/normalize';
import type {
  WatchlistOrg, Signal, Contact, AppSettings,
  ImportRecord, EnrichmentRecord, SyncRecord, LemlistCampaign,
  CalibrationSuggestion, DomainDefinition, DomainPresence,
} from '@/types';

// ── Helpers: snake_case <-> camelCase mapping ──

function toSnake(str: string): string {
  return str.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);
}

function normalizeOptionalLinkedInUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const normalized = normalizeLinkedInUrl(url);
  return normalized || null;
}

// ── DOMAINS ──

function domainFromRow(r: any): DomainDefinition {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    color: r.color ?? '#666',
    weight: r.weight ?? 33,
    sortOrder: r.sort_order ?? 0,
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

function domainToRow(d: DomainDefinition) {
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    color: d.color,
    weight: d.weight,
    sort_order: d.sortOrder,
    created_at: d.createdAt,
  };
}

export async function fetchDomains(): Promise<DomainDefinition[]> {
  const { data, error } = await supabase.from('domains').select('*').order('sort_order');
  if (error) throw error;
  return (data ?? []).map(domainFromRow);
}

export async function upsertDomain(d: DomainDefinition) {
  const { error } = await supabase.from('domains').upsert(domainToRow(d));
  if (error) throw error;
}

export async function deleteDomain(id: string) {
  const { error } = await supabase.from('domains').delete().eq('id', id);
  if (error) throw error;
}

// ── WATCHLIST ORGS ──

function orgFromRow(r: any): WatchlistOrg {
  return {
    id: r.id,
    name: r.name,
    linkedinUrl: r.linkedin_url,
    domain: r.domain,
    tier: r.tier,
    isActive: r.is_active ?? true,
    postsScrapedCount: r.posts_scraped_count ?? 0,
    lastScrapedAt: r.last_scraped_at,
    rank: r.rank ?? 1,
  };
}

function orgToRow(o: WatchlistOrg) {
  return {
    id: o.id,
    name: o.name,
    linkedin_url: o.linkedinUrl,
    domain: o.domain,
    tier: o.tier,
    is_active: o.isActive,
    posts_scraped_count: o.postsScrapedCount,
    last_scraped_at: o.lastScrapedAt,
    rank: o.rank,
  };
}

export async function fetchWatchlistOrgs(): Promise<WatchlistOrg[]> {
  const { data, error } = await supabase.from('watchlist_orgs').select('*').order('domain').order('tier').order('rank');
  if (error) throw error;
  return (data ?? []).map(orgFromRow);
}

export async function upsertOrg(o: WatchlistOrg) {
  const { error } = await supabase.from('watchlist_orgs').upsert(orgToRow(o));
  if (error) throw error;
}

export async function upsertOrgs(orgs: WatchlistOrg[]) {
  const { error } = await supabase.from('watchlist_orgs').upsert(orgs.map(orgToRow));
  if (error) throw error;
}

export async function deleteOrg(id: string) {
  const { error } = await supabase.from('watchlist_orgs').delete().eq('id', id);
  if (error) throw error;
}

// ── CONTACTS ──

function contactFromRow(r: any): Contact {
  return {
    id: r.id,
    linkedinUrl: normalizeLinkedInUrl(r.linkedin_url ?? ''),
    firstName: r.first_name,
    lastName: r.last_name,
    title: r.title,
    company: r.company,
    email: r.email,
    phone: r.phone,
    location: r.location,
    source: r.source ?? 'auto',
    addedAt: r.added_at ?? new Date().toISOString(),
    domains: r.domains ?? {},
    activeDomainCount: r.active_domain_count ?? 0,
    totalScore: r.total_score ?? 0,
    status: r.status ?? 'cold',
    isEnriched: r.is_enriched ?? false,
    enrichedAt: r.enriched_at,
    lemlistCampaignId: r.lemlist_campaign_id,
    lemlistPushedAt: r.lemlist_pushed_at,
    lastContactedAt: r.last_contacted_at,
    notes: r.notes ?? '',
    engagementScore: r.engagement_score ?? 0,
    keywordScore: r.keyword_score ?? 0,
    crossSignalScore: r.cross_signal_score ?? 0,
    enrichmentScore: r.enrichment_score ?? 0,
    diversityScore: r.diversity_score ?? 0,
    previousScore: r.previous_score,
    scoreChangedAt: r.score_changed_at,
    isCustomer: r.is_customer ?? false,
    customerSince: r.customer_since,
    enrichmentSource: r.enrichment_source ?? 'none',
    emailVerifiedByDropcontact: r.email_verified_by_dropcontact ?? false,
    dropcontactEnrichedAt: r.dropcontact_enriched_at,
    companyLinkedinUrl: normalizeOptionalLinkedInUrl(r.company_linkedin_url),
  };
}

function contactToRow(c: Contact) {
  return {
    id: c.id,
    linkedin_url: normalizeLinkedInUrl(c.linkedinUrl),
    first_name: c.firstName,
    last_name: c.lastName,
    title: c.title,
    company: c.company,
    email: c.email,
    phone: c.phone,
    location: c.location,
    source: c.source,
    added_at: c.addedAt,
    domains: c.domains,
    active_domain_count: c.activeDomainCount,
    total_score: c.totalScore,
    status: c.status,
    is_enriched: c.isEnriched,
    enriched_at: c.enrichedAt,
    lemlist_campaign_id: c.lemlistCampaignId,
    lemlist_pushed_at: c.lemlistPushedAt,
    last_contacted_at: c.lastContactedAt,
    notes: c.notes,
    engagement_score: c.engagementScore,
    keyword_score: c.keywordScore,
    cross_signal_score: c.crossSignalScore,
    enrichment_score: c.enrichmentScore,
    diversity_score: c.diversityScore,
    previous_score: c.previousScore,
    score_changed_at: c.scoreChangedAt,
    is_customer: c.isCustomer,
    customer_since: c.customerSince,
    enrichment_source: c.enrichmentSource,
    email_verified_by_dropcontact: c.emailVerifiedByDropcontact,
    dropcontact_enriched_at: c.dropcontactEnrichedAt,
    company_linkedin_url: normalizeOptionalLinkedInUrl(c.companyLinkedinUrl),
  };
}

export async function fetchContacts(): Promise<Contact[]> {
  const allRows: any[] = [];
  const PAGE_SIZE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('total_score', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return allRows.map(contactFromRow);
}

export async function upsertContact(c: Contact) {
  const { error } = await supabase.from('contacts').upsert(contactToRow(c));
  if (error) throw error;
}

export async function upsertContacts(contacts: Contact[]) {
  if (contacts.length === 0) return;
  const { error } = await supabase.from('contacts').upsert(contacts.map(contactToRow));
  if (error) throw error;
}

export async function deleteContact(id: string) {
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  if (error) throw error;
}

// ── SIGNALS ──

function signalFromRow(r: any): Signal {
  return {
    id: r.id,
    contactLinkedinUrl: normalizeLinkedInUrl(r.contact_linkedin_url ?? ''),
    contactName: r.contact_name,
    contactTitle: r.contact_title,
    orgId: r.org_id,
    orgName: r.org_name,
    domain: r.domain,
    tier: r.tier,
    engagementType: r.engagement_type,
    commentText: r.comment_text,
    detectedAt: r.detected_at ?? new Date().toISOString(),
    postUrl: r.post_url,
  };
}

function signalToRow(s: Signal) {
  return {
    id: s.id,
    contact_linkedin_url: normalizeLinkedInUrl(s.contactLinkedinUrl),
    contact_name: s.contactName,
    contact_title: s.contactTitle,
    org_id: s.orgId,
    org_name: s.orgName,
    domain: s.domain,
    tier: s.tier,
    engagement_type: s.engagementType,
    comment_text: s.commentText,
    detected_at: s.detectedAt,
    post_url: s.postUrl,
  };
}

export async function fetchSignals(): Promise<Signal[]> {
  const allRows: any[] = [];
  const PAGE_SIZE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .order('detected_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return allRows.map(signalFromRow);
}

export async function insertSignal(s: Signal) {
  const { error } = await supabase.from('signals').insert(signalToRow(s));
  if (error) throw error;
}

export async function insertSignals(signals: Signal[]) {
  if (signals.length === 0) return;
  const { error } = await supabase.from('signals').insert(signals.map(signalToRow));
  if (error) throw error;
}

export async function deleteSignalsByDomain(domain: string) {
  const { error } = await supabase.from('signals').delete().eq('domain', domain);
  if (error) throw error;
}

export async function deleteSignalsByIds(ids: string[]) {
  if (ids.length === 0) return;
  // Chunk to stay under URL/payload limits
  const CHUNK = 200;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const slice = ids.slice(i, i + CHUNK);
    const { error } = await supabase.from('signals').delete().in('id', slice);
    if (error) throw error;
  }
}

export async function upsertSignals(signals: Signal[]) {
  if (signals.length === 0) return;
  const CHUNK = 500;
  for (let i = 0; i < signals.length; i += CHUNK) {
    const slice = signals.slice(i, i + CHUNK).map(signalToRow);
    const { error } = await supabase.from('signals').upsert(slice, { onConflict: 'id' });
    if (error) throw error;
  }
}

// ── CAMPAIGNS ──

function campaignFromRow(r: any): LemlistCampaign {
  return {
    id: r.id,
    name: r.name,
    status: r.status,
    leadsCount: r.leads_count ?? 0,
    emailsSent: r.emails_sent ?? 0,
    opens: r.opens ?? 0,
    replies: r.replies ?? 0,
  };
}

function campaignToRow(c: LemlistCampaign) {
  return {
    id: c.id,
    name: c.name,
    status: c.status,
    leads_count: c.leadsCount,
    emails_sent: c.emailsSent,
    opens: c.opens,
    replies: c.replies,
  };
}

export async function fetchCampaigns(): Promise<LemlistCampaign[]> {
  const { data, error } = await supabase.from('campaigns').select('*');
  if (error) throw error;
  return (data ?? []).map(campaignFromRow);
}

export async function upsertCampaign(c: LemlistCampaign) {
  const { error } = await supabase.from('campaigns').upsert(campaignToRow(c));
  if (error) throw error;
}

// ── HISTORY TABLES ──

function importRecordFromRow(r: any): ImportRecord {
  return { id: r.id, date: r.date, type: r.type, records: r.records, imported: r.imported, duplicates: r.duplicates, errors: r.errors, status: r.status };
}

export async function fetchImportHistory(): Promise<ImportRecord[]> {
  const { data, error } = await supabase.from('import_history').select('*').order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(importRecordFromRow);
}

export async function insertImportRecord(r: ImportRecord) {
  const { error } = await supabase.from('import_history').insert({ id: r.id, date: r.date, type: r.type, records: r.records, imported: r.imported, duplicates: r.duplicates, errors: r.errors, status: r.status });
  if (error) throw error;
}

function enrichmentRecordFromRow(r: any): EnrichmentRecord {
  return { id: r.id, contactId: r.contact_id, contactName: r.contact_name, date: r.date, status: r.status, fieldsFound: r.fields_found ?? [], fieldsMissing: r.fields_missing ?? [] };
}

export async function fetchEnrichmentHistory(): Promise<EnrichmentRecord[]> {
  const { data, error } = await supabase.from('enrichment_history').select('*').order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(enrichmentRecordFromRow);
}

export async function insertEnrichmentRecord(r: EnrichmentRecord) {
  const { error } = await supabase.from('enrichment_history').insert({ id: r.id, contact_id: r.contactId, contact_name: r.contactName, date: r.date, status: r.status, fields_found: r.fieldsFound, fields_missing: r.fieldsMissing });
  if (error) throw error;
}

function syncRecordFromRow(r: any): SyncRecord {
  return { id: r.id, date: r.date, direction: r.direction, records: r.records, created: r.created, updated: r.updated, errors: r.errors, status: r.status };
}

export async function fetchSyncHistory(): Promise<SyncRecord[]> {
  const { data, error } = await supabase.from('sync_history').select('*').order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(syncRecordFromRow);
}

export async function insertSyncRecord(r: SyncRecord) {
  const { error } = await supabase.from('sync_history').insert({ id: r.id, date: r.date, direction: r.direction, records: r.records, created: r.created, updated: r.updated, errors: r.errors, status: r.status });
  if (error) throw error;
}

// ── CALIBRATION SUGGESTIONS ──

function suggestionFromRow(r: any): CalibrationSuggestion {
  return {
    id: r.id, level: r.level, type: r.type, title: r.title, explanation: r.explanation,
    evidence: r.evidence ?? { customerCount: 0, totalCustomers: 0, percentage: 0 },
    domain: r.domain, orgId: r.org_id, orgName: r.org_name,
    suggestedRank: r.suggested_rank, suggestedOrgName: r.suggested_org_name,
    suggestedOrgUrl: r.suggested_org_url, suggestedTier: r.suggested_tier,
    suggestedDomainName: r.suggested_domain_name,
    status: r.status, createdAt: r.created_at, decidedAt: r.decided_at,
  };
}

function suggestionToRow(s: CalibrationSuggestion) {
  return {
    id: s.id, level: s.level, type: s.type, title: s.title, explanation: s.explanation,
    evidence: s.evidence, domain: s.domain, org_id: s.orgId, org_name: s.orgName,
    suggested_rank: s.suggestedRank, suggested_org_name: s.suggestedOrgName,
    suggested_org_url: s.suggestedOrgUrl, suggested_tier: s.suggestedTier,
    suggested_domain_name: s.suggestedDomainName,
    status: s.status, created_at: s.createdAt, decided_at: s.decidedAt,
  };
}

export async function fetchCalibrationSuggestions(): Promise<CalibrationSuggestion[]> {
  const { data, error } = await supabase.from('calibration_suggestions').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(suggestionFromRow);
}

export async function upsertSuggestion(s: CalibrationSuggestion) {
  const { error } = await supabase.from('calibration_suggestions').upsert(suggestionToRow(s));
  if (error) throw error;
}

// ── SETTINGS ──

export async function fetchSettings(): Promise<Partial<AppSettings> | null> {
  const { data, error } = await supabase.from('app_settings').select('settings').eq('id', 1).single();
  if (error) return null;
  return data?.settings as Partial<AppSettings> | null;
}

export async function saveSettings(settings: AppSettings) {
  const { error } = await supabase.from('app_settings').upsert({ id: 1, settings });
  if (error) throw error;
}

// ── FULL SYNC ──

export async function fetchAllData() {
  const [domains, orgs, contacts, signals, campaigns, importHistory, enrichmentHistory, syncHistory, suggestions, settings] = await Promise.all([
    fetchDomains(),
    fetchWatchlistOrgs(),
    fetchContacts(),
    fetchSignals(),
    fetchCampaigns(),
    fetchImportHistory(),
    fetchEnrichmentHistory(),
    fetchSyncHistory(),
    fetchCalibrationSuggestions(),
    fetchSettings(),
  ]);
  return { domains, orgs, contacts, signals, campaigns, importHistory, enrichmentHistory, syncHistory, suggestions, settings };
}
