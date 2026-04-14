import { useState, useCallback, useRef } from 'react';
import * as Papa from 'papaparse';
import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Copy, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { normalizeLinkedInUrl } from '@/lib/normalize';
import ConnectionAlert from '@/components/ConnectionAlert';
import { useConnectionStore } from '@/stores/connectionStore';

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
  const { contacts, addContact, updateContact, addSignal, watchlistOrgs, importHistory, addImportRecord, recomputeScores, settings } = useStore();
  const n8nConfig = useConnectionStore(s => s.connections.find(c => c.id === 'n8n')?.config);
  const phantomConfig = useConnectionStore(s => s.connections.find(c => c.id === 'phantombuster')?.config);
  const n8nBaseUrl = n8nConfig?.webhookUrl?.replace(/\/$/, '') || '';
  const webhookUrl = n8nBaseUrl ? `${n8nBaseUrl}/phantombuster-signals` : 'Configureer eerst n8n in Setup';

  const [csvData, setCsvData] = useState<string[][] | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<number, string>>({});
  const [importResult, setImportResult] = useState<{ imported: number; duplicates: number; errors: number } | null>(null);
  const [isPhantomCsv, setIsPhantomCsv] = useState(false);
  const [phantomData, setPhantomData] = useState<string[][] | null>(null);
  const [phantomHeaders, setPhantomHeaders] = useState<string[]>([]);
  const [phantomResult, setPhantomResult] = useState<{ newContacts: number; updated: number; newSignals: number; skippedSignals: number } | null>(null);
  const [phantomImporting, setPhantomImporting] = useState(false);
  const [dragActive, setDragActive] = useState<'csv' | 'phantom' | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const phantomRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
    const result = Papa.parse(text, { header: false, skipEmptyLines: true });
    const data = result.data as string[][];
    if (data.length === 0) return { headers: [], rows: [] };
    const headers = data[0].map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = data.slice(1);
    return { headers, rows };
  };

  const handleCSVFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers, rows } = parseCSV(e.target?.result as string);
      setCsvHeaders(headers);
      setCsvData(rows);
      setImportResult(null);
      const mapping: Record<number, string> = {};
      // Detect if this is a Phantombuster CSV
      const lowerHeaders = headers.map(h => h.toLowerCase());
      const isPhantom = lowerHeaders.includes('profilelink') || lowerHeaders.includes('postsurl') || lowerHeaders.includes('hasliked');
      setIsPhantomCsv(isPhantom);

      headers.forEach((h, i) => {
        const lower = h.toLowerCase();
        // LinkedIn URL detection — including Phantombuster column names
        if (lower === 'profileurl' || lower === 'profile_url') mapping[i] = 'linkedinUrl';
        else if (lower === 'profilelink' && !mapping[i]) {
          // Only use profileLink if profileUrl isn't available
          if (!headers.some(hh => hh.toLowerCase() === 'profileurl')) mapping[i] = 'linkedinUrl';
        }
        else if (lower.includes('linkedin') && !lower.includes('company')) mapping[i] = 'linkedinUrl';
        else if (lower.includes('voornaam') || lower === 'firstname' || lower === 'first_name') mapping[i] = 'firstName';
        else if (lower.includes('achternaam') || lower === 'lastname' || lower === 'last_name') mapping[i] = 'lastName';
        else if (lower.includes('functie') || lower === 'title' || lower === 'headline' || lower === 'occupation') mapping[i] = 'title';
        else if (lower.includes('bedrijf') || lower === 'company' || lower === 'companyname' || lower === 'company_name') mapping[i] = 'company';
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
      setPhantomImporting(false);
    };
    reader.readAsText(file);
  }, []);

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
    const existingUrls = new Set(contacts.map(c => normalizeLinkedInUrl(c.linkedinUrl)));

    csvData.forEach(row => {
      try {
        const rawUrl = row[Number(linkedinIdx[0])]?.trim();
        if (!rawUrl) { errors++; return; }
        const url = normalizeLinkedInUrl(rawUrl);
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
          domains: Object.fromEntries(settings.domains.map(d => [d.id, { signalCount: 0, lastSignalAt: null, weightedScore: 0 }])),
          activeDomainCount: 0,
          totalScore: 0,
          status: 'cold',
          isEnriched: false,
          enrichedAt: null,
          lemlistCampaignId: null,
          lemlistPushedAt: null,
          lastContactedAt: null,
          notes: getVal('notes') || '',
          engagementScore: 0, keywordScore: 0, crossSignalScore: 0, enrichmentScore: 0, diversityScore: 0,
          previousScore: null, scoreChangedAt: null,
          isCustomer: false, customerSince: null,
          enrichmentSource: 'none', emailVerifiedByDropcontact: false, dropcontactEnrichedAt: null,
        });
        existingUrls.add(url);
        imported++;
      } catch { errors++; }
    });
    setImportResult({ imported, duplicates, errors });

    addImportRecord({
      id: `imp-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'CSV',
      records: csvData.length,
      imported,
      duplicates,
      errors,
      status: errors > 0 ? 'partial' : 'success',
    });
  };

  const doPhantomImport = () => {
    if (!phantomData || !phantomHeaders.length) return;
    setPhantomImporting(true);

    // Auto-detect column mapping
    const colMap: Record<string, number> = {};
    phantomHeaders.forEach((h, i) => {
      const lower = h.toLowerCase().trim();
      if (lower === 'profileurl' || lower === 'profile_url') colMap['profileUrl'] = i;
      else if (lower === 'profilelink') { if (colMap['profileUrl'] === undefined) colMap['profileUrl'] = i; }
      else if (lower === 'firstname' || lower === 'first_name') colMap['firstName'] = i;
      else if (lower === 'lastname' || lower === 'last_name') colMap['lastName'] = i;
      else if (lower === 'occupation' || lower === 'headline') colMap['headline'] = i;
      else if (lower === 'companyname' || lower === 'company_name' || lower === 'company') colMap['companyName'] = i;
      else if (lower === 'postsurl' || lower === 'posturl' || lower === 'post_url') colMap['postUrl'] = i;
      else if (lower === 'hasliked') colMap['hasLiked'] = i;
      else if (lower === 'hascommented') colMap['hasCommented'] = i;
      else if (lower === 'action') colMap['action'] = i;
      else if (lower === 'comments' || lower === 'commentcontent' || lower === 'comment_content' || lower === 'comment') colMap['commentContent'] = i;
      else if (lower === 'timestamp') colMap['timestamp'] = i;
    });

    let newContacts = 0, updated = 0, newSignals = 0, skippedSignals = 0;
    const existingUrls = new Set(contacts.map(c => normalizeLinkedInUrl(c.linkedinUrl)));
    const currentContacts = useStore.getState().contacts;

    phantomData.forEach(row => {
      // Prefer profileUrl (clean URL) over profileLink (may be encoded/ACoAA format)
      const rawProfileUrl = colMap['profileUrl'] !== undefined ? row[colMap['profileUrl']]?.trim() : null;
      if (!rawProfileUrl || !rawProfileUrl.includes('linkedin.com/in/')) return;
      const profileUrl = normalizeLinkedInUrl(rawProfileUrl);

      const firstName = colMap['firstName'] !== undefined ? row[colMap['firstName']] || 'Onbekend' : 'Onbekend';
      const lastName = colMap['lastName'] !== undefined ? row[colMap['lastName']] || '' : '';
      const headline = colMap['headline'] !== undefined ? row[colMap['headline']] || null : null;
      const companyName = colMap['companyName'] !== undefined ? row[colMap['companyName']] || null : null;

      // Create or find contact
      if (!existingUrls.has(profileUrl)) {
        addContact({
          id: `phantom-${Date.now()}-${newContacts}`,
          linkedinUrl: profileUrl,
          firstName,
          lastName,
          title: headline,
          company: companyName,
          email: null,
          phone: null,
          location: null,
          source: 'import',
          addedAt: new Date().toISOString(),
          domains: Object.fromEntries(settings.domains.map(d => [d.id, { signalCount: 0, lastSignalAt: null, weightedScore: 0 }])),
          activeDomainCount: 0,
          totalScore: 0,
          status: 'cold',
          isEnriched: false,
          enrichedAt: null,
          lemlistCampaignId: null,
          lemlistPushedAt: null,
          lastContactedAt: null,
          notes: '',
          engagementScore: 0, keywordScore: 0, crossSignalScore: 0, enrichmentScore: 0, diversityScore: 0,
          previousScore: null, scoreChangedAt: null,
          isCustomer: false, customerSince: null,
          enrichmentSource: 'none', emailVerifiedByDropcontact: false, dropcontactEnrichedAt: null,
        });
        existingUrls.add(profileUrl);
        newContacts++;
      } else {
        // Update existing contact if it has missing fields
        const existing = useStore.getState().contacts.find(c => normalizeLinkedInUrl(c.linkedinUrl) === profileUrl);
        if (existing) {
          const updates: Partial<typeof existing> = {};
          if ((!existing.title || existing.title === '') && headline) updates.title = headline;
          if ((!existing.company || existing.company === '') && companyName) updates.company = companyName;
          if (existing.firstName === 'Onbekend' && firstName !== 'Onbekend') updates.firstName = firstName;
          if ((!existing.lastName || existing.lastName === '') && lastName) updates.lastName = lastName;
          if (Object.keys(updates).length > 0) {
            updateContact(existing.id, updates);
            updated++;
          }
        }
      }

      // Try to create signals by matching postUrl(s) to watchlist orgs
      const rawPostUrl = colMap['postUrl'] !== undefined ? row[colMap['postUrl']]?.trim() : null;
      if (rawPostUrl) {
        // postsUrl can contain multiple URLs separated by ' | '
        const postUrls = rawPostUrl.split(' | ').map(u => u.trim()).filter(Boolean);

        // Determine engagement type from hasLiked/hasCommented or action
        let engagementType: 'like' | 'comment' = 'like';
        if (colMap['action'] !== undefined) {
          engagementType = row[colMap['action']]?.toLowerCase() === 'comment' ? 'comment' : 'like';
        } else if (colMap['hasCommented'] !== undefined && row[colMap['hasCommented']]?.toLowerCase() === 'true') {
          engagementType = 'comment';
        }

        const commentText = colMap['commentContent'] !== undefined ? row[colMap['commentContent']] || null : null;
        const timestamp = colMap['timestamp'] !== undefined ? row[colMap['timestamp']] : null;

        let matchedAny = false;
        for (const postUrl of postUrls) {
          // Extract org name from postUrl patterns
          const postMatch = postUrl.match(/\/posts\/([^_]+)/i) || postUrl.match(/\/company\/([^/]+)/i);
          const postOrgSlug = postMatch?.[1]?.toLowerCase();

          let matchedOrg = null;
          if (postOrgSlug) {
            matchedOrg = watchlistOrgs.find(o => {
              const nameSlug = o.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              const urlSlug = o.linkedinUrl.toLowerCase().split('/company/')[1]?.replace(/\//g, '') || '';
              return nameSlug === postOrgSlug || urlSlug === postOrgSlug;
            });
          }

          if (matchedOrg) {
            addSignal({
              id: `phantom-sig-${Date.now()}-${newSignals}`,
              contactLinkedinUrl: profileUrl,
              contactName: `${firstName} ${lastName}`,
              contactTitle: headline,
              orgId: matchedOrg.id,
              orgName: matchedOrg.name,
              domain: matchedOrg.domain,
              tier: matchedOrg.tier,
              engagementType,
              commentText,
              detectedAt: timestamp || new Date().toISOString(),
              postUrl,
            });
            newSignals++;
            matchedAny = true;
          }
        }
        if (!matchedAny) skippedSignals++;
      } else {
        skippedSignals++;
      }
    });

    recomputeScores();

    setPhantomResult({ newContacts, updated, newSignals, skippedSignals });

    addImportRecord({
      id: `imp-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'Phantombuster',
      records: phantomData.length,
      imported: newContacts,
      duplicates: updated,
      errors: skippedSignals,
      status: skippedSignals > 0 && newSignals === 0 ? 'error' : skippedSignals > 0 ? 'partial' : 'success',
    });

    // Update last signal timestamp
    useConnectionStore.getState().setConnectionConfig('phantombuster', {
      ...(useConnectionStore.getState().connections.find(c => c.id === 'phantombuster')?.config || {}),
      lastSignalReceivedAt: new Date().toISOString(),
    });

    toast.success(`Import voltooid: ${newContacts} nieuwe contacten, ${newSignals} signalen`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Import</h1>
        <p className="text-xs text-muted-foreground">Importeer leads en organisaties vanuit externe bronnen</p>
      </div>

      <ConnectionAlert connectionId="phantombuster" featureName="Phantombuster Import" />

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
              {isPhantomCsv && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <AlertTriangle className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-400">Dit lijkt een Phantombuster CSV</p>
                    <p className="text-[10px] text-blue-400/80">
                      Voor Phantombuster data kun je beter de <strong>Phantombuster Import</strong> sectie hieronder gebruiken. Die herkent automatisch alle kolommen en maakt ook signalen aan.
                    </p>
                  </div>
                </div>
              )}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ActivityIcon className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Phantombuster Import</h3>
            </div>
            <div>
              {phantomConfig?.phantomId ? (
                <Badge className="text-[9px] bg-emerald-500/15 text-emerald-400 border-emerald-500/20">Auto</Badge>
              ) : (
                <Badge className="text-[9px] bg-amber-500/15 text-amber-400 border-amber-500/20">Manueel</Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Webhook URL voor n8n koppeling:</p>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="h-8 text-xs font-mono bg-muted" />
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(webhookUrl)}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Phantombuster stuurt signalen automatisch via n8n naar deze app.</p>
          </div>

          {/* Auto-import status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
            <div>
              <p className="text-xs font-medium text-foreground">Automatische import</p>
              <p className="text-[10px] text-muted-foreground">
                {phantomConfig?.phantomId
                  ? `Phantom ${phantomConfig.phantomId} stuurt signalen automatisch via n8n. Frequentie: ${phantomConfig.scrapeFrequency === 'daily' ? 'dagelijks' : phantomConfig.scrapeFrequency === 'weekly' ? 'wekelijks' : 'manueel'}.`
                  : 'Configureer een Phantom ID in Setup om signalen automatisch te ontvangen.'}
              </p>
            </div>
            {phantomConfig?.phantomId ? (
              <Badge className="text-[9px] bg-emerald-500/15 text-emerald-400 border-emerald-500/20 shrink-0">Actief</Badge>
            ) : (
              <Badge className="text-[9px] bg-muted text-muted-foreground border-border shrink-0">Niet geconfigureerd</Badge>
            )}
          </div>

          {phantomConfig?.lastSignalReceivedAt && (
            <p className="text-[10px] text-muted-foreground">
              Laatste signalen ontvangen: {relativeTime(phantomConfig.lastSignalReceivedAt)}
            </p>
          )}

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

          {phantomData && (
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
              {phantomResult && (
                <div className="space-y-2">
                  <div className="flex gap-3 text-xs flex-wrap">
                    <span className="text-green-400">{phantomResult.newContacts} nieuwe contacten</span>
                    <span className="text-blue-400">{phantomResult.updated} bestaande contacten bijgewerkt</span>
                    <span className="text-primary">{phantomResult.newSignals} nieuwe signalen aangemaakt</span>
                    {phantomResult.skippedSignals > 0 && <span className="text-muted-foreground">{phantomResult.skippedSignals} signalen overgeslagen (geen org match)</span>}
                  </div>
                  {phantomResult.skippedSignals > 0 && phantomResult.skippedSignals > (phantomResult.newSignals + phantomResult.skippedSignals) / 2 && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-yellow-400">
                        Meer dan de helft van de signalen kon niet gematcht worden aan een watchlist-organisatie. Controleer of de organisatienamen in je watchlist overeenkomen met de LinkedIn company slugs.
                      </p>
                    </div>
                  )}
                </div>
              )}
              {!phantomImporting && (
                <Button size="sm" onClick={doPhantomImport}>Importeer Phantombuster data</Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import geschiedenis */}
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Import geschiedenis</h3>
          {importHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Inbox className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nog geen imports uitgevoerd.</p>
            </div>
          ) : (
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
                  {importHistory.map(h => (
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
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ActivityIcon(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </svg>
  );
}
