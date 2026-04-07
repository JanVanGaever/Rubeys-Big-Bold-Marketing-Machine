import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Search, Plus, X, ExternalLink, Mail, Phone, CheckCircle2, Send, Heart, MessageCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ALL_DOMAINS, DOMAIN_META } from '@/types';
import type { Contact } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusColors: Record<Contact['status'], string> = { hot: 'bg-red-500', warm: 'bg-amber-500', cold: 'bg-muted-foreground/40' };

export default function ContactsPage() {
  const { contacts, signals, settings, addContact, updateContact } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sort, setSort] = useState<string>('score');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    let list = contacts;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || (c.company ?? '').toLowerCase().includes(q) || (c.title ?? '').toLowerCase().includes(q));
    }
    if (statusFilter === 'manual') list = list.filter(c => c.source === 'manual');
    else if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter);
    const sorted = [...list];
    if (sort === 'score') sorted.sort((a, b) => b.totalScore - a.totalScore);
    else if (sort === 'recent') sorted.sort((a, b) => {
      const la = ALL_DOMAINS.map(d => a.domains[d].lastSignalAt).filter(Boolean).sort().reverse()[0] ?? '';
      const lb = ALL_DOMAINS.map(d => b.domains[d].lastSignalAt).filter(Boolean).sort().reverse()[0] ?? '';
      return lb.localeCompare(la);
    });
    else sorted.sort((a, b) => a.lastName.localeCompare(b.lastName));
    return sorted;
  }, [contacts, search, statusFilter, sort]);

  const selected = contacts.find(c => c.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacten</h1>
          <p className="text-xs text-muted-foreground">{contacts.length} leads in database</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1 text-xs"><Plus className="h-3.5 w-3.5" />Prospect toevoegen</Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Zoek naam, bedrijf, titel..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-xs" />
        </div>
        <div className="flex gap-1">
          {[{ key: 'all', label: 'Alle' }, { key: 'hot', label: 'Hot' }, { key: 'warm', label: 'Warm' }, { key: 'cold', label: 'Cold' }, { key: 'manual', label: 'Manueel' }].map(f => (
            <Button key={f.key} size="sm" variant={statusFilter === f.key ? 'default' : 'outline'} className="text-xs h-8" onClick={() => setStatusFilter(f.key)}>{f.label}</Button>
          ))}
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-44 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Score (hoog-laag)</SelectItem>
            <SelectItem value="recent">Recentste signaal</SelectItem>
            <SelectItem value="name">Naam A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-3 font-medium w-8"></th>
                <th className="text-left p-3 font-medium">Naam</th>
                <th className="text-left p-3 font-medium">Titel & Bedrijf</th>
                <th className="text-center p-3 font-medium">Domeinen</th>
                <th className="text-center p-3 font-medium">Score</th>
                <th className="text-right p-3 font-medium">Laatste signaal</th>
                <th className="text-center p-3 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelectedId(c.id)}>
                  <td className="p-3"><div className={`w-2 h-2 rounded-full ${statusColors[c.status]}`} /></td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center shrink-0"><span className="text-[10px] font-semibold">{c.firstName[0]}{c.lastName[0]}</span></div>
                      <span className="font-medium text-foreground">{c.firstName} {c.lastName}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{c.title}{c.company ? ` — ${c.company}` : ''}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-1">
                      {ALL_DOMAINS.map(d => (<div key={d} className="w-2.5 h-2.5 rounded-full" style={{ background: settings.domainConfig[d].color, opacity: c.domains[d].signalCount > 0 ? 1 : 0.15 }} />))}
                    </div>
                  </td>
                  <td className="p-3 text-center font-semibold text-foreground">{c.totalScore}</td>
                  <td className="p-3 text-right text-muted-foreground">
                    {(() => { const last = ALL_DOMAINS.map(d => c.domains[d].lastSignalAt).filter(Boolean).sort().reverse()[0]; return last ? formatDistanceToNow(new Date(last), { addSuffix: true, locale: nl }) : '—'; })()}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {c.isEnriched && <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />}
                      {c.lemlistCampaignId && <Send className="h-3.5 w-3.5 text-blue-400" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Detail sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelectedId(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px] bg-card border-border overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="space-y-3 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center"><span className="text-lg font-bold">{selected.firstName[0]}{selected.lastName[0]}</span></div>
                  <div>
                    <SheetTitle className="text-foreground">{selected.firstName} {selected.lastName}</SheetTitle>
                    <p className="text-xs text-muted-foreground">{selected.title} — {selected.company}</p>
                  </div>
                </div>
              </SheetHeader>
              <div className="space-y-6 text-xs">
                <div className="space-y-2">
                  {selected.linkedinUrl && <a href={`https://${selected.linkedinUrl}`} target="_blank" rel="noopener" className="flex items-center gap-2 text-blue-400 hover:underline"><ExternalLink className="h-3 w-3" />{selected.linkedinUrl}</a>}
                  {selected.email && <p className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3 w-3" />{selected.email}</p>}
                  {selected.phone && <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3 w-3" />{selected.phone}</p>}
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground text-sm">Domein scores</h3>
                  {ALL_DOMAINS.map(d => {
                    const dp = selected.domains[d];
                    const meta = settings.domainConfig[d];
                    return (
                      <div key={d} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: meta.color }} /><span className="text-foreground">{meta.name}</span></div>
                          <span className="font-semibold text-foreground">{dp.weightedScore} pts</span>
                        </div>
                        <p className="text-muted-foreground pl-4">{dp.signalCount} signalen</p>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="font-semibold text-foreground">Totaal</span>
                    <span className="text-lg font-bold text-foreground">{selected.totalScore}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground text-sm">Signaal tijdlijn</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {signals.filter(s => s.contactLinkedinUrl === selected.linkedinUrl).sort((a, b) => b.detectedAt.localeCompare(a.detectedAt)).map(s => (
                      <div key={s.id} className="flex items-start gap-2 p-2 rounded bg-muted/30">
                        <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: settings.domainConfig[s.domain].color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground">{s.engagementType === 'like' ? '❤️' : '💬'} {s.orgName}</p>
                          {s.commentText && <p className="text-muted-foreground truncate">{s.commentText}</p>}
                          <p className="text-muted-foreground/60">{formatDistanceToNow(new Date(s.detectedAt), { addSuffix: true, locale: nl })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs flex-1">Verrijk via Apollo</Button>
                  <Button size="sm" className="text-xs flex-1">Push naar Lemlist</Button>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground text-sm">Notities</h3>
                  <Textarea value={selected.notes} onChange={e => updateContact(selected.id, { notes: e.target.value })} className="text-xs min-h-[80px]" placeholder="Voeg notities toe..." />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add dialog */}
      <AddContactDialog open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}

function AddContactDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addContact } = useStore();
  const [form, setForm] = useState({ linkedinUrl: '', firstName: '', lastName: '', title: '', company: '', domains: { kunst: false, beleggen: false, luxe: false } as Record<string, boolean>, notes: '' });

  const handleSave = () => {
    if (!form.linkedinUrl || !form.firstName || !form.lastName) return;
    const url = form.linkedinUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    const newContact: Contact = {
      id: `contact-${Date.now()}`, linkedinUrl: url, firstName: form.firstName, lastName: form.lastName,
      title: form.title || null, company: form.company || null, email: null, phone: null, location: null,
      source: 'manual', addedAt: new Date().toISOString(),
      domains: {
        kunst: { signalCount: form.domains.kunst ? 1 : 0, lastSignalAt: form.domains.kunst ? new Date().toISOString() : null, weightedScore: form.domains.kunst ? 3 : 0 },
        beleggen: { signalCount: form.domains.beleggen ? 1 : 0, lastSignalAt: form.domains.beleggen ? new Date().toISOString() : null, weightedScore: form.domains.beleggen ? 3 : 0 },
        luxe: { signalCount: form.domains.luxe ? 1 : 0, lastSignalAt: form.domains.luxe ? new Date().toISOString() : null, weightedScore: form.domains.luxe ? 3 : 0 },
      },
      activeDomainCount: 0, totalScore: 0, status: 'cold',
      isEnriched: false, enrichedAt: null, lemlistCampaignId: null, lemlistPushedAt: null, lastContactedAt: null, notes: form.notes,
    };
    addContact(newContact);
    setForm({ linkedinUrl: '', firstName: '', lastName: '', title: '', company: '', domains: { kunst: false, beleggen: false, luxe: false }, notes: '' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader><DialogTitle className="text-foreground">Prospect toevoegen</DialogTitle></DialogHeader>
        <div className="space-y-3 text-xs">
          <div><Label className="text-xs">LinkedIn URL *</Label><Input value={form.linkedinUrl} onChange={e => setForm(p => ({ ...p, linkedinUrl: e.target.value }))} placeholder="https://linkedin.com/in/..." className="text-xs h-8 mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Voornaam *</Label><Input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} className="text-xs h-8 mt-1" /></div>
            <div><Label className="text-xs">Achternaam *</Label><Input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} className="text-xs h-8 mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Titel</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="text-xs h-8 mt-1" /></div>
            <div><Label className="text-xs">Bedrijf</Label><Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} className="text-xs h-8 mt-1" /></div>
          </div>
          <div>
            <Label className="text-xs">Domeinen</Label>
            <div className="flex gap-4 mt-2">
              {ALL_DOMAINS.map(d => (
                <label key={d} className="flex items-center gap-2 text-xs text-foreground">
                  <Checkbox checked={form.domains[d]} onCheckedChange={v => setForm(p => ({ ...p, domains: { ...p.domains, [d]: !!v } }))} />
                  {DOMAIN_META[d].name.split(' ')[0]}
                </label>
              ))}
            </div>
          </div>
          <div><Label className="text-xs">Notities</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="text-xs mt-1" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">Annuleren</Button>
          <Button size="sm" onClick={handleSave} className="text-xs">Opslaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
