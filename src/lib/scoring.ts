import type { Contact, Domain, AppSettings } from '@/types';
import { getPts } from '@/lib/mock-data';

export interface ScoreBreakdown {
  engagement: number;
  profileKeywords: number;
  crossSignal: number;
  enrichment: number;
  orgDiversity: number;
  total: number;
  domainScores: Record<string, number>;
  domainCount: number;
  crossMultiplier: number;
}

/**
 * Calculate the full score for a contact based on the domain model.
 *
 * Each component yields a 0–100 sub-score. The weighted sum produces the final score.
 */
export function calculateScore(
  contact: Contact,
  domains: Domain[],
  settings: AppSettings,
): ScoreBreakdown {
  const weights = settings.scoreWeights;
  const activeDomains = domains.filter(d => d.isActive);

  // ── 1. ENGAGEMENT (0-100) ──────────────────────────────────────
  // likes = 1pt, comments = 3pt.  Normalise against a reasonable cap (50).
  const engagementRaw = contact.signals.reduce((s, sig) => s + sig.weight, 0);
  const engagement = Math.min(100, (engagementRaw / 50) * 100);

  // ── 2. PROFILE KEYWORDS (0-100) ───────────────────────────────
  const titleLower = `${contact.title} ${contact.company}`.toLowerCase();
  const posHits = settings.positiveKeywords.filter(kw => titleLower.includes(kw.toLowerCase())).length;
  const negHits = settings.negativeKeywords.filter(kw => titleLower.includes(kw.toLowerCase())).length;
  const profileKeywords = Math.max(0, Math.min(100, posHits * 25 - negHits * 40));

  // ── 3. CROSS-SIGNAL (0-100) ───────────────────────────────────
  // Per domain: highest-ranked org the contact engaged with → domain pts
  const domainScores: Record<string, number> = {};
  for (const domain of activeDomains) {
    const sortedItems = [...domain.items].filter(o => o.active).sort((a, b) => a.rank - b.rank);
    let bestPts = 0;
    for (const signal of contact.signals) {
      // Match signal source to org name
      const orgIdx = sortedItems.findIndex(o =>
        o.name.toLowerCase() === signal.source.toLowerCase()
      );
      if (orgIdx !== -1) {
        const pts = getPts(orgIdx, domain.maxPoints);
        if (pts > bestPts) bestPts = pts;
      }
    }
    if (bestPts > 0) {
      domainScores[domain.id] = bestPts;
    }
  }

  const domainCount = Object.keys(domainScores).length;
  const crossMultiplier = domainCount >= 3 ? 2 : domainCount === 2 ? 1.5 : 1;

  // Max possible = sum of all domain maxPoints
  const maxPossible = activeDomains.reduce((s, d) => s + d.maxPoints, 0) || 1;
  const domainPtsSum = Object.values(domainScores).reduce((s, v) => s + v, 0);
  const avgDomainPts = domainCount > 0 ? domainPtsSum / domainCount : 0;
  const crossSignalRaw = avgDomainPts * crossMultiplier;
  const crossSignal = Math.min(100, (crossSignalRaw / maxPossible) * 100 * 2);

  // ── 4. ENRICHMENT (0-100) ─────────────────────────────────────
  let enrichmentPts = 0;
  if (contact.emailPersonal || contact.emailWork) enrichmentPts += 50;
  if (contact.phone) enrichmentPts += 30;
  if (contact.linkedinUrl) enrichmentPts += 20;
  const enrichment = enrichmentPts;

  // ── 5. ORG DIVERSITY (0-100) ──────────────────────────────────
  const uniqueOrgs = new Set(contact.signals.map(s => s.source.toLowerCase()));
  const orgDiversity = Math.min(100, uniqueOrgs.size * 20);

  // ── WEIGHTED TOTAL ────────────────────────────────────────────
  const totalWeight = weights.engagement + weights.profileKeywords + weights.crossSignal + weights.enrichment + weights.orgDiversity || 100;
  const total = Math.round(
    (engagement * weights.engagement +
      profileKeywords * weights.profileKeywords +
      crossSignal * weights.crossSignal +
      enrichment * weights.enrichment +
      orgDiversity * weights.orgDiversity) / totalWeight
  );

  return {
    engagement: Math.round(engagement),
    profileKeywords: Math.round(profileKeywords),
    crossSignal: Math.round(crossSignal),
    enrichment: Math.round(enrichment),
    orgDiversity: Math.round(orgDiversity),
    total: Math.max(0, Math.min(100, total)),
    domainScores,
    domainCount,
    crossMultiplier,
  };
}

export function getStatus(score: number, settings: AppSettings): 'hot' | 'warm' | 'cold' {
  if (score >= settings.hotThreshold) return 'hot';
  if (score >= settings.warmThreshold) return 'warm';
  return 'cold';
}

/**
 * Recalculate scores for all contacts. Returns new contact array with updated score & status.
 */
export function recalculateAll(
  contacts: Contact[],
  domains: Domain[],
  settings: AppSettings,
): Contact[] {
  return contacts.map(c => {
    const breakdown = calculateScore(c, domains, settings);
    return {
      ...c,
      score: breakdown.total,
      status: getStatus(breakdown.total, settings),
    };
  });
}
