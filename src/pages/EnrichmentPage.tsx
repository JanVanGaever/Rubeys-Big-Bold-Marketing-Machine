import { useState } from 'react';
import { Sparkles, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export default function EnrichmentPage() {
  const { contacts } = useApp();
  const [enriching, setEnriching] = useState<string[]>([]);
  const [enriched, setEnriched] = useState<string[]>([]);

  const needsEnrichment = contacts.filter(c => !c.emailWork || !c.phone);

  const enrich = (id: string) => {
    setEnriching(p => [...p, id]);
    setTimeout(() => {
      setEnriching(p => p.filter(i => i !== id));
      setEnriched(p => [...p, id]);
    }, 1800);
  };

  const enrichAll = () => needsEnrichment.forEach(c => enrich(c.id));

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Enrichment</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Verrijk contacten met e-mail en telefoonnummer via Apollo</p>
        </div>
        <button onClick={enrichAll} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-lg transition-colors">
          <Sparkles className="h-3.5 w-3.5" /> Verrijk alle ({needsEnrichment.length})
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[{ label: 'Te verrijken', value: needsEnrichment.length, color: 'text-orange-400' }, { label: 'Verrijkt vandaag', value: enriched.length, color: 'text-emerald-400' }, { label: 'Totaal compleet', value: contacts.filter(c => c.emailWork && c.phone).length, color: 'text-foreground' }].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className={cn('text-2xl font-semibold', s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Wachtrij voor enrichment</h3>
        </div>
        <div className="divide-y divide-border">
          {needsEnrichment.map(contact => {
            const isEnriching = enriching.includes(contact.id);
            const isEnriched = enriched.includes(contact.id);
            return (
              <div key={contact.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-medium text-primary">{contact.firstName[0]}{contact.lastName[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{contact.firstName} {contact.lastName}</p>
                  <p className="text-[10px] text-muted-foreground">{contact.title} · {contact.company}</p>
                </div>
                <div className="flex gap-2 text-[10px] text-muted-foreground">
                  {!contact.emailWork && <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400">geen werk-email</span>}
                  {!contact.phone && <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400">geen telefoon</span>}
                </div>
                <button
                  onClick={() => enrich(contact.id)}
                  disabled={isEnriching || isEnriched}
                  className={cn('flex items-center gap-1 px-2.5 py-1.5 text-[10px] rounded-md border transition-colors',
                    isEnriched ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    isEnriching ? 'bg-secondary text-muted-foreground border-border' :
                    'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                  )}
                >
                  {isEnriched ? <><CheckCircle className="h-3 w-3" /> Klaar</> :
                   isEnriching ? <><RefreshCw className="h-3 w-3 animate-spin" /> Bezig...</> :
                   <><Sparkles className="h-3 w-3" /> Verrijk</>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
