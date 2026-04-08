import type { Contact, Signal, WatchlistOrg, AppSettings, CalibrationSuggestion } from '@/types';
import { getDomainName } from '@/types';

export function runCalibration(
  customers: Contact[],
  signals: Signal[],
  watchlistOrgs: WatchlistOrg[],
  settings: AppSettings,
  existingSuggestions: CalibrationSuggestion[]
): CalibrationSuggestion[] {
  const results: CalibrationSuggestion[] = [];
  const totalCustomers = customers.length;
  const now = new Date().toISOString();
  const allDomainIds = settings.domains.map(d => d.id);

  const hasPending = (type: string, orgId?: string, domain?: string) =>
    existingSuggestions.some(s => s.status === 'pending' && s.type === type && s.orgId === orgId && s.domain === domain);

  const customerUrls = new Set(customers.map(c => c.linkedinUrl));
  const customerSignals = signals.filter(s => customerUrls.has(s.contactLinkedinUrl));

  // ── NIVEAU 1: RANGORDE SUGGESTIES (min 5 klanten) ──
  if (totalCustomers >= 5) {
    for (const domain of allDomainIds) {
      const domainOrgs = watchlistOrgs.filter(o => o.domain === domain);
      
      const orgCustomerEngagement: Array<{ org: WatchlistOrg; customerCount: number; percentage: number }> = [];
      
      for (const org of domainOrgs) {
        const orgSignals = customerSignals.filter(s => s.orgId === org.id);
        const uniqueCustomers = new Set(orgSignals.map(s => s.contactLinkedinUrl));
        const count = uniqueCustomers.size;
        if (count > 0) {
          orgCustomerEngagement.push({ org, customerCount: count, percentage: Math.round((count / totalCustomers) * 100) });
        }
      }

      orgCustomerEngagement.sort((a, b) => b.customerCount - a.customerCount);

      for (let i = 0; i < orgCustomerEngagement.length; i++) {
        const { org, customerCount, percentage } = orgCustomerEngagement[i];
        const suggestedRank = i + 1;
        
        if (org.rank > 2 && percentage > 40 && suggestedRank < org.rank) {
          if (hasPending('rank_change', org.id, domain)) continue;
          
          const domainName = getDomainName(settings.domains, domain);
          results.push({
            id: `cal-${Date.now()}-${results.length}`,
            level: 1,
            type: 'rank_change',
            title: `Verschuif ${org.name} naar positie ${suggestedRank} in ${domainName}`,
            explanation: `${org.name} heeft engagement van ${customerCount} van je ${totalCustomers} klanten (${percentage}%), maar staat op positie ${org.rank}. Op basis van klant-engagement zou positie ${suggestedRank} passender zijn.`,
            evidence: { customerCount, totalCustomers, percentage },
            domain,
            orgId: org.id,
            orgName: org.name,
            suggestedRank,
            status: 'pending',
            createdAt: now,
            decidedAt: null,
          });
        }
      }
    }
  }

  // ── NIVEAU 2: NIEUWE ORGANISATIE SUGGESTIES (min 5 klanten) ──
  if (totalCustomers >= 5) {
    const watchlistNames = new Set(watchlistOrgs.map(o => o.name.toLowerCase()));
    const companyCount: Record<string, { count: number; company: string }> = {};
    
    for (const c of customers) {
      if (c.company) {
        const key = c.company.toLowerCase();
        if (!watchlistNames.has(key)) {
          if (!companyCount[key]) companyCount[key] = { count: 0, company: c.company };
          companyCount[key].count++;
        }
      }
    }

    const watchlistIds = new Set(watchlistOrgs.map(o => o.id));
    const nonWatchlistSignals: Record<string, { orgName: string; count: number; domain: string }> = {};
    for (const s of customerSignals) {
      if (!watchlistIds.has(s.orgId)) {
        const key = s.orgName.toLowerCase();
        if (!nonWatchlistSignals[key]) {
          nonWatchlistSignals[key] = { orgName: s.orgName, count: 0, domain: s.domain };
        }
        const uniqueCustomerForOrg = new Set(
          customerSignals.filter(cs => cs.orgId === s.orgId).map(cs => cs.contactLinkedinUrl)
        );
        nonWatchlistSignals[key].count = uniqueCustomerForOrg.size;
      }
    }

    const threshold = Math.max(3, Math.ceil(totalCustomers * 0.25));
    
    for (const [, data] of Object.entries(nonWatchlistSignals)) {
      if (data.count >= Math.min(threshold, 3)) {
        const percentage = Math.round((data.count / totalCustomers) * 100);
        const domainName = getDomainName(settings.domains, data.domain);
        if (hasPending('add_org', undefined, data.domain)) continue;
        
        results.push({
          id: `cal-${Date.now()}-${results.length}`,
          level: 2,
          type: 'add_org',
          title: `Voeg ${data.orgName} toe aan ${domainName}`,
          explanation: `${data.count} van je ${totalCustomers} klanten (${percentage}%) hebben engagement met ${data.orgName}, maar deze organisatie staat niet op je watchlist.`,
          evidence: { customerCount: data.count, totalCustomers, percentage },
          domain: data.domain,
          suggestedOrgName: data.orgName,
          suggestedOrgUrl: `https://linkedin.com/company/${data.orgName.toLowerCase().replace(/\s+/g, '-')}`,
          suggestedTier: 'extended',
          status: 'pending',
          createdAt: now,
          decidedAt: null,
        });
      }
    }

    for (const [, data] of Object.entries(companyCount)) {
      if (data.count >= Math.min(threshold, 3)) {
        const percentage = Math.round((data.count / totalCustomers) * 100);
        if (hasPending('add_org', undefined, undefined)) continue;
        
        results.push({
          id: `cal-${Date.now()}-${results.length}`,
          level: 2,
          type: 'add_org',
          title: `Overweeg ${data.company} toe te voegen aan je watchlist`,
          explanation: `${data.count} van je ${totalCustomers} klanten (${percentage}%) werken bij ${data.company}. Deze organisatie staat niet op je watchlist.`,
          evidence: { customerCount: data.count, totalCustomers, percentage },
          suggestedOrgName: data.company,
          suggestedOrgUrl: `https://linkedin.com/company/${data.company.toLowerCase().replace(/\s+/g, '-')}`,
          suggestedTier: 'extended',
          status: 'pending',
          createdAt: now,
          decidedAt: null,
        });
      }
    }
  }

  // ── NIVEAU 3: DOMEIN HEROVERWEGINGEN (min 20 klanten) ──
  if (totalCustomers >= 20) {
    const domainEngagement: Record<string, number> = {};
    for (const d of allDomainIds) domainEngagement[d] = 0;
    for (const s of customerSignals) {
      domainEngagement[s.domain] = (domainEngagement[s.domain] ?? 0) + 1;
    }
    const totalEngagement = Object.values(domainEngagement).reduce((a, b) => a + b, 0);

    if (totalEngagement > 0) {
      for (const domain of allDomainIds) {
        const pct = Math.round(((domainEngagement[domain] ?? 0) / totalEngagement) * 100);
        if (pct < 20) {
          const titleWords: Record<string, number> = {};
          for (const c of customers) {
            const words = (c.title ?? '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
            for (const w of words) {
              titleWords[w] = (titleWords[w] || 0) + 1;
            }
          }

          const topKeywords = Object.entries(titleWords)
            .filter(([, count]) => count >= Math.ceil(totalCustomers * 0.2))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

          if (topKeywords.length > 0 && !hasPending('domain_rename', undefined, domain)) {
            const kwString = topKeywords.map(([k]) => `"${k}"`).join(', ');
            const domainName = getDomainName(settings.domains, domain);
            results.push({
              id: `cal-${Date.now()}-${results.length}`,
              level: 3,
              type: 'domain_rename',
              title: `Overweeg ${domainName} te herpositioneren`,
              explanation: `Slechts ${pct}% van je klant-engagement komt uit ${domainName}. Veelvoorkomende termen in klantprofielen (${kwString}) suggereren een andere focus.`,
              evidence: { customerCount: topKeywords[0][1], totalCustomers, percentage: pct },
              domain,
              suggestedDomainName: domainName,
              status: 'pending',
              createdAt: now,
              decidedAt: null,
            });
          }
        }
      }
    }
  }

  results.sort((a, b) => a.level - b.level);
  return results;
}
