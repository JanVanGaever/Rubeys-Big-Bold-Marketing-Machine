import { useState, useCallback, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Domain } from '@/types';

interface ImportRecord {
  id: string;
  date: string;
  type: 'CSV' | 'Phantombuster';
  records: number;
  imported: number;
  duplicates: number;
  errors: number;
  status: 'success' | 'partial' | 'error';
}

const MOCK_HISTORY: ImportRecord[] = [
  { id: '1', date: '2026-04-07T10:30:00Z', type: 'CSV', records: 25, imported: 22, duplicates: 3, errors: 0, status: 'success' },
  { id: '2', date: '2026-04-05T14:15:00Z', type: 'Phantombuster', records: 48, imported: 41, duplicates: 5, errors: 2, status: 'partial' },
  { id: '3', date: '2026-04-03T09:00:00Z', type: 'CSV', records: 12, imported: 12, duplicates: 0, errors: 0, status: 'success' },
  { id: '4', date: '2026-04-01T16:45:00Z', type: 'Phantombuster', records: 33, imported: 30, duplicates: 3, errors: 0, status: 'success' },
  { id: '5', date: '2026-03-28T11:20:00Z', type: 'CSV', records: 8, imported: 6, duplicates: 1, errors: 1, status: 'partial' },
];

const APP_FIELDS = [
  { key: 'linkedinUrl', label: 'LinkedIn URL', required: true },
  { key: 'firstName', label: 'Voornaam', required: false },
  { key: 'lastName', label: 'Achternaam', required: false },
  { key: 'title', label: 'Functie', required: false },
  { key: 'company', label: 'Bedrijf', required: false },
  { key: 'email', label: 'E-mail', required: false },
  { key: 'phone', label: 'Telefoon', required: false },
  { key: 'domain', label: 'Domein tag', required: false },
  { key: 'notes', label: 'Notities', required: false },
  { key: '_skip', label: '— Overslaan —', required: false },
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

export default function ImportPage() {
  const { contacts, addContact } = useStore();
  const [csvData, setCsvData] = useState<string[][] | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<number, string>>({});
  const [importResult, setImportResult] = useState<{ imported: number; duplicates: number; errors: number } | null>(null);
  const [phantomData, setPhantomData] = useState<string[][] | null>(null);
  const [phantomHeaders, setPhantomHeaders] = useState<string[]>([]);
  const [phantomResult, setPhantomResult] = useState<{ newContacts: number; updated: number; newSignals: number } | null>(null);
  const [dragActive, setDragActive] = useState<'csv' | 'phantom' | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const phantomRef = useRef<HTMLInputElement>(null);
  const webhookUrl = 'https://n8n.rubey.be/webhook/phantombuster-signals';

  const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
    return { headers, rows };
  };

  const handleCSVFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers, rows } = parseCSV(e.target?.result as string);
      setCsvHeaders(headers);
      setCsvData(rows);
      setImportResult(null);
      // Auto-map columns
      const mapping: Record<number, string> = {};
      headers.forEach((h, i) => {
        const lower = h.toLowerCase();
        if (lower.includes('linkedin')) mapping[i] = 'linkedinUrl';
        else if (lower.includes('voornaam') || lower === 'firstname' || lower === 'first_name') mapping[i] = 'firstName';
        else if (lower.includes('achternaam') || lower === 'lastname' || lower === 'last_name') mapping[i] = 'lastName';
        else if (lower.includes('functie') || lower === 'title' || lower === 'headline') mapping[i] = 'title';
        else if (lower.includes('bedrijf') || lower === 'company') mapping[i] = 'company';
        else if (lower.includes('email') || lower.includes('e-mail')) mapping[i] = 'email';
        else if (lower.includes('telefoon') || lower === 'phone') mapping[i] = 'phone';
        else if (lower.includes('domein') || lower === 'domain') mapping[i] = 'domain';
        else if (lower.includes('notities') || lower === 'notes') mapping[i] = 'notes';
      });
      setColumnMapping(mapping);
    };
    reader.readAsText(file);
  }, []);

  const handlePhantomFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers, rows } = parseCSV(e.target?.result as string);
      setPhantomHeaders(headers);
      setPhantomData(rows);
      setPhantomResult(null);
      // Simulate detection
      const existingUrls = new Set(contacts.map(c => c.linkedinUrl));
      let newC = 0, updated = 0;
      rows.forEach(row => {
        const urlIdx = headers.findIndex(h => h.toLowerCase().includes('profileurl') || h.toLowerCase().includes('linkedin'));
        if (urlIdx >= 0 && row[urlIdx]) {
          const url = row[urlIdx].toLowerCase().replace(/\/$/, '');
          if (existingUrls.has(url)) updated++;
          else newC++;
        }
      });
      setPhantomResult({ newContacts: newC, updated, newSignals: Math.floor(rows.length * 1.5) });
    };
    reader.readAsText(file);
  }, [contacts]);

  const handleDrop = useCallback((e: React.DragEvent, target: 'csv' | 'phantom') => {
    e.preventDefault();
    setDragActive(null);
    const file = e.dataTransfer.files[0];
    if (file) target === 'csv' ? handleCSVFile(file) : handlePhantomFile(file);
  }, [handleCSVFile, handlePhantomFile]);

  const doImport = () => {
    if (!csvData) return;
    const linkedinIdx = Object.entries(columnMapping).find(([, v]) => v === 'linkedinUrl');
    if (!linkedinIdx) return;

    let imported = 0, duplicates = 0, errors = 0;
    const existingUrls = new Set(contacts.map(c => c.linkedinUrl));

    csvData.forEach(row => {
      try {
        const url = row[Number(linkedinIdx[0])]?.toLowerCase().replace(/\/$/, '').replace(/\?.*$/, '');
        if (!url) { errors++; return; }
        if (existingUrls.has(url)) { duplicates++; return; }

        const getVal = (field: string) => {
          const idx = Object.entries(columnMapping).find(([, v]) => v === field);
          return idx ? row[Number(idx[0])] || null : null;
        };

        addContact({
          id: `import-${Date.now()}-${imported}`,
          linkedinUrl: url,
          firstName: getVal('firstName') || 'Onbekend',
          lastName: getVal('lastName') || '',
          title: getVal('title'),
          company: getVal('company'),
          email: getVal('email'),
          phone: getVal('phone'),
          location: null,
          source: 'import',
          addedAt: new Date().toISOString(),
          domains: {
            kunst: { signalCount: 0, lastSignalAt: null, weightedScore: 0 },
            beleggen: { signalCount: 0, lastSignalAt: null, weightedScore: 0 },
            luxe: { signalCount: 0, lastSignalAt: null, weightedScore: 0 },
          },
          activeDomainCount: 0,
          totalScore: 0,
          status: 'cold',
          isEnriched: false,
          enrichedAt: null,
          lemlistCampaignId: null,
          lemlistPushedAt: null,
          lastContactedAt: null,
          notes: getVal('notes') || '',
          engagementScore: 0,
          keywordScore: 0,
          crossSignalScore: 0,
          enrichmentScore: 0,
          diversityScore: 0,
        });
        existingUrls.add(url);
        imported++;
      } catch { errors++; }
    });
    setImportResult({ imported, duplicates, errors });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Import</h1>
        <p className="text-xs text-muted-foreground">Importeer leads en organisaties vanuit externe bronnen</p>
      </div>

      {/* CSV Import */}
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">CSV Import</h3>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDragActive('csv'); }}
            onDragLeave={() => setDragActive(null)}
            onDrop={e => handleDrop(e, 'csv')}
            onClick={() => csvRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragActive === 'csv' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
            }`}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Sleep een CSV-bestand hierheen of klik om te uploaden</p>
            <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleCSVFile(e.target.files[0])} />
          </div>

          {csvData && (
            <>
              {/* Preview */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Preview (eerste 5 rijen van {csvData.length})</p>
                <div className="overflow-x-auto rounded border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {csvHeaders.map((h, i) => <TableHead key={i} className="text-xs whitespace-nowrap">{h}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 5).map((row, ri) => (
                        <TableRow key={ri}>
                          {row.map((cell, ci) => <TableCell key={ci} className="text-xs py-2">{cell}</TableCell>)}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Column mapping */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Kolom-mapping</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {csvHeaders.map((h, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-[10px] text-muted-foreground truncate">{h}</p>
                      <Select value={columnMapping[i] || '_skip'} onValueChange={v => setColumnMapping(prev => ({ ...prev, [i]: v }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {APP_FIELDS.map(f => (
                            <SelectItem key={f.key} value={f.key} className="text-xs">
                              {f.label}{f.required ? ' *' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button size="sm" onClick={doImport} disabled={!Object.values(columnMapping).includes('linkedinUrl')}>
                  Importeer {csvData.length} contacten
                </Button>
                {!Object.values(columnMapping).includes('linkedinUrl') && (
                  <p className="text-[10px] text-destructive">LinkedIn URL mapping is verplicht</p>
                )}
              </div>

              {importResult && (
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1 text-green-400"><CheckCircle className="h-3 w-3" />{importResult.imported} geïmporteerd</span>
                  <span className="flex items-center gap-1 text-yellow-400"><AlertTriangle className="h-3 w-3" />{importResult.duplicates} duplicaten</span>
                  {importResult.errors > 0 && <span className="flex items-center gap-1 text-destructive"><XCircle className="h-3 w-3" />{importResult.errors} fouten</span>}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Phantombuster Import */}
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Phantombuster Import</h3>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Webhook URL voor n8n koppeling:</p>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="h-8 text-xs font-mono bg-muted" />
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(webhookUrl)}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Phantombuster stuurt signalen automatisch via n8n naar deze app. Configureer je n8n workflow om data naar bovenstaande webhook te sturen.</p>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground mb-2">Manuele Phantombuster CSV import:</p>
            <div
              onDragOver={e => { e.preventDefault(); setDragActive('phantom'); }}
              onDragLeave={() => setDragActive(null)}
              onDrop={e => handleDrop(e, 'phantom')}
              onClick={() => phantomRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragActive === 'phantom' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
              }`}
            >
              <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Sleep een Phantombuster CSV export hierheen</p>
              <input ref={phantomRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handlePhantomFile(e.target.files[0])} />
            </div>
          </div>

          {phantomData && phantomResult && (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {phantomHeaders.slice(0, 6).map((h, i) => <TableHead key={i} className="text-xs whitespace-nowrap">{h}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {phantomData.slice(0, 3).map((row, ri) => (
                      <TableRow key={ri}>
                        {row.slice(0, 6).map((cell, ci) => <TableCell key={ci} className="text-xs py-2">{cell}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-green-400">{phantomResult.newContacts} nieuwe contacten</span>
                <span className="text-blue-400">{phantomResult.updated} bestaande bijgewerkt</span>
                <span className="text-primary">{phantomResult.newSignals} nieuwe signalen</span>
              </div>
              <Button size="sm">Importeer Phantombuster data</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import geschiedenis */}
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Import geschiedenis</h3>
          <div className="overflow-x-auto rounded border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Datum</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Records</TableHead>
                  <TableHead className="text-xs">Geïmporteerd</TableHead>
                  <TableHead className="text-xs">Duplicaten</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_HISTORY.map(h => (
                  <TableRow key={h.id}>
                    <TableCell className="text-xs">{relativeTime(h.date)}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{h.type}</Badge></TableCell>
                    <TableCell className="text-xs">{h.records}</TableCell>
                    <TableCell className="text-xs">{h.imported}</TableCell>
                    <TableCell className="text-xs">{h.duplicates}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${
                        h.status === 'success' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        h.status === 'partial' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-destructive/20 text-destructive border-destructive/30'
                      }`}>
                        {h.status === 'success' ? 'Succes' : h.status === 'partial' ? 'Gedeeltelijk' : 'Fout'}
                      </Badge>
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

function Activity(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </svg>
  );
}
