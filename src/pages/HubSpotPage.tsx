import { useState } from 'react';
import ConnectionAlert from '@/components/ConnectionAlert';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GitBranch, RefreshCw, CheckCircle, XCircle, Plus, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface SyncRecord {
  id: string;
  date: string;
  direction: 'push' | 'pull';
  records: number;
  status: 'success' | 'error';
}

const MOCK_SYNC_HISTORY: SyncRecord[] = [
  { id: '1', date: '2026-04-07T11:00:00Z', direction: 'push', records: 5, status: 'success' },
  { id: '2', date: '2026-04-06T09:00:00Z', direction: 'push', records: 3, status: 'success' },
  { id: '3', date: '2026-04-05T15:30:00Z', direction: 'pull', records: 8, status: 'success' },
  { id: '4', date: '2026-04-04T10:00:00Z', direction: 'push', records: 12, status: 'error' },
  { id: '5', date: '2026-04-03T14:00:00Z', direction: 'push', records: 7, status: 'success' },
  { id: '6', date: '2026-04-02T09:30:00Z', direction: 'pull', records: 4, status: 'success' },
  { id: '7', date: '2026-04-01T16:00:00Z', direction: 'push', records: 9, status: 'success' },
  { id: '8', date: '2026-03-31T11:00:00Z', direction: 'push', records: 6, status: 'success' },
];

const DEFAULT_MAPPINGS = [
  { lc: 'firstName', hs: 'firstname' },
  { lc: 'lastName', hs: 'lastname' },
  { lc: 'email', hs: 'email' },
  { lc: 'phone', hs: 'phone' },
  { lc: 'totalScore', hs: 'lead_score' },
  { lc: 'status', hs: 'lead_status' },
  { lc: 'activeDomainCount', hs: 'domain_count' },
];

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
  const [isConnected] = useState(true);
  const [syncWho, setSyncWho] = useState('warm_hot');
  const [syncWhen, setSyncWhen] = useState('auto');
  const [syncFields, setSyncFields] = useState({
    nameContact: true, scoreStatus: true, domainTags: true,
    signalHistory: false, enrichmentData: true, notes: false,
  });
  const [mappings, setMappings] = useState(DEFAULT_MAPPINGS);

  const toggleField = (key: string) => setSyncFields(p => ({ ...p, [key]: !p[key as keyof typeof p] }));

  const addMapping = () => setMappings(p => [...p, { lc: '', hs: '' }]);
  const updateMapping = (idx: number, field: 'lc' | 'hs', val: string) => {
    setMappings(p => p.map((m, i) => i === idx ? { ...m, [field]: val } : m));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">HubSpot</h1>
        <p className="text-xs text-muted-foreground">Beheer de synchronisatie tussen Lead Catalyst en HubSpot CRM</p>
      </div>

      {/* Sync status */}
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]' : 'bg-muted-foreground'}`} />
              <div>
                <p className="text-sm font-semibold text-foreground">{isConnected ? 'Verbonden' : 'Niet verbonden'}</p>
                <p className="text-[10px] text-muted-foreground">Laatst gesynchroniseerd: {relativeTime('2026-04-07T11:00:00Z')}</p>
              </div>
            </div>
            <Button size="sm">
              <RefreshCw className="h-3 w-3 mr-1" /> Synchroniseer nu
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync regels */}
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-5">
          <h3 className="text-sm font-semibold text-foreground">Sync regels</h3>

          <div className="space-y-2">
            <Label className="text-xs">Welke contacten synchroniseren?</Label>
            <RadioGroup value={syncWho} onValueChange={setSyncWho} className="space-y-1">
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
                  <Checkbox checked={syncFields[f.key as keyof typeof syncFields]} onCheckedChange={() => toggleField(f.key)} />
                  <span className="text-xs">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Wanneer synchroniseren?</Label>
            <RadioGroup value={syncWhen} onValueChange={setSyncWhen} className="space-y-1">
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
                {MOCK_SYNC_HISTORY.map(s => (
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
                      ) : (
                        <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">Fout</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
