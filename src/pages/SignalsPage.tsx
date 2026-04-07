import { useState, useRef, useCallback } from 'react';
import { GripVertical, ThumbsUp, MessageSquare, Plus, Layers, Brain, BarChart3, X, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOCK_DOMAINS } from '@/lib/mock-data';
import type { Domain, OrgSignal } from '@/types';

type SuggestionLevel = 1 | 2 | 3;
type Suggestion = { id: string; level: SuggestionLevel; orgName: string; domain: string; action: string; likes: number; comments: number; overlap?: string; reason: string; };

const SUGGESTIONS: Suggestion[] = [
  { id: 's1', level: 1, orgName: "Christie's", domain: 'Kunst & Cultuur', action: 'Positie 4 → 2', likes: 61, comments: 19, reason: "Scoort hoger dan Bozar bij jouw klanten (61 likes vs 47) maar staat lager op de ladder." },
  { id: 's2', level: 2, orgName: 'Tefaf Maastricht', domain: 'Kunst & Cultuur', action: 'Toevoegen op positie 3', likes: 52, comments: 16, reason: '9 van 12 klanten hadden Tefaf-engagement. Staat niet in jouw lijst maar correleert sterk.' },
  { id: 's3', level: 3, orgName: 'Impact & Filantropie', domain: 'Overweeg als 4e pijler', action: 'Nieuw domein', likes: 0, comments: 0, overlap: '8/12', reason: '8 van 12 klanten volgden King Baudouin Foundation of Ashoka — patroon buiten huidige 3 domeinen.' },
];

const LEVEL_STYLES: Record<SuggestionLevel, { tag: string; badge: string }> = {
  1: { tag: 'Niveau 1 — Rangorde',     badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  2: { tag: 'Niveau 2 — Nieuw lid',    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  3: { tag: 'Niveau 3 — Nieuw domein', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

function getPts(index: number, maxPts: number): number {
  const ratios = [1, 0.71, 0.43, 0.43, 0.23, 0.23, 0.14, 0.14, 0.09, 0.09];
  return Math.max(1, Math.round(maxPts * (ratios[index] ?? 0.09)));
}

function StatPill({ value, label, color, bg }: { value: string | number; label: string; color: string; bg: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-[14px] h-[14px] rounded-[3px] flex items-center justify-center shrink-0" style={{ background: bg }}>
        <ThumbsUp className="h-2 w-2" style={{ color }} />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground/60">{label}</span>
    </div>
  );
}

function OrgCard({ item, index, maxPts, compact, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, isOver }: {
  item: OrgSignal; index: number; maxPts: number; compact: boolean;
  onDragStart: () => void; onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void; onDragEnd: () => void;
  isDragging: boolean; isOver: boolean;
}) {
  const pts = getPts(index, maxPts);
  return (
    <div draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}
      className={cn('flex items-center bg-secondary/40 rounded-md cursor-grab active:cursor-grabbing select-none mb-1 transition-all',
        index < 2 ? 'border border-border/60' : 'border border-transparent',
        isDragging && 'opacity-30', isOver && 'border-primary border-dashed')}>
      <div className="w-6 flex items-center justify-center py-2 shrink-0 text-muted-foreground/30">
        <GripVertical className="h-3 w-3" />
      </div>
      <div className={cn('flex-1 py-1.5 pr-2', compact ? 'space-y-0.5' : 'space-y-1')}>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-muted-foreground/50 w-3 shrink-0">{index + 1}</span>
          <span className={cn('font-medium text-foreground flex-1 leading-tight', compact ? 'text-[11px]' : 'text-xs')}>{item.name}</span>
          <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">{pts} pts</span>
        </div>
        <div className="flex gap-3 pl-[18px]">
          <StatPill value={item.likes} label="likes" color="#534AB7" bg="rgba(83,74,183,0.1)" />
          <StatPill value={item.comments} label="reacties" color="#0fb57a" bg="rgba(15,181,122,0.1)" />
        </div>
      </div>
    </div>
  );
}

function SuggestionCard({ s, onDismiss }: { s: Suggestion; onDismiss: (id: string) => void }) {
  const style = LEVEL_STYLES[s.level];
  return (
    <div className="border border-border/60 rounded-lg p-3 bg-card/50 flex flex-col gap-2">
      <span className={cn('inline-flex self-start text-[10px] font-medium px-1.5 py-0.5 rounded border', style.badge)}>{style.tag}</span>
      <div>
        <p className="text-xs font-medium text-foreground">{s.orgName}</p>
        <p className="text-[10px] text-muted-foreground">{s.domain} — {s.action}</p>
      </div>
      {(s.likes > 0 || s.overlap) && (
        <div className="flex gap-3 bg-secondary/40 rounded px-2 py-1">
          {s.overlap
            ? <div className="flex items-center gap-1"><span className="text-[10px] font-mono text-muted-foreground">{s.overlap}</span><span className="text-[10px] text-muted-foreground/60">klanten</span></div>
            : <><StatPill value={s.likes} label="likes" color="#534AB7" bg="rgba(83,74,183,0.1)" /><StatPill value={s.comments} label="reacties" color="#0fb57a" bg="rgba(15,181,122,0.1)" /></>
          }
        </div>
      )}
      <p className="text-[10px] text-muted-foreground leading-relaxed">{s.reason}</p>
      <div className="flex gap-2">
        <button className="text-[10px] px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">{s.level === 3 ? 'Bekijk domein' : 'Accepteer'}</button>
        <button onClick={() => onDismiss(s.id)} className="text-[10px] px-2.5 py-1 rounded border border-border/50 text-muted-foreground hover:text-foreground transition-colors">Negeer</button>
      </div>
    </div>
  );
}

export default function SignalsPage() {
  const [view, setView] = useState<'sbs' | 'focus'>('sbs');
  const [focusDomain, setFocusDomain] = useState('kunst');
  const [domains, setDomains] = useState<Domain[]>(MOCK_DOMAINS);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(SUGGESTIONS);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const dragItem = useRef<{ domainId: string; itemId: string } | null>(null);
  const dragOver = useRef<{ domainId: string; itemId: string } | null>(null);

  const handleDragStart = useCallback((domainId: string, itemId: string) => { dragItem.current = { domainId, itemId }; }, []);
  const handleDragOver = useCallback((e: React.DragEvent, domainId: string, itemId: string) => { e.preventDefault(); dragOver.current = { domainId, itemId }; }, []);
  const handleDrop = useCallback((e: React.DragEvent, targetDomainId: string, targetItemId: string) => {
    e.preventDefault();
    if (!dragItem.current) return;
    const { domainId: srcDomain, itemId: srcItem } = dragItem.current;
    if (srcDomain !== targetDomainId || srcItem === targetItemId) { dragItem.current = null; dragOver.current = null; return; }
    setDomains(prev => prev.map(d => {
      if (d.id !== srcDomain) return d;
      const items = [...d.items];
      const fi = items.findIndex(i => i.id === srcItem);
      const ti = items.findIndex(i => i.id === targetItemId);
      if (fi === -1 || ti === -1) return d;
      const [moved] = items.splice(fi, 1);
      items.splice(ti, 0, moved);
      return { ...d, items };
    }));
    dragItem.current = null; dragOver.current = null;
  }, []);
  const handleDragEnd = useCallback(() => { dragItem.current = null; dragOver.current = null; }, []);
  const dismissSuggestion = useCallback((id: string) => setSuggestions(prev => prev.filter(s => s.id !== id)), []);
  const currentFocus = domains.find(d => d.id === focusDomain)!;
  const wizardSteps = [
    { q: 'Wat verkoop je aan wie?', hint: 'bv. getokniseerde kunst aan vermogende particulieren' },
    { q: 'Wie is jouw ideale klant? Beschrijf hem in één zin.', hint: 'bv. een kunstliefhebber die ook actief belegt' },
    { q: 'Welke luxe of levensstijlkeuzes passen bij hem?', hint: 'bv. horloges, exclusieve events, vastgoed' },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Signaal Architectuur</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Sleep organisaties om hun gewicht aan te passen. Hogere positie = meer punten.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button onClick={() => setView('sbs')} className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors', view === 'sbs' ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:text-foreground')}>
              <Layers className="h-3 w-3" /> Naast elkaar
            </button>
            <button onClick={() => setView('focus')} className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors border-l border-border', view === 'focus' ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:text-foreground')}>
              <BarChart3 className="h-3 w-3" /> Pijler focus
            </button>
          </div>
          <button onClick={() => { setShowWizard(true); setWizardStep(0); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-lg transition-colors">
            <Sparkles className="h-3 w-3" /> Setup met AI
          </button>
        </div>
      </div>

      {view === 'sbs' && (
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">
            {domains.map(domain => (
              <div key={domain.id} className="flex flex-col bg-card border border-border rounded-xl min-h-0">
                <div className="px-3 pt-3 pb-2 border-b border-border shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: domain.color }} />
                    <span className="text-xs font-medium text-foreground flex-1">{domain.name}</span>
                    <span className="text-[10px] text-muted-foreground">{domain.items.length} org.</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground/60 mt-1 pl-4">Pos. 1 = {domain.maxPoints} pts · 2 = {getPts(1, domain.maxPoints)} · 3+ = {getPts(2, domain.maxPoints)}</p>
                </div>
                <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0">
                  {domain.items.map((item, idx) => (
                    <OrgCard key={item.id} item={item} index={idx} maxPts={domain.maxPoints} compact
                      onDragStart={() => handleDragStart(domain.id, item.id)}
                      onDragOver={e => handleDragOver(e, domain.id, item.id)}
                      onDrop={e => handleDrop(e, domain.id, item.id)}
                      onDragEnd={handleDragEnd}
                      isDragging={dragItem.current?.itemId === item.id}
                      isOver={dragOver.current?.itemId === item.id && dragOver.current?.domainId === domain.id}
                    />
                  ))}
                </div>
                <div className="px-2 pb-2 shrink-0">
                  <button className="w-full text-[10px] text-muted-foreground/50 border border-dashed border-border/40 rounded-md py-1.5 hover:border-border hover:text-muted-foreground transition-colors flex items-center justify-center gap-1">
                    <Plus className="h-3 w-3" /> Toevoegen
                  </button>
                </div>
              </div>
            ))}
          </div>
          {suggestions.length > 0 && (
            <div className="shrink-0 bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">AI Kalibratie</span>
                <span className="text-[10px] text-muted-foreground">— op basis van 12 klantprofielen</span>
                <div className="ml-auto text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">{suggestions.length} suggesties</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {suggestions.map(s => <SuggestionCard key={s.id} s={s} onDismiss={dismissSuggestion} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'focus' && (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="flex gap-2 shrink-0">
            {domains.map(d => (
              <button key={d.id} onClick={() => setFocusDomain(d.id)}
                className={cn('flex items-center gap-2 px-4 py-2 rounded-lg border text-xs transition-colors',
                  focusDomain === d.id ? 'border-border bg-card text-foreground font-medium' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30')}>
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                {d.name}
                <span className="text-[10px] bg-secondary/50 text-muted-foreground px-1.5 py-0.5 rounded-full">{d.items.length}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
            <div className="flex flex-col bg-card border border-border rounded-xl min-h-0">
              <div className="px-4 py-3 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: currentFocus.color }} />
                  <h2 className="text-sm font-medium text-foreground">{currentFocus.name}</h2>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Sleep om te herordenen · hogere positie = meer punten</p>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
                {currentFocus.items.map((item, idx) => (
                  <OrgCard key={item.id} item={item} index={idx} maxPts={currentFocus.maxPoints} compact={false}
                    onDragStart={() => handleDragStart(currentFocus.id, item.id)}
                    onDragOver={e => handleDragOver(e, currentFocus.id, item.id)}
                    onDrop={e => handleDrop(e, currentFocus.id, item.id)}
                    onDragEnd={handleDragEnd}
                    isDragging={dragItem.current?.itemId === item.id}
                    isOver={dragOver.current?.itemId === item.id}
                  />
                ))}
              </div>
              <div className="px-3 pb-3 shrink-0">
                <button className="w-full text-[10px] text-muted-foreground/50 border border-dashed border-border/40 rounded-md py-1.5 hover:border-border hover:text-muted-foreground transition-colors flex items-center justify-center gap-1">
                  <Plus className="h-3 w-3" /> Organisatie toevoegen
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
              <div className="bg-card border border-border rounded-xl p-4 shrink-0">
                <h3 className="text-xs font-medium text-foreground mb-3">Domein statistieken</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Totaal likes',    value: currentFocus.items.reduce((s, i) => s + i.likes, 0).toString() },
                    { label: 'Totaal reacties', value: currentFocus.items.reduce((s, i) => s + i.comments, 0).toString() },
                    { label: 'Sterkste signaal',value: currentFocus.items[0]?.name ?? '—' },
                    { label: 'Organisaties',    value: currentFocus.items.length.toString() },
                  ].map(stat => (
                    <div key={stat.label} className="bg-secondary/40 rounded-lg p-2.5">
                      <p className="text-[10px] text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-sm font-medium text-foreground">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-card border border-primary/20 rounded-xl p-4 shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-xs font-medium text-foreground">AI suggesties voor dit domein</h3>
                </div>
                <div className="space-y-2">
                  {suggestions.filter(s => s.domain === currentFocus.name).map(s => <SuggestionCard key={s.id} s={s} onDismiss={dismissSuggestion} />)}
                  {suggestions.filter(s => s.domain === currentFocus.name).length === 0 && <p className="text-[10px] text-muted-foreground">Geen suggesties voor dit domein.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWizard && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Signaal setup met AI</h2>
              </div>
              <button onClick={() => setShowWizard(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex gap-1.5 mb-6">
              {[0,1,2].map(i => <div key={i} className={cn('h-1 flex-1 rounded-full transition-all', i <= wizardStep ? 'bg-primary' : 'bg-border')} />)}
            </div>
            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-foreground">{wizardSteps[wizardStep].q}</p>
              <textarea placeholder={wizardSteps[wizardStep].hint} className="w-full h-24 bg-secondary/40 border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => wizardStep > 0 && setWizardStep(s => s-1)} className={cn('text-xs text-muted-foreground hover:text-foreground transition-colors', wizardStep === 0 && 'invisible')}>Vorige</button>
              <button onClick={() => { if (wizardStep < 2) setWizardStep(s => s+1); else setShowWizard(false); }} className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-lg transition-colors">
                {wizardStep < 2 ? 'Volgende' : 'AI stelt domeinen voor'}<ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
