import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, CheckCircle, XCircle, Mail, Phone, Building2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

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

// Mock weekly enrichment data
const WEEKLY_DATA = [
  { week: 'W9', count: 3 }, { week: 'W10', count: 7 }, { week: 'W11', count: 5 },
  { week: 'W12', count: 12 }, { week: 'W13', count: 8 }, { week: 'W14', count: 15 },
  { week: 'W15', count: 11 }, { week: 'W16', count: 9 },
];

export default function EnrichmentPage() {
  const { contacts, settings } = useStore();
  const domainConfig = settings.domainConfig;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [autoEnrich, setAutoEnrich] = useState(true);
  const [enrichFilter, setEnrichFilter] = useState<'all' | 'email' | 'phone' | 'incomplete'>('all');
  const [enrichFields, setEnrichFields] = useState({ email: true, phone: true, companySize: true, industry: true, website: false });

  // Queue: warm/hot, not enriched
  const queue = contacts.filter(c => (c.status === 'warm' || c.status === 'hot') && !c.isEnriched)
    .sort((a, b) => b.totalScore - a.totalScore);

  // Enriched contacts
  const enrichedAll = contacts.filter(c => c.isEnriched);
  const enriched = enrichedAll.filter(c => {
    if (enrichFilter === 'email') return !!c.email;
    if (enrichFilter === 'phone') return !!c.phone;
    if (enrichFilter === 'incomplete') return !c.email || !c.phone;
    return true;
  });

  // Stats
  const totalEnriched = enrichedAll.length;
  const emailHitRate = totalEnriched > 0 ? Math.round((enrichedAll.filter(c => c.email).length / totalEnriched) * 100) : 0;
  const phoneHitRate = totalEnriched > 0 ? Math.round((enrichedAll.filter(c => c.phone).length / totalEnriched) * 100) : 0;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === queue.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(queue.map(c => c.id)));
  };

  const maxBar = Math.max(...WEEKLY_DATA.map(d => d.count));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Enrichment</h1>
        <p className="text-xs text-muted-foreground">Beheer en monitor Apollo-verrijking van contacten</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Totaal verrijkt', value: totalEnriched.toString(), icon: Database },
          { label: 'Email hit rate', value: `${emailHitRate}%`, icon: Mail },
          { label: 'Telefoon hit rate', value: `${phoneHitRate}%`, icon: Phone },
          { label: 'Credits deze maand', value: '847 / 10.000', icon: Zap },
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
          <div className="flex items-end gap-3 h-32">
            {WEEKLY_DATA.map(d => (
              <div key={d.week} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{d.count}</span>
                <div className="w-full rounded-t bg-primary/70" style={{ height: `${(d.count / maxBar) * 100}%` }} />
                <span className="text-[10px] text-muted-foreground">{d.week}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
              <Button size="sm">Verrijk {selectedIds.size} geselecteerden</Button>
            )}
            <Button size="sm" variant="secondary">Verrijk alle warm + hot</Button>
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
                      <TableCell><Button size="sm" variant="outline" className="h-6 text-[10px]">Verrijk</Button></TableCell>
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
                <Switch checked={autoEnrich} onCheckedChange={setAutoEnrich} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Apollo API status</Label>
                  <p className="text-[10px] text-muted-foreground">Verbinding met Apollo.io</p>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Connected</Badge>
              </div>

              <div>
                <Label className="text-xs">Credits resterend</Label>
                <p className="text-sm font-medium text-foreground">9.153 / 10.000</p>
                <div className="w-full h-1.5 bg-muted rounded-full mt-1">
                  <div className="h-full bg-primary rounded-full" style={{ width: '91.5%' }} />
                </div>
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
