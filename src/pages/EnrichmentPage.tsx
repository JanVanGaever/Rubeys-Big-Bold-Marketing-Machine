import { useState, useMemo } from 'react';
import ConnectionAlert from '@/components/ConnectionAlert';
import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, CheckCircle, XCircle, Mail, Phone, Zap, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { enrichContact, enrichBatch, isConnectionReady } from '@/lib/api-service';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  hot: 'bg-red-500/20 text-red-400 border-red-500/30',
  warm: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  cold: 'bg-muted text-muted-foreground border-border',
};

function relativeTime(iso: string | null) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Zojuist';
  if (hours < 24) return `${hours}u geleden`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Gisteren';
  return `${days} dagen geleden`;
}

export default function EnrichmentPage() {
  const { contacts, settings, updateContact, recomputeScores, enrichmentHistory, addEnrichmentRecord, updateSettings } = useStore();
  const domainConfig = settings.domainConfig;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [enrichFilter, setEnrichFilter] = useState<'all' | 'email' | 'phone' | 'incomplete'>('all');
  const [enrichFields, setEnrichFields] = useState({ email: true, phone: true, companySize: true, industry: true, website: false });
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);

  const ready = isConnectionReady('apollo');

  const queue = contacts.filter(c => (c.status === 'warm' || c.status === 'hot') && !c.isEnriched)
    .sort((a, b) => b.totalScore - a.totalScore);

  const enrichedAll = contacts.filter(c => c.isEnriched);
  const enriched = enrichedAll.filter(c => {
    if (enrichFilter === 'email') return !!c.email;
    if (enrichFilter === 'phone') return !!c.phone;
    if (enrichFilter === 'incomplete') return !c.email || !c.phone;
    return true;
  });

  const totalEnriched = enrichedAll.length;
  const emailHitRate = totalEnriched > 0 ? Math.round((enrichedAll.filter(c => c.email).length / totalEnriched) * 100) : 0;
  const phoneHitRate = totalEnriched > 0 ? Math.round((enrichedAll.filter(c => c.phone).length / totalEnriched) * 100) : 0;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const selectAll = () => {
    if (selectedIds.size === queue.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(queue.map(c => c.id)));
  };

  const handleEnrichSingle = async (contactId: string) => {
    const c = contacts.find(ct => ct.id === contactId);
    if (!c) return;
    if (!ready) { toast.error('Apollo of n8n niet geconfigureerd'); return; }

    setEnrichingIds(prev => new Set(prev).add(contactId));
    const result = await enrichContact({ linkedinUrl: c.linkedinUrl, firstName: c.firstName, lastName: c.lastName, company: c.company });
    setEnrichingIds(prev => { const n = new Set(prev); n.delete(contactId); return n; });

    if (result.success && result.data) {
      const d = result.data;
      const fieldsFound: string[] = [];
      const fieldsMissing: string[] = [];
      const email = d.personalEmail || d.workEmail || d.email || null;
      if (email) fieldsFound.push('email'); else fieldsMissing.push('email');
      if (d.phone) fieldsFound.push('phone'); else fieldsMissing.push('phone');
      updateContact(contactId, { email: email || c.email, phone: d.phone || c.phone, title: c.title || d.title || null, company: c.company || d.company || null, isEnriched: true, enrichedAt: new Date().toISOString() });
      addEnrichmentRecord({ id: `enr-${Date.now()}`, contactId, contactName: `${c.firstName} ${c.lastName}`, date: new Date().toISOString(), status: fieldsMissing.length > 0 ? 'partial' : 'success', fieldsFound, fieldsMissing });
      recomputeScores();
      toast.success(`${c.firstName} ${c.lastName} verrijkt: ${fieldsFound.join(' + ') || 'geen nieuwe data'}`);
    } else {
      addEnrichmentRecord({ id: `enr-${Date.now()}`, contactId, contactName: `${c.firstName} ${c.lastName}`, date: new Date().toISOString(), status: 'error', fieldsFound: [], fieldsMissing: ['email', 'phone'] });
      toast.error(result.error || 'Verrijking mislukt');
    }
  };

  const handleEnrichBatch = async (ids: string[]) => {
    const targets = contacts.filter(c => ids.includes(c.id));
    if (!ready) { toast.error('Apollo of n8n niet geconfigureerd'); return; }

    setBatchProgress({ done: 0, total: targets.length });
    const result = await enrichBatch(targets.map(c => ({ id: c.id, linkedinUrl: c.linkedinUrl, firstName: c.firstName, lastName: c.lastName, company: c.company })));
    setBatchProgress(null);

    if (result.success && result.data) {
      let emailsFound = 0; let errors = 0;
      for (const c of targets) {
        const d = result.data[c.id];
        if (d) {
          const email = d.personalEmail || d.workEmail || d.email || null;
          if (email) emailsFound++;
          updateContact(c.id, { email: email || c.email, phone: d.phone || c.phone, title: c.title || d.title || null, company: c.company || d.company || null, isEnriched: true, enrichedAt: new Date().toISOString() });
          addEnrichmentRecord({ id: `enr-${Date.now()}-${c.id}`, contactId: c.id, contactName: `${c.firstName} ${c.lastName}`, date: new Date().toISOString(), status: 'success', fieldsFound: email ? ['email'] : [], fieldsMissing: email ? [] : ['email'] });
        } else {
          errors++;
        }
      }
      recomputeScores();
      toast.success(`${targets.length} contacten verrijkt, ${emailsFound} emails gevonden${errors > 0 ? `, ${errors} fouten` : ''}`);
    } else {
      toast.error(result.error || 'Batch verrijking mislukt');
    }
    setSelectedIds(new Set());
  };

  // Weekly chart from enrichmentHistory
  const weeklyData = useMemo(() => {
    const weeks: Record<string, number> = {};
    for (const r of enrichmentHistory) {
      const d = new Date(r.date);
      const weekNum = Math.ceil((d.getDate()) / 7);
      const key = `W${weekNum}`;
      weeks[key] = (weeks[key] || 0) + 1;
    }
    const entries = Object.entries(weeks).slice(-8);
    return entries.length > 0 ? entries.map(([week, count]) => ({ week, count })) : null;
  }, [enrichmentHistory]);

  const maxBar = weeklyData ? Math.max(...weeklyData.map(d => d.count)) : 1;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Enrichment</h1>
        <p className="text-xs text-muted-foreground">Beheer en monitor Apollo-verrijking van contacten</p>
      </div>
      <ConnectionAlert connectionId="apollo" featureName="Enrichment" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Totaal verrijkt', value: totalEnriched.toString(), icon: Database },
          { label: 'Email hit rate', value: `${emailHitRate}%`, icon: Mail },
          { label: 'Telefoon hit rate', value: `${phoneHitRate}%`, icon: Phone },
          { label: 'Enrichment records', value: enrichmentHistory.length.toString(), icon: Zap },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-lg font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly chart */}
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Verrijkingen per week</h3>
          {weeklyData ? (
            <div className="flex items-end gap-3 h-32">
              {weeklyData.map(d => (
                <div key={d.week} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{d.count}</span>
                  <div className="w-full rounded-t bg-primary/70" style={{ height: `${(d.count / maxBar) * 100}%` }} />
                  <span className="text-[10px] text-muted-foreground">{d.week}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">Nog geen enrichment data</p>
          )}
        </CardContent>
      </Card>

      {batchProgress && (
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-foreground">Verrijking bezig... {batchProgress.done}/{batchProgress.total} voltooid</span>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="queue">
        <TabsList className="bg-muted">
          <TabsTrigger value="queue" className="text-xs">Wachtrij ({queue.length})</TabsTrigger>
          <TabsTrigger value="enriched" className="text-xs">Verrijkt ({enrichedAll.length})</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">Instellingen</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={selectAll}>
              {selectedIds.size === queue.length ? 'Deselecteer alles' : 'Selecteer alles'}
            </Button>
            {selectedIds.size > 0 && (
              <Button size="sm" disabled={!ready} onClick={() => handleEnrichBatch(Array.from(selectedIds))}>
                Verrijk {selectedIds.size} geselecteerden
              </Button>
            )}
            <Button size="sm" variant="secondary" disabled={!ready || queue.length === 0} onClick={() => handleEnrichBatch(queue.map(c => c.id))}>
              Verrijk alle warm + hot
            </Button>
          </div>

          {queue.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Geen contacten in de wachtrij — alle warm/hot leads zijn verrijkt.</p>
          ) : (
            <div className="overflow-x-auto rounded border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"><Checkbox checked={selectedIds.size === queue.length && queue.length > 0} onCheckedChange={selectAll} /></TableHead>
                    <TableHead className="text-xs">Naam</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Score</TableHead>
                    <TableHead className="text-xs">Domeinen</TableHead>
                    <TableHead className="text-xs">Actie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map(c => (
                    <TableRow key={c.id}>
                      <TableCell><Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} /></TableCell>
                      <TableCell className="text-xs font-medium text-foreground">{c.firstName} {c.lastName}</TableCell>
                      <TableCell><Badge className={`text-[10px] ${STATUS_COLORS[c.status]}`}>{c.status}</Badge></TableCell>
                      <TableCell className="text-xs">{c.totalScore}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {Object.entries(c.domains).filter(([, d]) => d.signalCount > 0).map(([key]) => (
                            <div key={key} className="w-2 h-2 rounded-full" style={{ background: domainConfig[key as keyof typeof domainConfig]?.color || '#666' }} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" disabled={!ready || enrichingIds.has(c.id)} onClick={() => handleEnrichSingle(c.id)}>
                          {enrichingIds.has(c.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Verrijk'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="enriched" className="mt-4 space-y-3">
          <div className="flex gap-2">
            {(['all', 'email', 'phone', 'incomplete'] as const).map(f => (
              <Button key={f} size="sm" variant={enrichFilter === f ? 'default' : 'outline'} className="text-xs h-7" onClick={() => setEnrichFilter(f)}>
                {f === 'all' ? 'Alle' : f === 'email' ? 'Email gevonden' : f === 'phone' ? 'Telefoon gevonden' : 'Onvolledig'}
              </Button>
            ))}
          </div>
          <div className="overflow-x-auto rounded border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Naam</TableHead>
                  <TableHead className="text-xs">Verrijkt op</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Telefoon</TableHead>
                  <TableHead className="text-xs">Bedrijfsdata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enriched.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs font-medium text-foreground">{c.firstName} {c.lastName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{relativeTime(c.enrichedAt)}</TableCell>
                    <TableCell>{c.email ? <CheckCircle className="h-3.5 w-3.5 text-green-400" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground/40" />}</TableCell>
                    <TableCell>{c.phone ? <CheckCircle className="h-3.5 w-3.5 text-green-400" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground/40" />}</TableCell>
                    <TableCell>{c.company ? <CheckCircle className="h-3.5 w-3.5 text-green-400" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground/40" />}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card className="bg-card border-border">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Auto-enrich</Label>
                  <p className="text-[10px] text-muted-foreground">Automatisch verrijken wanneer een contact warm of hot wordt</p>
                </div>
                <Switch checked={settings.autoEnrichEnabled} onCheckedChange={(v) => updateSettings({ autoEnrichEnabled: v })} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Apollo API status</Label>
                  <p className="text-[10px] text-muted-foreground">Verbinding met Apollo.io via n8n</p>
                </div>
                <Badge className={ready ? "bg-green-500/20 text-green-400 border-green-500/30 text-[10px]" : "bg-muted text-muted-foreground border-border text-[10px]"}>
                  {ready ? 'Connected' : 'Niet verbonden'}
                </Badge>
              </div>

              <div>
                <Label className="text-xs mb-2 block">Welke velden verrijken</Label>
                <div className="space-y-2">
                  {Object.entries(enrichFields).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox checked={val} onCheckedChange={v => setEnrichFields(p => ({ ...p, [key]: !!v }))} />
                      <span className="text-xs text-foreground capitalize">{key === 'companySize' ? 'Bedrijfsgrootte' : key === 'industry' ? 'Industrie' : key === 'website' ? 'Website' : key === 'email' ? 'Email' : 'Telefoon'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
