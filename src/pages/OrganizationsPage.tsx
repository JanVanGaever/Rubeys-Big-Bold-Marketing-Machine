import { useState, useRef, useCallback } from 'react';
import { Search, Plus, ThumbsUp, MessageSquare, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

type ViewMode = 'all' | string;

export default function OrganizationsPage() {
  const { domains, setDomains } = useApp();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const dragItem = useRef<{ domainId: string; itemId: string } | null>(null);
  const dragOver = useRef<{ domainId: string; itemId: string } | null>(null);

  const activeDomains = domains.filter(d => d.isActive);
  const totalOrgs = domains.reduce((s, d) => s + d.items.length, 0);
  const q = search.toLowerCase();

  const filteredDomains = (viewMode === 'all' ? activeDomains : activeDomains.filter(d => d.id === viewMode))
    .map(d => ({
      ...d,
      items: d.items
        .filter(o => !q || o.name.toLowerCase().includes(q) || o.city.toLowerCase().includes(q))
        .sort((a, b) => a.rank - b.rank),
    }));

  const toggleActive = useCallback((domainId: string, itemId: string) => {
    setDomains(prev => prev.map(d =>
      d.id === domainId ? { ...d, items: d.items.map(o => o.id === itemId ? { ...o, active: !o.active } : o) } : d
    ));
  }, [setDomains]);

  const moveItem = useCallback((domainId: string, itemId: string, direction: 'up' | 'down') => {
    setDomains(prev => prev.map(d => {
      if (d.id !== domainId) return d;
      const items = [...d.items].sort((a, b) => a.rank - b.rank);
      const idx = items.findIndex(i => i.id === itemId);
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= items.length) return d;
      [items[idx], items[targetIdx]] = [items[targetIdx], items[idx]];
      return { ...d, items: items.map((item, i) => ({ ...item, rank: i + 1 })) };
    }));
  }, [setDomains]);

  const handleDragStart = useCallback((domainId: string, itemId: string) => { dragItem.current = { domainId, itemId }; }, []);
  const handleDragOver = useCallback((e: React.DragEvent, domainId: string, itemId: string) => { e.preventDefault(); dragOver.current = { domainId, itemId }; }, []);
  const handleDrop = useCallback((e: React.DragEvent, targetDomainId: string, targetItemId: string) => {
    e.preventDefault();
    if (!dragItem.current) return;
    const { domainId: srcDomain, itemId: srcItem } = dragItem.current;
    if (srcDomain !== targetDomainId || srcItem === targetItemId) { dragItem.current = null; dragOver.current = null; return; }
    setDomains(prev => prev.map(d => {
      if (d.id !== srcDomain) return d;
      const items = [...d.items].sort((a, b) => a.rank - b.rank);
      const fi = items.findIndex(i => i.id === srcItem);
      const ti = items.findIndex(i => i.id === targetItemId);
      if (fi === -1 || ti === -1) return d;
      const [moved] = items.splice(fi, 1);
      items.splice(ti, 0, moved);
      return { ...d, items: items.map((item, i) => ({ ...item, rank: i + 1 })) };
    }));
    dragItem.current = null; dragOver.current = null;
  }, [setDomains]);
  const handleDragEnd = useCallback(() => { dragItem.current = null; dragOver.current = null; }, []);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Organisaties</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{totalOrgs} organisaties in {activeDomains.length} domeinen</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek organisatie of locatie..."
            className="pl-9 pr-3 py-2 text-xs bg-secondary/40 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-56" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setViewMode('all')}
            className={cn('px-2.5 py-1.5 text-[10px] border rounded-lg transition-colors',
              viewMode === 'all' ? 'bg-primary/10 text-primary border-primary/20 font-medium' : 'border-border text-muted-foreground hover:text-foreground')}>
            Alle domeinen
          </button>
          {activeDomains.map(d => (
            <button key={d.id} onClick={() => setViewMode(viewMode === d.id ? 'all' : d.id)}
              className={cn('px-2.5 py-1.5 text-[10px] border rounded-lg transition-colors flex items-center gap-1.5',
                viewMode === d.id ? 'bg-primary/10 text-primary border-primary/20 font-medium' : 'border-border text-muted-foreground hover:text-foreground')}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: d.color }} />
              {d.name}
              <span className="text-muted-foreground/50">{d.items.length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={cn('flex-1 min-h-0 grid gap-3',
        filteredDomains.length === 1 ? 'grid-cols-1 max-w-lg' : filteredDomains.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        filteredDomains.length > 3 && 'xl:grid-cols-4')}>
        {filteredDomains.map(domain => (
          <div key={domain.id} className="flex flex-col bg-card border border-border rounded-xl min-h-0">
            <div className="px-3 pt-3 pb-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: domain.color }} />
                <span className="text-xs font-medium text-foreground flex-1">{domain.name}</span>
                <span className="text-[10px] text-muted-foreground">{domain.items.length} org.</span>
              </div>
              {domain.description && <p className="text-[9px] text-muted-foreground/50 mt-0.5 pl-4">{domain.description}</p>}
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0 space-y-1">
              {domain.items.map((org, idx) => (
                <div key={org.id} draggable
                  onDragStart={() => handleDragStart(domain.id, org.id)}
                  onDragOver={e => handleDragOver(e, domain.id, org.id)}
                  onDrop={e => handleDrop(e, domain.id, org.id)}
                  onDragEnd={handleDragEnd}
                  className={cn('flex items-center gap-1.5 bg-secondary/40 rounded-md cursor-grab active:cursor-grabbing select-none transition-all border',
                    org.active ? 'border-border/60' : 'border-border/20 opacity-40',
                    dragItem.current?.itemId === org.id && 'opacity-30',
                    dragOver.current?.itemId === org.id && dragOver.current?.domainId === domain.id && 'border-primary border-dashed')}>
                  <div className="w-5 flex items-center justify-center py-2 shrink-0 text-muted-foreground/20"><GripVertical className="h-3 w-3" /></div>
                  <span className="text-[10px] font-mono text-muted-foreground/40 w-3 shrink-0">{org.rank}</span>
                  <div className="flex-1 py-1.5 pr-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground leading-tight truncate">{org.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-muted-foreground/50 truncate">{org.city}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5"><ThumbsUp className="h-2 w-2 text-muted-foreground/30" /><span className="text-[9px] font-mono text-muted-foreground/50">{org.likes}</span></div>
                        <div className="flex items-center gap-0.5"><MessageSquare className="h-2 w-2 text-muted-foreground/30" /><span className="text-[9px] font-mono text-muted-foreground/50">{org.comments}</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col shrink-0">
                    <button onClick={() => moveItem(domain.id, org.id, 'up')} disabled={idx === 0}
                      className={cn('p-0.5', idx === 0 ? 'text-muted-foreground/10' : 'text-muted-foreground/30 hover:text-foreground')}><ChevronUp className="h-2.5 w-2.5" /></button>
                    <button onClick={() => moveItem(domain.id, org.id, 'down')} disabled={idx === domain.items.length - 1}
                      className={cn('p-0.5', idx === domain.items.length - 1 ? 'text-muted-foreground/10' : 'text-muted-foreground/30 hover:text-foreground')}><ChevronDown className="h-2.5 w-2.5" /></button>
                  </div>
                  <button onClick={() => toggleActive(domain.id, org.id)}
                    className={cn('w-7 h-4 rounded-full transition-all shrink-0 relative mr-1.5', org.active ? 'bg-primary' : 'bg-secondary border border-border')}>
                    <div className={cn('w-2.5 h-2.5 rounded-full bg-white absolute top-[3px] transition-all', org.active ? 'left-[14px]' : 'left-[3px]')} />
                  </button>
                </div>
              ))}
              {domain.items.length === 0 && <p className="text-[10px] text-muted-foreground/30 text-center py-4">Geen resultaten</p>}
            </div>
            <div className="px-2 pb-2 shrink-0">
              <button className="w-full text-[10px] text-muted-foreground/40 border border-dashed border-border/30 rounded-md py-1.5 hover:border-border hover:text-muted-foreground transition-colors flex items-center justify-center gap-1">
                <Plus className="h-3 w-3" /> Toevoegen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
