import { Lock, Brain, Layers, ArrowRightLeft, Sparkles } from 'lucide-react';
import { MOCK_DOMAINS, MOCK_CONTACTS, getPts } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function SignalsPage() {
  const domains = MOCK_DOMAINS.filter(d => d.isActive);
  const contacts = MOCK_CONTACTS;

  // Cross-signal stats
  const contactDomainCounts = contacts.map(c => {
    const domainSet = new Set(c.signals.map(s => s.type));
    return domainSet.size;
  });
  const single = contactDomainCounts.filter(c => c === 1).length;
  const dual = contactDomainCounts.filter(c => c === 2).length;
  const triple = contactDomainCounts.filter(c => c >= 3).length;

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Signalen</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Read-only overzicht van je signaalarchitectuur · {domains.length} domeinen · {domains.reduce((s, d) => s + d.items.length, 0)} organisaties
        </p>
      </div>

      {/* SECTION 1: Domain overview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">Domein overzicht</h2>
        </div>
        <div className={cn(
          'grid gap-3',
          domains.length <= 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          domains.length > 3 && 'xl:grid-cols-4'
        )}>
          {domains.map(domain => {
            const activeItems = domain.items.filter(o => o.active);
            const totalPts = activeItems.reduce((s, _, i) => s + getPts(i, domain.maxPoints), 0);
            return (
              <div key={domain.id} className="bg-card border border-border rounded-xl flex flex-col">
                {/* Domain header */}
                <div className="px-4 pt-3 pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: domain.color }} />
                    <span className="text-xs font-medium text-foreground flex-1">{domain.name}</span>
                  </div>
                  <div className="flex gap-3 mt-1.5 pl-[18px]">
                    <span className="text-[10px] text-muted-foreground">{domain.items.length} org.</span>
                    <span className="text-[10px] text-muted-foreground">{activeItems.length} actief</span>
                    <span className="text-[10px] text-muted-foreground">Max {domain.maxPoints} pts</span>
                  </div>
                </div>

                {/* Org list */}
                <div className="flex-1 px-3 py-2 space-y-0.5 max-h-72 overflow-y-auto">
                  {domain.items.sort((a, b) => a.rank - b.rank).map((org, idx) => {
                    const pts = getPts(idx, domain.maxPoints);
                    return (
                      <div key={org.id} className={cn(
                        'flex items-center gap-2 py-1.5 px-2 rounded-md',
                        org.active ? '' : 'opacity-30'
                      )}>
                        <span className="text-[10px] font-mono text-muted-foreground/40 w-3 shrink-0">{org.rank}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-foreground truncate">{org.name}</p>
                          <p className="text-[9px] text-muted-foreground/40">{org.city}</p>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">{pts} pts</span>
                        <div className="flex items-center gap-1 shrink-0 text-muted-foreground/30">
                          <span className="text-[9px] font-mono">{org.likes + org.comments}</span>
                          <span className="text-[8px]">sig.</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer summary */}
                <div className="px-4 py-2 border-t border-border/50 text-[9px] text-muted-foreground/40">
                  Pos. 1 = {domain.maxPoints} pts · 2 = {getPts(1, domain.maxPoints)} · 3 = {getPts(2, domain.maxPoints)} · Totaal bereik: {totalPts} pts
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Cross-signals */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">Cross-signalen</h2>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-4">
            De kracht van het model zit in cross-signalen: contacten die in meerdere domeinen actief zijn, scoren significant hoger.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-secondary/40 rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold text-foreground">{single}</p>
              <p className="text-[10px] text-muted-foreground mt-1">1 domein</p>
              <div className="flex justify-center gap-1 mt-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground/10" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground/10" />
              </div>
            </div>
            <div className="bg-secondary/40 rounded-lg p-3 text-center border border-primary/10">
              <p className="text-2xl font-semibold text-foreground">{dual}</p>
              <p className="text-[10px] text-muted-foreground mt-1">2 domeinen</p>
              <div className="flex justify-center gap-1 mt-2">
                <div className="w-2 h-2 rounded-full bg-primary/60" />
                <div className="w-2 h-2 rounded-full bg-primary/60" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground/10" />
              </div>
            </div>
            <div className="bg-secondary/40 rounded-lg p-3 text-center border border-primary/20">
              <p className="text-2xl font-semibold text-primary">{triple}</p>
              <p className="text-[10px] text-muted-foreground mt-1">3+ domeinen</p>
              <div className="flex justify-center gap-1 mt-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/40 mt-3 text-center">
            {contacts.length} contacten geanalyseerd · {dual + triple} met cross-domein activiteit ({Math.round(((dual + triple) / contacts.length) * 100)}%)
          </p>
        </div>
      </div>

      {/* SECTION 3: AI Calibration */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">AI Kalibratie</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Op basis van klantprofielen kan AI suggesties doen voor rangorde-aanpassingen, nieuwe organisaties, of nieuwe domeinen.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { title: 'Rangorde suggestie', desc: 'Beschikbaar wanneer er voldoende signaaldata is', icon: Sparkles },
            { title: 'Nieuwe organisatie', desc: 'Beschikbaar wanneer er voldoende signaaldata is', icon: Layers },
            { title: 'Nieuw domein', desc: 'Beschikbaar wanneer er voldoende klantprofielen zijn', icon: Brain },
          ].map(card => (
            <div key={card.title} className="bg-card border border-border/40 rounded-xl p-4 opacity-40 select-none">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
                <Lock className="h-3 w-3 text-muted-foreground/50 ml-auto" />
              </div>
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
