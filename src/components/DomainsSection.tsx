import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GripVertical,
  Pencil,
  Trash2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import type { DomainDefinition } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const COLOR_PRESETS = [
  "#7F77DD",
  "#378ADD",
  "#D85A30",
  "#0FB57A",
  "#EF9F27",
  "#E8593C",
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 20);
}

/* ─── Domain Card ─── */
function DomainCard({
  domain,
  canDelete,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  domain: DomainDefinition;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="flex items-center gap-2 bg-secondary/20 border border-border rounded-lg px-2 py-2 group cursor-grab active:cursor-grabbing"
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
      <div
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: domain.color }}
      />
      <span className="text-xs font-medium text-foreground shrink-0">
        {domain.name}
      </span>
      <span className="text-[10px] text-muted-foreground truncate flex-1 min-w-0">
        {domain.description}
      </span>
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
        {domain.weight}%
      </span>
      <button
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded"
      >
        <Pencil className="h-3 w-3 text-muted-foreground" />
      </button>
      <button
        onClick={onDelete}
        disabled={!canDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded disabled:opacity-30"
      >
        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-400" />
      </button>
    </div>
  );
}

/* ─── Weight Bar ─── */
function WeightBar({ domains }: { domains: DomainDefinition[] }) {
  const totalWeight = domains.reduce((s, d) => s + d.weight, 0);
  if (totalWeight === 0) return null;

  return (
    <div className="flex h-5 rounded-lg overflow-hidden border border-border">
      {domains.map((d) => {
        const pct = (d.weight / totalWeight) * 100;
        return (
          <div
            key={d.id}
            className="flex items-center justify-center text-[9px] font-medium text-white transition-all"
            style={{
              backgroundColor: d.color,
              width: `${pct}%`,
              minWidth: pct > 8 ? undefined : 0,
            }}
          >
            {pct >= 12 ? `${Math.round(pct)}%` : ""}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Edit / Create Dialog ─── */
function DomainDialog({
  open,
  onOpenChange,
  existing,
  existingIds,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existing: DomainDefinition | null;
  existingIds: string[];
  onSave: (domain: DomainDefinition) => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [color, setColor] = useState(existing?.color ?? COLOR_PRESETS[0]);
  const [weight, setWeight] = useState(existing?.weight ?? 20);
  const [customColor, setCustomColor] = useState("");

  // Reset on open
  const prevOpen = useRef(open);
  if (open && !prevOpen.current) {
    // Just opened
    setTimeout(() => {
      setName(existing?.name ?? "");
      setDescription(existing?.description ?? "");
      setColor(existing?.color ?? COLOR_PRESETS[0]);
      setWeight(existing?.weight ?? 20);
      setCustomColor("");
    }, 0);
  }
  prevOpen.current = open;

  const handleSave = () => {
    const trimName = name.trim();
    if (!trimName) return;
    const id = existing?.id ?? slugify(trimName);
    if (!existing && existingIds.includes(id)) return;

    onSave({
      id,
      name: trimName,
      description: description.trim(),
      color,
      weight,
      sortOrder: existing?.sortOrder ?? 999,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {existing ? "Domein bewerken" : "Nieuw domein"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs text-muted-foreground">
              Naam <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder="bijv. Impact & ESG"
              className="w-full mt-1 text-xs bg-secondary/40 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-[10px] text-muted-foreground">
              {name.length}/40
            </span>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Beschrijving</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              rows={2}
              placeholder="Korte omschrijving van dit domein..."
              className="w-full mt-1 text-xs bg-secondary/40 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <span className="text-[10px] text-muted-foreground">
              {description.length}/200
            </span>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Kleur</label>
            <div className="flex items-center gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    color === c ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <div className="flex items-center gap-1 ml-2">
                <input
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      setColor(e.target.value);
                    }
                  }}
                  placeholder="#hex"
                  className="w-16 text-[10px] bg-secondary/40 border border-border rounded px-1.5 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">
              Gewicht: {weight}
            </label>
            <input
              type="range"
              min={1}
              max={100}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full mt-1 accent-primary h-1.5"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Opslaan
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══ MAIN SECTION ═══ */
export default function DomainsSection() {
  const { settings, addDomain, updateDomain, removeDomain, reorderDomains, watchlistOrgs } = useStore();
  const domains = [...settings.domains].sort((a, b) => a.sortOrder - b.sortOrder);

  const [editDomain, setEditDomain] = useState<DomainDefinition | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DomainDefinition | null>(null);

  const dragItem = useRef<string | null>(null);

  const handleDragStart = useCallback((id: string) => (e: React.DragEvent) => {
    dragItem.current = id;
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (targetId: string) => (e: React.DragEvent) => {
      e.preventDefault();
      const fromId = dragItem.current;
      if (!fromId || fromId === targetId) return;

      const ordered = domains.map((d) => d.id);
      const fromIdx = ordered.indexOf(fromId);
      const toIdx = ordered.indexOf(targetId);
      ordered.splice(fromIdx, 1);
      ordered.splice(toIdx, 0, fromId);
      reorderDomains(ordered);
      dragItem.current = null;
    },
    [domains, reorderDomains]
  );

  const handleEqualise = () => {
    const n = domains.length;
    const base = Math.floor(100 / n);
    const remainder = 100 - base * n;
    domains.forEach((d, i) => {
      updateDomain(d.id, { weight: base + (i < remainder ? 1 : 0) });
    });
  };

  const handleSave = (domain: DomainDefinition) => {
    if (settings.domains.find((d) => d.id === domain.id)) {
      updateDomain(domain.id, {
        name: domain.name,
        description: domain.description,
        color: domain.color,
        weight: domain.weight,
      });
    } else {
      addDomain({ ...domain, sortOrder: domains.length });
    }
  };

  const orgsInDomain = (id: string) =>
    watchlistOrgs.filter((o) => o.domain === id).length;

  return (
    <div className="space-y-4">
      {/* Domain cards */}
      <div className="space-y-1.5">
        {domains.map((d) => (
          <DomainCard
            key={d.id}
            domain={d}
            canDelete={domains.length > 1}
            onEdit={() => {
              setEditDomain(d);
              setDialogOpen(true);
            }}
            onDelete={() => setDeleteTarget(d)}
            onDragStart={handleDragStart(d.id)}
            onDragOver={handleDragOver}
            onDrop={handleDrop(d.id)}
          />
        ))}
      </div>

      {/* Weight bar */}
      <WeightBar domains={domains} />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setEditDomain(null);
            setDialogOpen(true);
          }}
          disabled={domains.length >= 5}
          className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={domains.length >= 5 ? "Maximum 5 domeinen" : undefined}
        >
          <Plus className="h-3 w-3" /> Domein toevoegen
        </button>
        <button
          onClick={handleEqualise}
          className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors"
        >
          Gelijk verdelen
        </button>
      </div>

      {/* LLM placeholder */}
      <div className="flex items-center gap-3 border border-dashed border-border rounded-xl p-3 opacity-50">
        <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground font-medium">
            AI Domein-assistent
          </p>
          <p className="text-[10px] text-muted-foreground">
            Laat AI je helpen met het kiezen van domeinen op basis van je
            business. Binnenkort beschikbaar.
          </p>
        </div>
      </div>

      {/* Edit / Create dialog */}
      <DomainDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        existing={editDomain}
        existingIds={domains.map((d) => d.id)}
        onSave={handleSave}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">
              {deleteTarget?.name} verwijderen?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Alle organisaties ({deleteTarget ? orgsInDomain(deleteTarget.id) : 0})
              in dit domein en hun signalen worden ook verwijderd. Dit kan niet
              ongedaan worden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Annuleren</AlertDialogCancel>
            <AlertDialogAction
              className="text-xs bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (deleteTarget) {
                  removeDomain(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
