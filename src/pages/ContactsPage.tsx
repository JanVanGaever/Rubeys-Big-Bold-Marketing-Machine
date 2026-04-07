import { useState, useMemo } from 'react';
import { Search, Filter, ChevronRight, ThumbsUp, MessageSquare, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOCK_CONTACTS, getScoreBadge, getOutreachLabel } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import type { LeadStatus } from '@/types';

type SortKey = 'score' | 'name' | 'date';

const SOURCE_LABEL: Record<string, string> = {
  chrome_extension: 'Chrome',
  apollo: 'Apollo',
  phantombuster: 'Phantombuster',
  manual: 'Manueel',
  import: 'Import',
};

export default function ContactsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('score');

  const contacts = useMemo(() => {
    let list = MOCK_CONTACTS.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q || `${c.firstName} ${c.lastName} ${c.company} ${c.title}`.toLowerCase().includes(q);
      const matchFilter = filter === 'all' || c.status === filter;
      return matchSearch && matchFilter;
    });
    list.sort((a, b) => {
      if (sort === 'score') return b.score - a.score;
      if (sort === 'name') return `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`);
      return b.createdAt.localeCompare(a.createdAt);
    });
    return list;
  }, [search, filter, sort]);

  const counts = {
    all: MOCK_CONTACTS.length,
    hot: MOCK_CONTACTS.filter(c => c.status === 'hot').length,
    warm: MOCK_CONTACTS.filter(c => c.status === 'warm').length,
    cold: MOCK_CONTACTS.filter(c => c.status === 'cold').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Contacten</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{MOCK_CONTACTS.length} contacten in de database</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-lg transition-colors">
          + Toevoegen
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoeken op naam, bedrijf..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-secondary/40 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'hot', 'warm', 'cold'] as const).map(f => {
            const colors = { all: '', hot: 'data-[active]:text-red-400 data-[active]:border-red-500/30 data-[active]:bg-red-500/10', warm: 'data-[active]:text-orange-400 data-[active]:border-orange-500/30 data-[active]:bg-orange-500/10', cold: 'data-[active]:text-slate-400 data-[active]:border-slate-500/30 data-[active]:bg-slate-500/10' };
            return (
              <button
                key={f}
                data-active={filter === f ? '' : undefined}
                onClick={() => setFilter(f)}
                className={cn('px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-all', filter === f && 'text-foreground bg-secondary', colors[f])}
              >
                {f === 'all' ? 'Alle' : f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
              </button>
            );
          })}
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="ml-auto text-xs bg-secondary/40 border border-border rounded-lg px-3 py-2 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="score">Sorteren: Score</option>
          <option value="name">Sorteren: Naam</option>
          <option value="date">Sorteren: Datum</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] text-[10px] text-muted-foreground px-4 py-2 border-b border-border gap-4">
          <span>Contact</span>
          <span>Score</span>
          <span>Signalen</span>
          <span>Status</span>
          <span>Actie</span>
        </div>
        <div className="divide-y divide-border">
          {contacts.map(contact => {
            const badge = getScoreBadge(contact.score);
            return (
              <div
                key={contact.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center px-4 py-3 hover:bg-secondary/20 transition-colors gap-4 cursor-pointer"
                onClick={() => navigate(`/contacts/${contact.id}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-medium text-primary">
                      {contact.firstName[0]}{contact.lastName[0]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{contact.firstName} {contact.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate">{contact.title} · {contact.company}</p>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">
                    {SOURCE_LABEL[contact.sourceType]}
                  </span>
                </div>

                <div className="text-center shrink-0">
                  <p className="text-base font-semibold text-foreground">{contact.score}</p>
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded', badge.className)}>{badge.label}</span>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  {(['kunst', 'vermogen', 'luxe'] as const).map(type => {
                    const count = contact.signals.filter(s => s.type === type).length;
                    const colors = { kunst: '#534AB7', vermogen: '#0fb57a', luxe: '#f4a261' };
                    return (
                      <div
                        key={type}
                        className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-medium"
                        style={{ background: `${colors[type]}20`, color: colors[type], opacity: count > 0 ? 1 : 0.3 }}
                      >
                        {count}
                      </div>
                    );
                  })}
                </div>

                <div className="shrink-0">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full border',
                    contact.outreachStatus === 'replied' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    contact.outreachStatus === 'in_sequence' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    contact.outreachStatus === 'meeting_booked' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                    'bg-secondary text-muted-foreground border-border'
                  )}>
                    {getOutreachLabel(contact.outreachStatus)}
                  </span>
                </div>

                <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                  <button className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    <Send className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                    className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
