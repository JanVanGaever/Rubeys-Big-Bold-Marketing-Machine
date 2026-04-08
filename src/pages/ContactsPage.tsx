import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Search,
  Plus,
  X,
  ExternalLink,
  Mail,
  Phone,
  CheckCircle2,
  Send,
  Users,
  Upload,
  Star,
  CheckSquare,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { getDomainColor, getDomainName } from "@/types";
import type { Contact } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const statusColors: Record<Contact["status"], string> = {
  hot: "bg-red-500",
  warm: "bg-amber-500",
  cold: "bg-muted-foreground/40",
};

function ScoreBar({ label, score, weight }: { label: string; score: number; weight: number }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{score}/100</span>
          <span className="text-muted-foreground/60">({weight}%)</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const { contacts, signals, settings, addContact, updateContact, toggleCustomer } = useStore();
  const domainDefs = settings.domains ?? [];
  const domainIds = domainDefs.map(d => d.id);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sort, setSort] = useState<string>("score");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = contacts;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          (c.company ?? "").toLowerCase().includes(q) ||
          (c.title ?? "").toLowerCase().includes(q),
      );
    }
    
    else if (statusFilter === "klanten") list = list.filter((c) => c.isCustomer);
    else if (statusFilter !== "all") list = list.filter((c) => c.status === statusFilter);
    const sorted = [...list];
    if (sort === "score") sorted.sort((a, b) => b.totalScore - a.totalScore);
    else if (sort === "recent")
      sorted.sort((a, b) => {
        const la =
          domainIds.map((d) => a.domains[d]?.lastSignalAt)
            .filter(Boolean)
            .sort()
            .reverse()[0] ?? "";
        const lb =
          domainIds.map((d) => b.domains[d]?.lastSignalAt)
            .filter(Boolean)
            .sort()
            .reverse()[0] ?? "";
        return lb.localeCompare(la);
      });
    else sorted.sort((a, b) => a.lastName.localeCompare(b.lastName));
    return sorted;
  }, [contacts, search, statusFilter, sort]);

  const selected = contacts.find((c) => c.id === selectedId) ?? null;
  const w = settings.scoreWeights;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkTag = (isCustomer: boolean) => {
    selectedIds.forEach((id) => {
      const c = contacts.find((ct) => ct.id === id);
      if (c && c.isCustomer !== isCustomer) toggleCustomer(id);
    });
    toast.success(`${selectedIds.size} contacten ${isCustomer ? "getagd als klant" : "klant-tag verwijderd"}`);
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacten</h1>
          <p className="text-xs text-muted-foreground">{contacts.length} leads in database</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={selectMode ? "default" : "outline"}
            onClick={() => {
              setSelectMode(!selectMode);
              setSelectedIds(new Set());
            }}
            className="gap-1 text-xs"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            {selectMode ? "Annuleer" : "Selecteer"}
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Prospect toevoegen
          </Button>
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Nog geen contacten. Importeer je eerste leads via de Import pagina.
          </p>
          <Button onClick={() => navigate("/import")} className="gap-2">
            <Upload className="h-4 w-4" />
            Ga naar Import
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Zoek naam, bedrijf, titel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {[
                { key: "all", label: "Alle" },
                { key: "hot", label: "Hot" },
                { key: "warm", label: "Warm" },
                { key: "cold", label: "Cold" },
                { key: "klanten", label: "Klanten" },
                
              ].map((f) => (
                <Button
                  key={f.key}
                  size="sm"
                  variant={statusFilter === f.key ? "default" : "outline"}
                  className="text-xs h-8"
                  onClick={() => setStatusFilter(f.key)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-44 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
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
                    {selectMode && <th className="p-3 w-8"></th>}
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
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => (selectMode ? toggleSelect(c.id) : setSelectedId(c.id))}
                    >
                      {selectMode && (
                        <td className="p-3">
                          <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} />
                        </td>
                      )}
                      <td className="p-3">
                        <div className={`w-2 h-2 rounded-full ${statusColors[c.status]}`} />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-semibold">
                              {c.firstName[0]}
                              {c.lastName[0]}
                            </span>
                          </div>
                          <span className="font-medium text-foreground">
                            {c.firstName} {c.lastName}
                          </span>
                          {c.isCustomer && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />}
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {c.title}
                        {c.company ? ` — ${c.company}` : ""}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          {domainDefs.map((dd) => (
                            <div
                              key={dd.id}
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                background: dd.color,
                                opacity: (c.domains[dd.id]?.signalCount ?? 0) > 0 ? 1 : 0.15,
                              }}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-center font-semibold text-foreground">{c.totalScore}</td>
                      <td className="p-3 text-right text-muted-foreground">
                        {(() => {
                          const last = domainIds.map((d) => c.domains[d]?.lastSignalAt)
                            .filter(Boolean)
                            .sort()
                            .reverse()[0];
                          return last ? formatDistanceToNow(new Date(last), { addSuffix: true, locale: nl }) : "—";
                        })()}
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

          {/* Multi-select action bar */}
          {selectMode && selectedIds.size > 0 && (
            <div className="sticky bottom-0 bg-card border-t border-border p-3 flex items-center gap-3 rounded-t-lg">
              <span className="text-xs text-foreground font-medium">{selectedIds.size} geselecteerd</span>
              <Button size="sm" className="text-xs gap-1" onClick={() => handleBulkTag(true)}>
                <Star className="h-3 w-3" />
                Tag als klant
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => handleBulkTag(false)}>
                Verwijder klant-tag
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={() => {
                  setSelectMode(false);
                  setSelectedIds(new Set());
                }}
              >
                Annuleer
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelectedId(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px] bg-card border-border overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="space-y-3 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-lg font-bold">
                      {selected.firstName[0]}
                      {selected.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <SheetTitle className="text-foreground">
                      {selected.firstName} {selected.lastName}
                    </SheetTitle>
                    <p className="text-xs text-muted-foreground">
                      {selected.title} — {selected.company}
                    </p>
                  </div>
                </div>
                {/* Customer toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <Label className="text-xs font-medium text-foreground">Bestaande klant</Label>
                    {selected.isCustomer && selected.customerSince && (
                      <p className="text-[10px] text-muted-foreground">
                        Klant sinds {new Date(selected.customerSince).toLocaleDateString("nl-BE")}
                      </p>
                    )}
                  </div>
                  <Switch checked={selected.isCustomer} onCheckedChange={() => toggleCustomer(selected.id)} />
                </div>
              </SheetHeader>
              <div className="space-y-6 text-xs">
                <div className="space-y-2">
                  {selected.linkedinUrl && (
                    <a
                      href={`https://${selected.linkedinUrl}`}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-2 text-blue-400 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {selected.linkedinUrl}
                    </a>
                  )}
                  {selected.email && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {selected.email}
                    </p>
                  )}
                  {selected.phone && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {selected.phone}
                    </p>
                  )}
                </div>

                {/* Domain presence */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground text-sm">Domein scores</h3>
                  {domainDefs.map((dd) => {
                    const dp = selected.domains[dd.id] ?? { signalCount: 0 };
                    return (
                      <div key={dd.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: dd.color }} />
                            <span className="text-foreground">{dd.name}</span>
                          </div>
                          <span className="text-muted-foreground">{dp.signalCount} signalen</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Score breakdown */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground text-sm">Score breakdown</h3>
                  <div className="space-y-2">
                    <ScoreBar label="Engagement" score={selected.engagementScore} weight={w.engagement} />
                    <ScoreBar label="Keywords" score={selected.keywordScore} weight={w.profileKeywords} />
                    <ScoreBar label="Cross-signaal" score={selected.crossSignalScore} weight={w.crossSignal} />
                    <ScoreBar label="Enrichment" score={selected.enrichmentScore} weight={w.enrichment} />
                    <ScoreBar label="Diversiteit" score={selected.diversityScore} weight={w.orgDiversity} />
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="font-semibold text-foreground">Totaal</span>
                    <span className="text-lg font-bold text-foreground">{selected.totalScore}/100</span>
                  </div>
                  {(() => {
                    const wSum = w.engagement + w.profileKeywords + w.crossSignal + w.enrichment + w.orgDiversity;
                    return (
                      <p className="text-[10px] text-muted-foreground font-mono">
                        ({selected.engagementScore}×{(w.engagement / wSum).toFixed(2)}) + ({selected.keywordScore}×
                        {(w.profileKeywords / wSum).toFixed(2)}) + ({selected.crossSignalScore}×
                        {(w.crossSignal / wSum).toFixed(2)}) + ({selected.enrichmentScore}×
                        {(w.enrichment / wSum).toFixed(2)}) + ({selected.diversityScore}×
                        {(w.orgDiversity / wSum).toFixed(2)}) = {selected.totalScore}
                      </p>
                    );
                  })()}
                </div>

                {/* Signal timeline */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground text-sm">Signaal tijdlijn</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {signals
                      .filter((s) => s.contactLinkedinUrl === selected.linkedinUrl)
                      .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))
                      .map((s) => (
                        <div key={s.id} className="flex items-start gap-2 p-2 rounded bg-muted/30">
                          <div
                            className="w-2 h-2 rounded-full mt-1 shrink-0"
                            style={{ background: getDomainColor(domainDefs, s.domain) }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground">
                              {s.engagementType === "like" ? "❤️" : "💬"} {s.orgName}
                            </p>
                            {s.commentText && <p className="text-muted-foreground truncate">{s.commentText}</p>}
                            <p className="text-muted-foreground/60">
                              {formatDistanceToNow(new Date(s.detectedAt), { addSuffix: true, locale: nl })}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs flex-1">
                    Verrijk via Apollo
                  </Button>
                  <Button size="sm" className="text-xs flex-1">
                    Push naar Lemlist
                  </Button>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground text-sm">Notities</h3>
                  <Textarea
                    value={selected.notes}
                    onChange={(e) => updateContact(selected.id, { notes: e.target.value })}
                    className="text-xs min-h-[80px]"
                    placeholder="Voeg notities toe..."
                  />
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
  const { settings, addContact } = useStore();
  const domainDefs = settings.domains ?? [];
  const [form, setForm] = useState({
    linkedinUrl: "",
    firstName: "",
    lastName: "",
    title: "",
    company: "",
    domains: Object.fromEntries(domainDefs.map(d => [d.id, false])) as Record<string, boolean>,
    notes: "",
  });

  const handleSave = () => {
    if (!form.linkedinUrl || !form.firstName || !form.lastName) return;
    const url = form.linkedinUrl
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "")
      .toLowerCase();
    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      linkedinUrl: url,
      firstName: form.firstName,
      lastName: form.lastName,
      title: form.title || null,
      company: form.company || null,
      email: null,
      phone: null,
      location: null,
      source: "manual",
      addedAt: new Date().toISOString(),
      domains: Object.fromEntries(domainDefs.map(d => [d.id, {
        signalCount: form.domains[d.id] ? 1 : 0,
        lastSignalAt: form.domains[d.id] ? new Date().toISOString() : null,
        weightedScore: form.domains[d.id] ? 3 : 0,
      }])),
      activeDomainCount: 0,
      totalScore: 0,
      status: "cold",
      isEnriched: false,
      enrichedAt: null,
      lemlistCampaignId: null,
      lemlistPushedAt: null,
      lastContactedAt: null,
      notes: form.notes,
      engagementScore: 0,
      keywordScore: 0,
      crossSignalScore: 0,
      enrichmentScore: 0,
      diversityScore: 0,
      previousScore: null,
      scoreChangedAt: null,
      isCustomer: false,
      customerSince: null,
    };
    addContact(newContact);
    setForm({
      linkedinUrl: "",
      firstName: "",
      lastName: "",
      title: "",
      company: "",
      domains: Object.fromEntries(domainDefs.map(d => [d.id, false])),
      notes: "",
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Prospect toevoegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <div>
            <Label className="text-xs">LinkedIn URL *</Label>
            <Input
              value={form.linkedinUrl}
              onChange={(e) => setForm((p) => ({ ...p, linkedinUrl: e.target.value }))}
              placeholder="https://linkedin.com/in/..."
              className="text-xs h-8 mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Voornaam *</Label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                className="text-xs h-8 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Achternaam *</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                className="text-xs h-8 mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Titel</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="text-xs h-8 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Bedrijf</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                className="text-xs h-8 mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Domeinen</Label>
            <div className="flex gap-4 mt-2">
              {domainDefs.map((dd) => (
                <label key={dd.id} className="flex items-center gap-2 text-xs text-foreground">
                  <Checkbox
                    checked={form.domains[dd.id]}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, domains: { ...p.domains, [dd.id]: !!v } }))}
                  />
                  {dd.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Notities</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              className="text-xs mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Annuleren
          </Button>
          <Button size="sm" onClick={handleSave} className="text-xs">
            Toevoegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
