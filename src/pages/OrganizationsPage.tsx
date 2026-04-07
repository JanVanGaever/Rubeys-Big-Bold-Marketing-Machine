import { useState } from 'react';
import { Search, Plus, ThumbsUp, MessageSquare } from 'lucide-react';
import { MOCK_DOMAINS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import type { OrgSignal } from '@/types';

type FilterType = 'all' | 'museum' | 'bank' | 'family_office' | 'luxury_brand' | 'kunstbeurs' | 'galerij' | 'overig';

const TYPE_LABELS: Record<string, string> = { museum: 'Museum', bank: 'Bank', family_office: 'Family Office', luxury_brand: 'Luxury Brand', kunstbeurs: 'Kunstbeurs', galerij: 'Galerij', overig: 'Overig' };
const TYPE_COLORS: Record<string, string> = { museum: 'bg-blue-500/10 text-blue-400 border-blue-500/20', bank: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', family_office: 'bg-violet-500/10 text-violet-400 border-violet-500/20', luxury_brand: 'bg-amber-500/10 text-amber-400 border-amber-500/20', kunstbeurs: 'bg-rose-500/10 text-rose-400 border-rose-500/20', galerij: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', overig: 'bg-secondary text-muted-foreground border-border' };
const DOMAIN_COLORS = { kunst: '#534AB7', vermogen: '#0fb57a', luxe: '#f4a261' };
const DOMAIN_LABELS = { kunst: 'Kunst & Cultuur', vermogen: 'Vermogen & Banking', luxe: 'Luxe & Kapitaal' };

export default function OrganizationsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [orgs, setOrgs] = useState<OrgSignal[]>(MOCK_DOMAINS.flatMap(d => d.items));

  const filtered = orgs.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.name.toLowerCase().includes(q) || o.city.toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || o.type === typeFilter;
    return matchSearch && matchType;
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
          {(['all', 'museum', 'bank', 'family_office', 'luxury_brand', 'kunstbeurs', 'galerij'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={cn('px-2.5 py-1.5 text-[10px] border rounded-lg transition-colors',
                typeFilter === f ? 'bg-primary/10 text-primary border-primary/20' : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {f === 'all' ? 'Alle' : TYPE_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3">
        {filtered.map(org => (
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
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', TYPE_COLORS[org.type])}>
                {TYPE_LABELS[org.type]}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded border" style={{ background: `${DOMAIN_COLORS[org.domain]}15`, color: DOMAIN_COLORS[org.domain], borderColor: `${DOMAIN_COLORS[org.domain]}30` }}>
                {DOMAIN_LABELS[org.domain]}
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
        ))}
      </div>
    </div>
  );
}
