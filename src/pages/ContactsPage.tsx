import { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
  Settings2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  MapPin,
  Globe,
  Save,
  RotateCcw,
  Maximize2,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { getDomainColor, getDomainName } from "@/types";
import type { Contact } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ScorePopover from "@/components/ScorePopover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { normalizeLinkedInUrl } from "@/lib/normalize";

/* ───── Column definitions ───── */
interface ColumnDef {
  id: string;
  label: string;
  defaultVisible: boolean;
  align?: 'left' | 'center' | 'right';
  defaultWidth?: number;
}

const ALL_COLUMNS: ColumnDef[] = [
  { id: 'status', label: 'Status', defaultVisible: true, align: 'center', defaultWidth: 50 },
  { id: 'name', label: 'Naam', defaultVisible: true, defaultWidth: 180 },
  { id: 'title', label: 'Titel', defaultVisible: true, defaultWidth: 200 },
  { id: 'company', label: 'Bedrijf', defaultVisible: true, defaultWidth: 150 },
  { id: 'linkedinUrl', label: 'LinkedIn (persoon)', defaultVisible: false, defaultWidth: 180 },
  { id: 'companyLinkedinUrl', label: 'LinkedIn (bedrijf)', defaultVisible: false, defaultWidth: 180 },
  { id: 'email', label: 'E-mail', defaultVisible: false, defaultWidth: 200 },
  { id: 'phone', label: 'Telefoon', defaultVisible: false, defaultWidth: 130 },
  { id: 'location', label: 'Locatie', defaultVisible: false, defaultWidth: 130 },
  { id: 'source', label: 'Bron', defaultVisible: false, defaultWidth: 80 },
  { id: 'domains', label: 'Domeinen', defaultVisible: true, align: 'center', defaultWidth: 80 },
  { id: 'score', label: 'Score', defaultVisible: true, align: 'center', defaultWidth: 70 },
  { id: 'engagement', label: 'Engagement', defaultVisible: false, align: 'center', defaultWidth: 90 },
  { id: 'keywords', label: 'Keywords', defaultVisible: false, align: 'center', defaultWidth: 90 },
  { id: 'crossSignal', label: 'Cross-signaal', defaultVisible: false, align: 'center', defaultWidth: 100 },
  { id: 'enrichment', label: 'Enrichment', defaultVisible: false, align: 'center', defaultWidth: 90 },
  { id: 'diversity', label: 'Diversiteit', defaultVisible: false, align: 'center', defaultWidth: 90 },
  { id: 'lastSignal', label: 'Laatste signaal', defaultVisible: true, align: 'right', defaultWidth: 130 },
  { id: 'addedAt', label: 'Toegevoegd', defaultVisible: false, align: 'right', defaultWidth: 130 },
  { id: 'icons', label: 'Status iconen', defaultVisible: true, align: 'center', defaultWidth: 80 },
];

const DEFAULT_WIDTHS: Record<string, number> = Object.fromEntries(
  ALL_COLUMNS.map(c => [c.id, c.defaultWidth ?? 120])
);

const STORAGE_KEY = 'contacts-columns-config';

interface ColumnConfig {
  order: string[];
  visible: Set<string>;
  widths: Record<string, number>;
}

function loadColumnConfig(): ColumnConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        order: parsed.order,
        visible: new Set(parsed.visible),
        widths: { ...DEFAULT_WIDTHS, ...(parsed.widths ?? {}) },
      };
    }
  } catch {}
  return {
    order: ALL_COLUMNS.map(c => c.id),
    visible: new Set(ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.id)),
    widths: { ...DEFAULT_WIDTHS },
  };
}

function saveColumnConfig(config: ColumnConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    order: config.order,
    visible: Array.from(config.visible),
    widths: config.widths,
  }));
}
const sourceLabels: Record<string, string> = { auto: 'Auto', manual: 'Manueel', import: 'Import' };

function renderCell(
  c: Contact,
  colId: string,
  domainDefs: { id: string; name: string; color: string }[],
  domainIds: string[],
  onOpenProfile: (id: string) => void,
): React.ReactNode {
  switch (colId) {
    case 'status':
      return <div className={`w-2 h-2 rounded-full mx-auto ${statusColors[c.status]}`} />;
    case 'name':
      return (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold">
              {c.firstName?.[0] ?? ''}{c.lastName?.[0] ?? ''}
            </span>
          </div>
          <span className="font-medium text-foreground truncate max-w-[200px]">
            {c.firstName} {c.lastName}
          </span>
          {c.isCustomer && <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />}
        </div>
      );
    case 'title':
      return <span className="text-muted-foreground truncate max-w-[250px] block">{c.title ?? '—'}</span>;
    case 'company':
      return <span className="text-muted-foreground">{c.company ?? '—'}</span>;
    case 'linkedinUrl':
      return c.linkedinUrl ? (
        <a href={c.linkedinUrl.startsWith('http') ? c.linkedinUrl : `https://${c.linkedinUrl}`} target="_blank" rel="noopener noreferrer" className="text-primary truncate max-w-[200px] block hover:underline">{c.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '')}</a>
      ) : <span className="text-muted-foreground/40">—</span>;
    case 'companyLinkedinUrl':
      return c.companyLinkedinUrl ? (
        <a href={c.companyLinkedinUrl.startsWith('http') ? c.companyLinkedinUrl : `https://${c.companyLinkedinUrl}`} target="_blank" rel="noopener noreferrer" className="text-primary truncate max-w-[200px] block hover:underline">{c.companyLinkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/company\//, '').replace(/\/.*$/, '')}</a>
      ) : <span className="text-muted-foreground/40">—</span>;
    case 'email':
      return c.email ? (
        <span className="text-muted-foreground truncate max-w-[180px] block">{c.email}</span>
      ) : <span className="text-muted-foreground/40">—</span>;
    case 'phone':
      return c.phone ? (
        <span className="text-muted-foreground">{c.phone}</span>
      ) : <span className="text-muted-foreground/40">—</span>;
    case 'location':
      return c.location ? (
        <span className="text-muted-foreground">{c.location}</span>
      ) : <span className="text-muted-foreground/40">—</span>;
    case 'source':
      return (
        <Badge variant="outline" className="text-[10px] font-normal">
          {sourceLabels[c.source] ?? c.source}
        </Badge>
      );
    case 'domains':
      return (
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
      );
    case 'score':
      return (
        <ScorePopover contact={c} onOpenProfile={onOpenProfile}>
          <button className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer">
            {c.totalScore}
          </button>
        </ScorePopover>
      );
    case 'engagement':
      return <span className="font-mono text-muted-foreground">{c.engagementScore}</span>;
    case 'keywords':
      return <span className="font-mono text-muted-foreground">{c.keywordScore}</span>;
    case 'crossSignal':
      return <span className="font-mono text-muted-foreground">{c.crossSignalScore}</span>;
    case 'enrichment':
      return <span className="font-mono text-muted-foreground">{c.enrichmentScore}</span>;
    case 'diversity':
      return <span className="font-mono text-muted-foreground">{c.diversityScore}</span>;
    case 'lastSignal': {
      const last = domainIds
        .map((d) => c.domains[d]?.lastSignalAt)
        .filter(Boolean)
        .sort()
        .reverse()[0];
      return (
        <span className="text-muted-foreground">
          {last ? formatDistanceToNow(new Date(last), { addSuffix: true, locale: nl }) : '—'}
        </span>
      );
    }
    case 'addedAt':
      return (
        <span className="text-muted-foreground">
          {formatDistanceToNow(new Date(c.addedAt), { addSuffix: true, locale: nl })}
        </span>
      );
    case 'icons':
      return (
        <div className="flex items-center justify-center gap-1">
          {c.isEnriched && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
          {c.lemlistCampaignId && <Send className="h-3.5 w-3.5 text-sky-400" />}
        </div>
      );
    default:
      return null;
  }
}

const statusColors: Record<Contact["status"], string> = {
  hot: "bg-red-500",
  warm: "bg-amber-500",
  cold: "bg-muted-foreground/40",
};

const scoreDescriptions: Record<string, string> = {
  Engagement: 'Gewogen activiteit op watchlist organisaties',
  Keywords: 'Match van profiel-keywords uit titel en bedrijf',
  'Cross-signaal': 'Activiteit over meerdere domeinen',
  Enrichment: 'Beschikbaarheid van contactgegevens',
  Diversiteit: 'Aantal unieke organisaties',
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
      {scoreDescriptions[label] && (
        <p className="text-[10px] text-muted-foreground/60">{scoreDescriptions[label]}</p>
      )}
    </div>
  );
}

/* ───── Resize handle component ───── */
function ResizeHandle({ onResizeStart }: { onResizeStart: () => (delta: number) => void }) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const onDrag = onResizeStart();
    const handleMouseMove = (me: MouseEvent) => {
      onDrag(me.clientX - startX);
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/40 transition-colors z-10"
      onMouseDown={handleMouseDown}
    />
  );
}

/* ───── Column settings popover ───── */
function ColumnSettingsPopover({
  columnOrder,
  visibleColumns,
  columnWidths,
  hasUnsavedChanges,
  onToggle,
  onMoveUp,
  onMoveDown,
  onReset,
  onSave,
  onAutoFit,
  onWidthChange,
}: {
  columnOrder: string[];
  visibleColumns: Set<string>;
  columnWidths: Record<string, number>;
  hasUnsavedChanges: boolean;
  onToggle: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onReset: () => void;
  onSave: () => void;
  onAutoFit: () => void;
  onWidthChange: (id: string, width: number) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className={`gap-1 text-xs h-8 ${hasUnsavedChanges ? 'border-primary text-primary' : ''}`}>
          <Settings2 className="h-3.5 w-3.5" />
          Kolommen
          {hasUnsavedChanges && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-3 border-b border-border">
          <p className="text-xs font-semibold text-foreground">Kolommen beheren</p>
          <p className="text-[10px] text-muted-foreground">Toon/verberg, herorden en breedte aanpassen</p>
        </div>
        <div className="max-h-80 overflow-y-auto p-1">
          {columnOrder.map((colId, idx) => {
            const def = ALL_COLUMNS.find(c => c.id === colId);
            if (!def) return null;
            const isVisible = visibleColumns.has(colId);
            return (
              <div
                key={colId}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-muted/50 group"
              >
                <button
                  onClick={() => onToggle(colId)}
                  className="shrink-0"
                >
                  {isVisible ? (
                    <Eye className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground/40" />
                  )}
                </button>
                <span className={`text-xs flex-1 ${isVisible ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                  {def.label}
                </span>
                {isVisible && (
                  <Input
                    type="number"
                    value={columnWidths[colId] ?? def.defaultWidth ?? 120}
                    onChange={(e) => onWidthChange(colId, parseInt(e.target.value) || 80)}
                    className="w-14 h-5 text-[10px] px-1 text-center opacity-0 group-hover:opacity-100 transition-opacity"
                    min={40}
                    max={600}
                  />
                )}
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onMoveUp(colId)}
                    disabled={idx === 0}
                    className="p-0.5 rounded hover:bg-muted disabled:opacity-20"
                  >
                    <ArrowUp className="h-3 w-3 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => onMoveDown(colId)}
                    disabled={idx === columnOrder.length - 1}
                    className="p-0.5 rounded hover:bg-muted disabled:opacity-20"
                  >
                    <ArrowDown className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-2 border-t border-border space-y-1">
          <div className="flex gap-1">
            <Button size="sm" className="flex-1 text-xs h-7 gap-1" onClick={onSave} disabled={!hasUnsavedChanges}>
              <Save className="h-3 w-3" />
              Opslaan
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={onAutoFit}>
              <Maximize2 className="h-3 w-3" />
              Auto-fit
            </Button>
          </div>
          <Button size="sm" variant="ghost" className="w-full text-xs h-7 gap-1" onClick={onReset}>
            <RotateCcw className="h-3 w-3" />
            Reset naar standaard
          </Button>
        </div>
      </PopoverContent>
    </Popover>
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

  // Column config state
  const [colConfig, setColConfig] = useState(loadColumnConfig);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { order: columnOrder, visible: visibleColumns, widths: columnWidths } = colConfig;

  const updateConfig = useCallback((updater: (prev: ColumnConfig) => ColumnConfig) => {
    setColConfig(prev => {
      const next = updater(prev);
      setHasUnsavedChanges(true);
      return next;
    });
  }, []);

  const toggleColumn = useCallback((id: string) => {
    updateConfig(prev => {
      const next = new Set(prev.visible);
      if (next.has(id)) next.delete(id); else next.add(id);
      return { ...prev, visible: next };
    });
  }, [updateConfig]);

  const moveColumn = useCallback((id: string, dir: -1 | 1) => {
    updateConfig(prev => {
      const arr = [...prev.order];
      const idx = arr.indexOf(id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return prev;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { ...prev, order: arr };
    });
  }, [updateConfig]);

  const setColumnWidth = useCallback((id: string, width: number) => {
    updateConfig(prev => ({
      ...prev,
      widths: { ...prev.widths, [id]: Math.max(40, width) },
    }));
  }, [updateConfig]);

  const resetColumns = useCallback(() => {
    const def: ColumnConfig = {
      order: ALL_COLUMNS.map(c => c.id),
      visible: new Set(ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.id)),
      widths: { ...DEFAULT_WIDTHS },
    };
    saveColumnConfig(def);
    setColConfig(def);
    setHasUnsavedChanges(false);
    toast.success('Kolominstellingen gereset');
  }, []);

  const saveColumns = useCallback(() => {
    saveColumnConfig(colConfig);
    setHasUnsavedChanges(false);
    toast.success('Kolominstellingen opgeslagen');
  }, [colConfig]);

  const autoFitColumns = useCallback(() => {
    updateConfig(prev => ({
      ...prev,
      widths: { ...DEFAULT_WIDTHS },
    }));
  }, [updateConfig]);

  const activeColumns = useMemo(() =>
    columnOrder
      .filter(id => visibleColumns.has(id))
      .map(id => ALL_COLUMNS.find(c => c.id === id)!)
      .filter(Boolean),
    [columnOrder, visibleColumns]
  );

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
            <ColumnSettingsPopover
              columnOrder={columnOrder}
              visibleColumns={visibleColumns}
              columnWidths={columnWidths}
              hasUnsavedChanges={hasUnsavedChanges}
              onToggle={toggleColumn}
              onMoveUp={(id) => moveColumn(id, -1)}
              onMoveDown={(id) => moveColumn(id, 1)}
              onReset={resetColumns}
              onSave={saveColumns}
              onAutoFit={autoFitColumns}
              onWidthChange={setColumnWidth}
            />
          </div>

          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="text-xs" style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}>
                  <colgroup>
                    {selectMode && <col style={{ width: 40 }} />}
                    {activeColumns.map((col) => (
                      <col key={col.id} style={{ width: columnWidths[col.id] ?? col.defaultWidth ?? 120 }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      {selectMode && <th className="p-3 w-8"></th>}
                      {activeColumns.map((col) => (
                        <th
                          key={col.id}
                          className={`p-3 font-medium text-${col.align ?? 'left'} relative select-none`}
                        >
                          <span className="truncate block">{col.label}</span>
                          <ResizeHandle
                            onResizeStart={() => {
                              const baseWidth = columnWidths[col.id] ?? col.defaultWidth ?? 120;
                              return (delta: number) => setColumnWidth(col.id, baseWidth + delta);
                            }}
                          />
                        </th>
                      ))}
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
                        {activeColumns.map((col) => (
                          <td key={col.id} className={`p-3 text-${col.align ?? 'left'} overflow-hidden`}>
                            <div className="truncate">
                              {renderCell(c, col.id, domainDefs, domainIds, (id) => setSelectedId(id))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://${selected.linkedinUrl}`}
                        target="_blank"
                        rel="noopener"
                        className="flex items-center gap-2 text-blue-400 hover:underline flex-1 min-w-0 truncate"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        {selected.linkedinUrl}
                      </a>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px] gap-1 shrink-0"
                        onClick={() => window.open(`https://${selected.linkedinUrl}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open LinkedIn
                      </Button>
                    </div>
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

                {/* 30-day activity mini-chart */}
                {(() => {
                  const contactSignals = signals
                    .filter((s) => s.contactLinkedinUrl === selected.linkedinUrl)
                    .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
                  const now = Date.now();
                  const dayMs = 86400000;
                  const dayBuckets: Record<number, Set<string>> = {};
                  for (const s of contactSignals) {
                    const daysAgo = Math.floor((now - new Date(s.detectedAt).getTime()) / dayMs);
                    if (daysAgo >= 0 && daysAgo < 30) {
                      if (!dayBuckets[daysAgo]) dayBuckets[daysAgo] = new Set();
                      dayBuckets[daysAgo].add(s.domain);
                    }
                  }
                  return (
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground text-sm">Activiteit (30 dagen)</h3>
                      <svg viewBox="0 0 300 24" className="w-full h-6" preserveAspectRatio="none">
                        <rect x="0" y="0" width="300" height="24" rx="3" className="fill-muted/50" />
                        {Array.from({ length: 30 }, (_, i) => {
                          const day = 29 - i;
                          const domains = dayBuckets[day];
                          if (!domains) return null;
                          const domArr = Array.from(domains);
                          const barHeight = Math.min(20, domArr.length * 8);
                          return domArr.map((domId, j) => (
                            <rect
                              key={`${i}-${j}`}
                              x={i * 10}
                              y={24 - (j + 1) * Math.min(8, 20 / domArr.length)}
                              width={8}
                              height={Math.min(8, 20 / domArr.length) - 1}
                              rx={1}
                              fill={getDomainColor(domainDefs, domId)}
                              opacity={0.85}
                            />
                          ));
                        })}
                      </svg>
                      <div className="flex justify-between text-[9px] text-muted-foreground/50">
                        <span>30d geleden</span>
                        <span>vandaag</span>
                      </div>
                    </div>
                  );
                })()}

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

                {/* Context-aware action buttons */}
                <div className="flex gap-2">
                  {selected.isEnriched ? (
                    <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => navigate('/enrichment')}>
                      Opnieuw verrijken
                    </Button>
                  ) : (
                    <Button size="sm" className="text-xs flex-1" onClick={() => navigate('/enrichment')}>
                      {selected.email ? 'Verrijk via Apollo' : 'Verrijk eerst'}
                    </Button>
                  )}
                  {selected.lemlistCampaignId ? (
                    <Button size="sm" variant="outline" className="text-xs flex-1" disabled>
                      Al in campagne
                    </Button>
                  ) : selected.email ? (
                    <Button size="sm" className="text-xs flex-1">
                      Push naar Lemlist
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="text-xs flex-1" disabled title="Geen email beschikbaar">
                      Push naar Lemlist
                    </Button>
                  )}
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
    const url = normalizeLinkedInUrl(form.linkedinUrl);
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
      enrichmentSource: 'none',
      emailVerifiedByDropcontact: false,
      dropcontactEnrichedAt: null,
      companyLinkedinUrl: null,
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
