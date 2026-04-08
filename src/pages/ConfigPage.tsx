import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Tags,
  Database,
  Send,
  Palette,
  Bell,
  ChevronDown,
  X,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Moon,
  Sun,
  Monitor,
  Download,
  Layers,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import DomainsSection from "@/components/DomainsSection";
import { useConnectionStore } from "@/stores/connectionStore";

/* ─── Toggle Switch ─── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${checked ? "bg-primary" : "bg-secondary"}`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`}
      />
    </button>
  );
}

/* ─── Section Accordion ─── */
function Section({
  icon: Icon,
  title,
  defaultOpen = false,
  children,
}: {
  icon: React.ElementType;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded-xl mb-3 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 border-t border-border mt-1 pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Connection Banner ─── */
function ConnectionBanner({ toolId, toolName }: { toolId: string; toolName: string }) {
  const conn = useConnectionStore((s) => s.connections.find((c) => c.id === toolId));
  if (!conn) return null;

  if (conn.status === "connected") {
    return (
      <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 mb-4">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        <span className="text-xs text-emerald-500">{toolName} is verbonden</span>
      </div>
    );
  }
  if (conn.status === "warning") {
    return (
      <div className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mb-4">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
        <span className="text-xs text-amber-500">{conn.statusMessage || "Waarschuwing"}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 rounded-lg p-3 mb-4">
      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
      <span className="text-xs text-red-500">{toolName} is niet verbonden</span>
      <Link to={`/settings/setup?open=${toolId}`} className="text-xs text-primary hover:underline ml-auto">
        Ga naar Setup
      </Link>
    </div>
  );
}

/* ─── Disabled overlay for disconnected tools ─── */
function ConnectionGuard({
  toolId,
  toolName,
  children,
}: {
  toolId: string;
  toolName: string;
  children: React.ReactNode;
}) {
  const status = useConnectionStore((s) => s.connections.find((c) => c.id === toolId)?.status);
  const disabled = status === "error" || status === "not_configured" || !status;

  return (
    <div>
      <ConnectionBanner toolId={toolId} toolName={toolName} />
      {disabled ? (
        <div className="relative">
          <div className="opacity-40 pointer-events-none">{children}</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-card/90 border border-border rounded-lg px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">
                Verbind eerst {toolName} via{" "}
                <Link to={`/settings/setup?open=${toolId}`} className="text-primary hover:underline">
                  Setup
                </Link>
              </p>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/* ─── Slider Row ─── */
function SliderRow({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
  badge,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-36 shrink-0">{label}</span>
      {badge}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-primary h-1.5"
      />
      <span className="text-xs font-mono text-muted-foreground min-w-[2rem] text-right">
        {value}
        {suffix}
      </span>
    </div>
  );
}

/* ═══ SECTIONS ═══ */

function ScoringSection() {
  const { settings, updateScoreWeights, setThreshold, setDecayDays } = useStore();
  const { scoreWeights, hotScoreThreshold, warmThreshold, decayDaysUntilCold } = settings;
  const total = Object.values(scoreWeights).reduce((a, b) => a + b, 0);

  const weights: { key: keyof typeof scoreWeights; label: string }[] = [
    { key: "engagement", label: "Engagement" },
    { key: "profileKeywords", label: "Profiel keywords" },
    { key: "crossSignal", label: "Cross-signaal" },
    { key: "enrichment", label: "Enrichment" },
    { key: "orgDiversity", label: "Org diversiteit" },
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-foreground">Component gewichten</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            Relatieve gewichten (som: {total})
          </span>
        </div>
        {weights.map((w) => (
          <SliderRow
            key={w.key}
            label={w.label}
            value={scoreWeights[w.key]}
            min={0}
            max={100}
            onChange={(v) => updateScoreWeights({ [w.key]: v })}
          />
        ))}
      </div>

      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-xs font-medium text-foreground">Drempelwaarden</p>
        <SliderRow
          label="Hot (>=)"
          value={hotScoreThreshold}
          min={1}
          max={100}
          onChange={(v) => setThreshold("hot", v)}
          badge={<span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 shrink-0">Hot</span>}
        />
        <SliderRow
          label="Warm (>=)"
          value={warmThreshold}
          min={0}
          max={99}
          onChange={(v) => setThreshold("warm", v)}
          badge={
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 shrink-0">Warm</span>
          }
        />
      </div>

      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-xs font-medium text-foreground">Score verval</p>
        <SliderRow
          label="Dagen tot cold"
          value={decayDaysUntilCold}
          min={7}
          max={90}
          onChange={setDecayDays}
          suffix="d"
        />
        <p className="text-[10px] text-muted-foreground">
          Na hoeveel dagen zonder nieuw signaal wordt een contact cold?
        </p>
      </div>

      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-xs font-medium text-foreground">Organisatie-cap</p>
        <SliderRow
          label="Max signalen per organisatie"
          value={settings.maxSignalsPerOrg ?? 5}
          min={1}
          max={20}
          onChange={(v) => updateSettings({ maxSignalsPerOrg: v })}
        />
        <p className="text-[10px] text-muted-foreground">
          Hoeveel signalen van dezelfde organisatie tellen maximaal mee voor de engagement score?
        </p>
      </div>
    </div>
  );
}

function KeywordsSection() {
  const { settings, addKeyword, removeKeyword } = useStore();
  const { positiveKeywords, negativeKeywords } = settings;
  const [input, setInput] = useState("");
  const [type, setType] = useState<"positive" | "negative">("positive");

  const handleAdd = () => {
    const kw = input.trim();
    if (!kw) return;
    addKeyword(kw, type);
    setInput("");
  };

  const handleExport = () => {
    const rows = [...positiveKeywords.map((k) => `${k},positive`), ...negativeKeywords.map((k) => `${k},negative`)];
    const csv = "keyword,type\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keywords.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Nieuw keyword..."
          className="flex-1 text-xs bg-secondary/40 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "positive" | "negative")}
          className="text-xs bg-secondary/40 border border-border rounded-lg px-2 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="positive">Positief</option>
          <option value="negative">Negatief</option>
        </select>
        <button
          onClick={handleAdd}
          className="bg-primary/10 text-primary border border-primary/20 rounded-lg p-2 hover:bg-primary/20 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-foreground mb-2">Positief ({positiveKeywords.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {positiveKeywords.map((kw) => (
              <span
                key={kw}
                className="group inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              >
                {kw}
                <button
                  onClick={() => removeKeyword(kw, "positive")}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-foreground mb-2">Negatief ({negativeKeywords.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {negativeKeywords.map((kw) => (
              <span
                key={kw}
                className="group inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20"
              >
                {kw}
                <button
                  onClick={() => removeKeyword(kw, "negative")}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <button
          onClick={() => alert("Import functie komt binnenkort")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Importeer (CSV)
        </button>
        <button
          onClick={handleExport}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <Download className="h-3 w-3" /> Exporteer (CSV)
        </button>
      </div>
    </div>
  );
}

function HubSpotSection() {
  const { settings, updateHubSpotMapping } = useStore();
  const { hubspotMapping } = settings;

  return (
    <ConnectionGuard toolId="hubspot" toolName="HubSpot">
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground">Lead source</label>
          <input
            value={hubspotMapping.leadSource}
            onChange={(e) => updateHubSpotMapping({ leadSource: e.target.value })}
            className="w-full mt-1 text-xs bg-secondary/40 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Lifecycle stage</label>
          <select
            value={hubspotMapping.lifecycleStage}
            onChange={(e) => updateHubSpotMapping({ lifecycleStage: e.target.value })}
            className="w-full mt-1 text-xs bg-secondary/40 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="lead">Lead</option>
            <option value="subscriber">Subscriber</option>
            <option value="opportunity">Opportunity</option>
            <option value="customer">Customer</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Contact owner (e-mail)</label>
          <input
            value={hubspotMapping.contactOwner}
            onChange={(e) => updateHubSpotMapping({ contactOwner: e.target.value })}
            className="w-full mt-1 text-xs bg-secondary/40 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </ConnectionGuard>
  );
}

function LemlistSection() {
  const { settings, updateLemlistConfig } = useStore();
  const { lemlistConfig } = settings;

  return (
    <ConnectionGuard toolId="lemlist" toolName="Lemlist">
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground">Dagelijks send limiet</label>
          <input
            type="number"
            min={1}
            max={200}
            value={lemlistConfig.dailySendLimit}
            onChange={(e) => updateLemlistConfig({ dailySendLimit: Number(e.target.value) })}
            className="w-32 mt-1 text-xs bg-secondary/40 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Default campagne</label>
          <select
            value={lemlistConfig.defaultCampaignId}
            onChange={(e) => updateLemlistConfig({ defaultCampaignId: e.target.value })}
            className="w-full mt-1 text-xs bg-secondary/40 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Kies...</option>
            <option value="kunst-q1">Kunst leads Q1</option>
            <option value="beleggen">Beleggen outreach</option>
            <option value="luxe">Luxe introductie</option>
          </select>
        </div>
      </div>
    </ConnectionGuard>
  );
}

function AppearanceSection() {
  const { settings, updateAppearance } = useStore();
  const { appearance } = settings;

  const themes: { value: "dark" | "light" | "system"; label: string; icon: React.ElementType }[] = [
    { value: "dark", label: "Dark", icon: Moon },
    { value: "light", label: "Light", icon: Sun },
    { value: "system", label: "Systeem", icon: Monitor },
  ];

  const accents: { value: typeof appearance.accentColor; color: string }[] = [
    { value: "coral", color: "bg-[#E8593C]" },
    { value: "blue", color: "bg-[#3B8BD4]" },
    { value: "emerald", color: "bg-[#0FB57A]" },
    { value: "amber", color: "bg-[#EF9F27]" },
    { value: "purple", color: "bg-[#7F77DD]" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-foreground mb-3">Thema</p>
        <div className="flex gap-3">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => updateAppearance({ theme: t.value })}
              className={`rounded-xl p-3 flex flex-col items-center gap-2 text-xs cursor-pointer transition-all border ${
                appearance.theme === t.value
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-card hover:bg-secondary/40 text-muted-foreground"
              }`}
            >
              <t.icon className="h-5 w-5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between py-3 border-t border-border">
        <div>
          <p className="text-xs text-foreground">Compacte weergave</p>
          <p className="text-[10px] text-muted-foreground">Minder witruimte, meer informatie per scherm</p>
        </div>
        <Toggle checked={appearance.compactMode} onChange={(v) => updateAppearance({ compactMode: v })} />
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-xs font-medium text-foreground mb-3">Accentkleur</p>
        <div className="flex gap-2">
          {accents.map((a) => (
            <button
              key={a.value}
              onClick={() => updateAppearance({ accentColor: a.value })}
              className={`w-6 h-6 rounded-full ${a.color} border-2 transition-all ${
                appearance.accentColor === a.value ? "border-foreground scale-110" : "border-transparent"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationsSection() {
  const { settings, updateNotifications } = useStore();
  const { notifications } = settings;

  const items: { key: keyof typeof notifications; label: string }[] = [
    { key: "newHotLead", label: "Nieuwe hot lead gedetecteerd" },
    { key: "enrichmentFailed", label: "Enrichment mislukt" },
    { key: "connectionDown", label: "Tool connectie verbroken" },
    { key: "dailyDigest", label: "Dagelijkse samenvatting" },
  ];

  return (
    <div>
      {items.map((item, i) => (
        <div
          key={item.key}
          className={`flex items-center justify-between py-3 ${i < items.length - 1 ? "border-b border-border" : ""}`}
        >
          <span className="text-xs text-foreground">{item.label}</span>
          <Toggle checked={notifications[item.key]} onChange={(v) => updateNotifications({ [item.key]: v })} />
        </div>
      ))}
    </div>
  );
}

/* ═══ MAIN PAGE ═══ */
export default function ConfigPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Configuratie</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Pas scoring, keywords en integraties aan</p>
      </div>

      <div>
        <Section icon={Layers} title="Domeinen" defaultOpen>
          <DomainsSection />
        </Section>
        <Section icon={Target} title="Scoring engine">
          <ScoringSection />
        </Section>
        <Section icon={Tags} title="Keywords">
          <KeywordsSection />
        </Section>
        <Section icon={Database} title="HubSpot veldmapping">
          <HubSpotSection />
        </Section>
        <Section icon={Send} title="Lemlist instellingen">
          <LemlistSection />
        </Section>
        <Section icon={Palette} title="Uiterlijk">
          <AppearanceSection />
        </Section>
        <Section icon={Bell} title="Notificaties">
          <NotificationsSection />
        </Section>
      </div>
    </motion.div>
  );
}
