import { useState } from 'react';
import { Search, Plus, ThumbsUp, MessageSquare } from 'lucide-react';
import { MOCK_DOMAINS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import type { OrgSignal } from '@/types';

const DOMAIN_COLORS: Record<string, string> = {};
const DOMAIN_LABELS: Record<string, string> = {};
MOCK_DOMAINS.forEach(d => { DOMAIN_COLORS[d.id] = d.color; DOMAIN_LABELS[d.id] = d.name; });

type FilterDomain = 'all' | string;

export default function OrganizationsPage() {
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<FilterDomain>('all');
  const [orgs, setOrgs] = useState<OrgSignal[]>(MOCK_DOMAINS.flatMap(d => d.items));

  const filtered = orgs.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.name.toLowerCase().includes(q) || o.city.toLowerCase().includes(q);
    const matchDomain = domainFilter === 'all' || o.domainId === domainFilter;
    return matchSearch && matchDomain;
  });

  const toggleActive = (id: string) => {
    setOrgs(prev => prev.map(o => o.id === id ? { ...o, active: !o.active } : o));
  };

  const totalActive = orgs.filter(o => o.active).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Organisaties</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{orgs.length} organisaties · {totalActive} actief</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.href = '/signals'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          >
            Signaal architectuur
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-lg transition-colors">
            <Plus className="h-3.5 w-3.5" /> Toevoegen
          </button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoeken..."
            className="pl-9 pr-3 py-2 text-xs bg-secondary/40 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-52"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setDomainFilter('all')}
            className={cn('px-2.5 py-1.5 text-[10px] border rounded-lg transition-colors',
              domainFilter === 'all' ? 'bg-primary/10 text-primary border-primary/20' : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            Alle
          </button>
          {MOCK_DOMAINS.map(d => (
            <button
              key={d.id}
              onClick={() => setDomainFilter(d.id)}
              className={cn('px-2.5 py-1.5 text-[10px] border rounded-lg transition-colors flex items-center gap-1.5',
                domainFilter === d.id ? 'bg-primary/10 text-primary border-primary/20' : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3">
        {filtered.map(org => {
          const domainColor = DOMAIN_COLORS[org.domainId] ?? '#888';
          const domainLabel = DOMAIN_LABELS[org.domainId] ?? org.domainId;
          return (
            <div
              key={org.id}
              className={cn('bg-card border rounded-xl p-4 transition-all', org.active ? 'border-border' : 'border-border/30 opacity-50')}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{org.name}</p>
                  <p className="text-xs text-muted-foreground">{org.city}, {org.country}</p>
                </div>
                {/* Toggle */}
                <button
                  onClick={() => toggleActive(org.id)}
                  className={cn('w-9 h-5 rounded-full transition-all shrink-0 relative', org.active ? 'bg-primary' : 'bg-secondary border border-border')}
                >
                  <div className={cn('w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all', org.active ? 'left-[18px]' : 'left-0.5')} />
                </button>
              </div>

              {/* Badges */}
              <div className="flex gap-1.5 flex-wrap mb-3">
                <span className="text-[10px] px-1.5 py-0.5 rounded border" style={{ background: `${domainColor}15`, color: domainColor, borderColor: `${domainColor}30` }}>
                  {domainLabel}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                  Rang {org.rank}
                </span>
              </div>

              {/* Stats */}
              <div className="flex gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-[#534AB7]/10 flex items-center justify-center">
                    <ThumbsUp className="h-2.5 w-2.5 text-[#534AB7]" />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{org.likes}</span>
                  <span className="text-[10px] text-muted-foreground/60">likes</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-[#0fb57a]/10 flex items-center justify-center">
                    <MessageSquare className="h-2.5 w-2.5 text-[#0fb57a]" />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{org.comments}</span>
                  <span className="text-[10px] text-muted-foreground/60">reacties</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
