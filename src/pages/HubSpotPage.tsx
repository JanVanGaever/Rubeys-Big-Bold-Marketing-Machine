import { useState, useMemo } from 'react';
import ConnectionAlert from '@/components/ConnectionAlert';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, CheckCircle, Plus, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { syncToHubSpot, pullFromHubSpot, isConnectionReady } from '@/lib/api-service';
import { toast } from 'sonner';
import type { Contact } from '@/types';

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Zojuist';
  if (hours < 24) return `${hours}u geleden`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Gisteren';
  return `${days} dagen geleden`;
}

export default function HubSpotPage() {
  const { contacts, settings, updateSettings, syncHistory, addSyncRecord, addContact, updateContact, recomputeScores, signals } = useStore();
  const ready = isConnectionReady('hubspot');

  const syncRules = settings.hubspotSyncRules;
  const mappings = settings.hubspotFieldMappings;

  const [syncing, setSyncing] = useState(false);
  const [pulling, setPulling] = useState(false);

  const setSyncWho = (v: string) => updateSettings({ hubspotSyncRules: { ...syncRules, who: v as any } });
  const setSyncWhen = (v: string) => updateSettings({ hubspotSyncRules: { ...syncRules, when: v as any } });
  const toggleField = (key: string) => updateSettings({ hubspotSyncRules: { ...syncRules, fields: { ...syncRules.fields, [key]: !syncRules.fields[key as keyof typeof syncRules.fields] } } });

  const updateMapping = (idx: number, field: 'lc' | 'hs', val: string) => {
    const updated = mappings.map((m, i) => i === idx ? { ...m, [field]: val } : m);
    updateSettings({ hubspotFieldMappings: updated });
  };
  const addMapping = () => updateSettings({ hubspotFieldMappings: [...mappings, { lc: '', hs: '' }] });

  // Determine which contacts to sync
  const syncContacts = useMemo(() => {
    switch (syncRules.who) {
      case 'hot': return contacts.filter(c => c.status === 'hot');
      case 'warm_hot': return contacts.filter(c => c.status === 'warm' || c.status === 'hot');
      case 'all': return contacts;
      default: return contacts.filter(c => c.status === 'hot');
    }
  }, [contacts, syncRules.who]);

  const buildPayload = (cts: Contact[]) => {
    return cts.map(c => {
      const mapped: Record<string, unknown> = {};
      for (const m of mappings) {
        if (!m.lc || !m.hs) continue;
        mapped[m.hs] = (c as any)[m.lc] ?? '';
      }
      if (syncRules.fields.domainTags) {
        const activeDomains = Object.entries(c.domains).filter(([, d]) => d.signalCount > 0).map(([k]) => settings.domainConfig[k as keyof typeof settings.domainConfig]?.name).join(', ');
        mapped['domain_tags'] = activeDomains;
      }
      return mapped;
    });
  };

  const handleSync = async () => {
    if (!ready) { toast.error('HubSpot of n8n niet geconfigureerd'); return; }
    setSyncing(true);
    const payload = buildPayload(syncContacts);
    const result = await syncToHubSpot(payload, mappings);
    setSyncing(false);

    if (result.success && result.data) {
      const d = result.data;
      addSyncRecord({ id: `sync-${Date.now()}`, date: new Date().toISOString(), direction: 'push', records: syncContacts.length, created: d.created, updated: d.updated, errors: d.errors, status: d.errors > 0 ? 'partial' : 'success' });
      toast.success(`${syncContacts.length} contacten naar HubSpot gesynchroniseerd (${d.created} nieuw, ${d.updated} bijgewerkt)`);
    } else {
      addSyncRecord({ id: `sync-${Date.now()}`, date: new Date().toISOString(), direction: 'push', records: syncContacts.length, created: 0, updated: 0, errors: syncContacts.length, status: 'error' });
      toast.error(result.error || 'Synchronisatie mislukt');
    }
  };

  const handlePull = async () => {
    if (!ready) { toast.error('HubSpot of n8n niet geconfigureerd'); return; }
    setPulling(true);
    const result = await pullFromHubSpot();
    setPulling(false);

    if (result.success && result.data) {
      let created = 0; let updated = 0;
      for (const hsContact of result.data) {
        const reverseMap: Record<string, string> = {};
        for (const m of mappings) { if (m.lc && m.hs) reverseMap[m.hs] = m.lc; }
        const mapped: Record<string, any> = {};
        for (const [k, v] of Object.entries(hsContact)) {
          if (reverseMap[k]) mapped[reverseMap[k]] = v;
        }
        const existing = contacts.find(c => c.email && c.email === mapped.email);
        if (existing) {
          updateContact(existing.id, mapped);
          updated++;
        } else if (mapped.firstName && mapped.lastName) {
          addContact({
            id: `hs-${Date.now()}-${created}`, linkedinUrl: mapped.linkedinUrl || '', firstName: mapped.firstName, lastName: mapped.lastName,
            title: mapped.title || null, company: mapped.company || null, email: mapped.email || null, phone: mapped.phone || null,
            location: null, source: 'import', addedAt: new Date().toISOString(),
            domains: { kunst: { signalCount: 0, lastSignalAt: null, weightedScore: 0 }, beleggen: { signalCount: 0, lastSignalAt: null, weightedScore: 0 }, luxe: { signalCount: 0, lastSignalAt: null, weightedScore: 0 } },
            activeDomainCount: 0, totalScore: 0, status: 'cold', isEnriched: false, enrichedAt: null,
            lemlistCampaignId: null, lemlistPushedAt: null, lastContactedAt: null, notes: '',
            engagementScore: 0, keywordScore: 0, crossSignalScore: 0, enrichmentScore: 0, diversityScore: 0,
            previousScore: null, scoreChangedAt: null, isCustomer: false, customerSince: null,
          });
          created++;
        }
      }
      addSyncRecord({ id: `sync-${Date.now()}`, date: new Date().toISOString(), direction: 'pull', records: result.data.length, created, updated, errors: 0, status: 'success' });
      recomputeScores();
      toast.success(`${result.data.length} contacten opgehaald uit HubSpot (${created} nieuw, ${updated} bijgewerkt)`);
    } else {
      toast.error(result.error || 'Pull mislukt');
    }
  };

  const isConnected = ready;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">HubSpot</h1>
        <p className="text-xs text-muted-foreground">Beheer de synchronisatie tussen Lead Catalyst en HubSpot CRM</p>
      </div>
      <ConnectionAlert connectionId="hubspot" featureName="CRM synchronisatie" />

      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]' : 'bg-muted-foreground'}`} />
              <div>
                <p className="text-sm font-semibold text-foreground">{isConnected ? 'Verbonden' : 'Niet verbonden'}</p>
                <p className="text-[10px] text-muted-foreground">
                  {syncHistory.length > 0 ? `Laatst gesynchroniseerd: ${relativeTime(syncHistory[0].date)}` : 'Nog niet gesynchroniseerd'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={!ready || pulling} onClick={handlePull}>
                {pulling ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ArrowLeft className="h-3 w-3 mr-1" />} Pull vanuit HubSpot
              </Button>
              <Button size="sm" disabled={!ready || syncing} onClick={handleSync}>
                {syncing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />} Synchroniseer nu ({syncContacts.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync regels */}
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-5">
          <h3 className="text-sm font-semibold text-foreground">Sync regels</h3>

          <div className="space-y-2">
            <Label className="text-xs">Welke contacten synchroniseren?</Label>
            <RadioGroup value={syncRules.who} onValueChange={setSyncWho} className="space-y-1">
              {[
                { value: 'hot', label: 'Alleen hot leads' },
                { value: 'warm_hot', label: 'Warm + hot leads' },
                { value: 'all', label: 'Alle leads' },
                { value: 'manual', label: 'Manueel selecteren' },
              ].map(opt => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={`who-${opt.value}`} />
                  <Label htmlFor={`who-${opt.value}`} className="text-xs font-normal">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Welke velden synchroniseren?</Label>
            <div className="space-y-1.5">
              {[
                { key: 'nameContact', label: 'Naam en contactinfo' },
                { key: 'scoreStatus', label: 'Score en status' },
                { key: 'domainTags', label: 'Domein-tags' },
                { key: 'signalHistory', label: 'Signaalgeschiedenis' },
                { key: 'enrichmentData', label: 'Enrichment data' },
                { key: 'notes', label: 'Notities' },
              ].map(f => (
                <div key={f.key} className="flex items-center gap-2">
                  <Checkbox checked={syncRules.fields[f.key as keyof typeof syncRules.fields]} onCheckedChange={() => toggleField(f.key)} />
                  <span className="text-xs">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Wanneer synchroniseren?</Label>
            <RadioGroup value={syncRules.when} onValueChange={setSyncWhen} className="space-y-1">
              {[
                { value: 'auto', label: 'Automatisch bij statuswijziging (cold→warm, warm→hot)' },
                { value: 'daily', label: 'Dagelijks' },
                { value: 'manual', label: 'Alleen manueel' },
              ].map(opt => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={`when-${opt.value}`} />
                  <Label htmlFor={`when-${opt.value}`} className="text-xs font-normal">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Veld mapping */}
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Veld mapping</h3>
          <div className="overflow-x-auto rounded border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Lead Catalyst veld</TableHead>
                  <TableHead className="text-xs w-10"></TableHead>
                  <TableHead className="text-xs">HubSpot property</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Input value={m.lc} onChange={e => updateMapping(i, 'lc', e.target.value)} className="h-7 text-xs" />
                    </TableCell>
                    <TableCell className="text-center"><ArrowRight className="h-3 w-3 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell>
                      <Input value={m.hs} onChange={e => updateMapping(i, 'hs', e.target.value)} className="h-7 text-xs font-mono" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button size="sm" variant="outline" onClick={addMapping}>
            <Plus className="h-3 w-3 mr-1" /> Voeg mapping toe
          </Button>
        </CardContent>
      </Card>

      {/* Sync geschiedenis */}
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Sync geschiedenis</h3>
          {syncHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nog geen synchronisaties uitgevoerd.</p>
          ) : (
            <div className="overflow-x-auto rounded border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Datum</TableHead>
                    <TableHead className="text-xs">Richting</TableHead>
                    <TableHead className="text-xs">Records</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncHistory.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs">{relativeTime(s.date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          {s.direction === 'push' ? <ArrowRight className="h-3 w-3 text-primary" /> : <ArrowLeft className="h-3 w-3 text-blue-400" />}
                          {s.direction === 'push' ? 'Naar HubSpot' : 'Vanuit HubSpot'}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{s.records}</TableCell>
                      <TableCell>
                        {s.status === 'success' ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Succes</Badge>
                        ) : s.status === 'partial' ? (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">Gedeeltelijk</Badge>
                        ) : (
                          <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">Fout</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
