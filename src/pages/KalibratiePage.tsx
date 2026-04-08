import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, X, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { runCalibration } from '@/lib/calibration-engine';
import type { CalibrationLevel } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const levelConfig: Record<CalibrationLevel, { label: string; borderColor: string; bgColor: string }> = {
  1: { label: 'Rangorde aanpassingen', borderColor: 'border-l-green-500', bgColor: 'bg-green-500/5' },
  2: { label: 'Organisatie suggesties', borderColor: 'border-l-blue-500', bgColor: 'bg-blue-500/5' },
  3: { label: 'Domein heroverwegingen', borderColor: 'border-l-purple-500', bgColor: 'bg-purple-500/5' },
};

const levelBadgeColors: Record<CalibrationLevel, string> = {
  1: 'bg-green-500/20 text-green-400',
  2: 'bg-blue-500/20 text-blue-400',
  3: 'bg-purple-500/20 text-purple-400',
};

export default function KalibratiePage() {
  const { contacts, signals, watchlistOrgs, settings, calibrationSuggestions, addCalibrationSuggestion, acceptSuggestion, rejectSuggestion } = useStore();
  const navigate = useNavigate();
  const [historyOpen, setHistoryOpen] = useState(false);

  const customers = useMemo(() => contacts.filter(c => c.isCustomer), [contacts]);
  const customerCount = customers.length;

  const pendingSuggestions = useMemo(() => calibrationSuggestions.filter(s => s.status === 'pending'), [calibrationSuggestions]);
  const decidedSuggestions = useMemo(() =>
    calibrationSuggestions.filter(s => s.status !== 'pending').sort((a, b) => (b.decidedAt ?? '').localeCompare(a.decidedAt ?? '')),
    [calibrationSuggestions]
  );

  const level1Available = customerCount >= 5;
  const level2Available = customerCount >= 10;
  const level3Available = customerCount >= 20;

  const handleAnalyse = () => {
    const results = runCalibration(customers, signals, watchlistOrgs, settings, calibrationSuggestions);
    if (results.length === 0) {
      toast.info('Geen nieuwe suggesties gevonden op basis van de huidige data.');
      return;
    }
    results.forEach(s => addCalibrationSuggestion(s));
    toast.success(`${results.length} nieuwe suggestie${results.length > 1 ? 's' : ''} gegenereerd.`);
  };

  const handleAccept = (id: string) => {
    acceptSuggestion(id);
    toast.success('Suggestie toegepast');
  };

  const handleReject = (id: string) => {
    rejectSuggestion(id);
    toast.info('Suggestie afgewezen');
  };

  // Empty state
  if (customerCount < 5) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Signaalkalibratie</h1>
        <p className="text-sm text-muted-foreground mb-1">Tag minstens 5 contacten als 'bestaande klant' om kalibratie te activeren.</p>
        <p className="text-xs text-muted-foreground mb-6">Ga naar Contacten, open een contact, en zet de 'Bestaande klant' switch aan.</p>
        <p className="text-xs text-muted-foreground mb-4">Momenteel: {customerCount} klant{customerCount !== 1 ? 'en' : ''} getagd</p>
        <Button onClick={() => navigate('/contacten')} className="gap-2"><Users className="h-4 w-4" />Ga naar Contacten</Button>
      </div>
    );
  }

  // Group pending by level
  const grouped = ([1, 2, 3] as CalibrationLevel[]).map(level => ({
    level,
    items: pendingSuggestions.filter(s => s.level === level),
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Signaalkalibratie</h1>
          <p className="text-xs text-muted-foreground">Verfijn je signaalmodel op basis van klantinzichten</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">{customerCount} klanten getagd</p>
            <div className="flex gap-1 mt-1">
              {[
                { min: 5, label: 'N1' },
                { min: 10, label: 'N2' },
                { min: 20, label: 'N3' },
              ].map(l => (
                <div key={l.label} className={`px-2 py-0.5 rounded text-[10px] font-medium ${customerCount >= l.min ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {l.label}
                </div>
              ))}
            </div>
          </div>
          <Button onClick={handleAnalyse} disabled={!level1Available} className="gap-2">
            <Sparkles className="h-4 w-4" />Analyse starten
          </Button>
        </div>
      </div>

      {/* Level availability */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${level1Available ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
              <span className="text-muted-foreground">Niveau 1: Rangorde ({level1Available ? 'beschikbaar' : `${5 - customerCount} klanten nodig`})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${level2Available ? 'bg-blue-500' : 'bg-muted-foreground/30'}`} />
              <span className="text-muted-foreground">Niveau 2: Organisaties ({level2Available ? 'beschikbaar' : `${10 - customerCount} klanten nodig`})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${level3Available ? 'bg-purple-500' : 'bg-muted-foreground/30'}`} />
              <span className="text-muted-foreground">Niveau 3: Domeinen ({level3Available ? 'beschikbaar' : `${20 - customerCount} klanten nodig`})</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending suggestions */}
      {grouped.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Actieve suggesties</h2>
          {grouped.map(group => (
            <div key={group.level} className="space-y-2">
              <div className={`px-3 py-1.5 rounded text-xs font-medium ${levelConfig[group.level].bgColor} text-foreground`}>
                {levelConfig[group.level].label}
              </div>
              {group.items.map(s => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className={`bg-card border-border border-l-2 ${levelConfig[s.level].borderColor}`}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${levelBadgeColors[s.level]}`}>
                        {s.level}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p className="text-sm font-semibold text-foreground">{s.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-3">{s.explanation}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[200px] h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${s.evidence.percentage}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{s.evidence.customerCount} van {s.evidence.totalCustomers} klanten ({s.evidence.percentage}%)</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10" onClick={() => handleAccept(s.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => handleReject(s.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ))}
        </section>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Geen openstaande suggesties. Klik op 'Analyse starten' om je model te evalueren.</p>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {decidedSuggestions.length > 0 && (
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            {historyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Suggestie historie ({decidedSuggestions.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-1.5">
            {decidedSuggestions.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-2.5 rounded bg-muted/20 text-xs">
                <span className="text-muted-foreground shrink-0">{s.decidedAt ? new Date(s.decidedAt).toLocaleDateString('nl-BE') : ''}</span>
                <span className="flex-1 text-foreground truncate">{s.title}</span>
                <Badge variant="outline" className={`text-[10px] ${s.status === 'accepted' ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'}`}>
                  {s.status === 'accepted' ? 'Toegepast' : 'Afgewezen'}
                </Badge>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
