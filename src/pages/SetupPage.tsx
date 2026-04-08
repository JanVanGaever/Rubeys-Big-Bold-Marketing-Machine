import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, Circle, Eye, EyeOff, Loader2, ChevronDown, ExternalLink, CheckCircle2, RotateCcw } from 'lucide-react';
import { useConnectionStore, type ConnectionStatus } from '@/stores/connectionStore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

/* ─── Helpers ─── */
function relativeTime(iso: string | null) {
  if (!iso) return 'Nooit';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Zojuist';
  if (mins < 60) return `${mins} min geleden`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}u geleden`;
  return `${Math.floor(hrs / 24)}d geleden`;
}

function StatusIndicator({ status, message }: { status: ConnectionStatus; message: string }) {
  switch (status) {
    case 'connected':
      return (
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-[10px] text-emerald-500">Verbonden</span>
        </div>
      );
    case 'warning':
      return (
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-[10px] text-amber-500">{message || 'Waarschuwing'}</span>
        </div>
      );
    case 'error':
      return (
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
          <span className="text-[10px] text-red-500">{message || 'Fout'}</span>
        </div>
      );
    case 'testing':
      return (
        <div className="flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
          <span className="text-[10px] text-muted-foreground">Testen...</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1.5">
          <Circle className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{message || 'Niet geconfigureerd'}</span>
        </div>
      );
  }
}

/* ─── Password input with show/hide ─── */
function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-xs bg-secondary/40 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button onClick={() => setShow(!show)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary/40 transition-colors">
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

/* ─── Connection config fields per type ─── */
function ConnectionFields({ id, config, onConfigChange, status }: {
  id: string;
  config: Record<string, string>;
  onConfigChange: (cfg: Record<string, string>) => void;
  status: ConnectionStatus;
}) {
  if (id === 'chrome-extension') {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Installeer de Chrome extensie vanuit de Chrome Web Store en activeer deze op LinkedIn.
        </p>
        <a
          href="https://chrome.google.com/webstore"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" /> Chrome Web Store
        </a>
      </div>
    );
  }

  if (id === 'n8n') {
    return (
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Webhook URL</label>
        <input
          type="text"
          value={config.webhookUrl || ''}
          onChange={(e) => onConfigChange({ webhookUrl: e.target.value })}
          placeholder="https://n8n.example.com/webhook/..."
          className="w-full text-xs bg-secondary/40 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    );
  }

  const extraDropdowns: Record<string, { label: string; options: string[] }> = {
    lemlist: { label: 'Selecteer campagne', options: ['Kunst leads Q1', 'Beleggen outreach', 'Luxe introductie'] },
    hubspot: { label: 'Selecteer pipeline', options: ['Sales Pipeline', 'Partner Pipeline', 'Investor Pipeline'] },
  };

  const extra = extraDropdowns[id];

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">API Key</label>
        <SecretInput
          value={config.apiKey || ''}
          onChange={(v) => onConfigChange({ apiKey: v })}
          placeholder="Plak je API key hier..."
        />
      </div>
      {extra && status === 'connected' && (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">{extra.label}</label>
          <select
            value={config.selectedOption || ''}
            onChange={(e) => onConfigChange({ selectedOption: e.target.value })}
            className="w-full text-xs bg-secondary/40 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Kies...</option>
            {extra.options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

/* ─── WIZARD MODE ─── */
function SetupWizard() {
  const { connections, currentSetupStep, setCurrentStep, setConnectionConfig, testConnection, completeSetup } = useConnectionStore();
  const conn = connections[currentSetupStep];
  const [skipped, setSkipped] = useState<Set<number>>(new Set());

  const handleSkip = () => {
    skipped.add(currentSetupStep);
    setSkipped(new Set(skipped));
    if (currentSetupStep < connections.length - 1) {
      setCurrentStep(currentSetupStep + 1);
    } else {
      completeSetup();
    }
  };

  const handleNext = () => {
    if (currentSetupStep < connections.length - 1) {
      setCurrentStep(currentSetupStep + 1);
    } else {
      completeSetup();
    }
  };

  const canProceed = conn.status === 'connected';

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">Stap {currentSetupStep + 1} van {connections.length}</p>

      {/* Step indicator */}
      <div className="flex gap-8">
        <div className="shrink-0 flex flex-col">
          {connections.map((c, i) => {
            const isCompleted = c.status === 'connected' || (i < currentSetupStep && skipped.has(i));
            const isActive = i === currentSetupStep;
            const isPast = i < currentSetupStep;
            return (
              <div key={c.id} className="flex items-start gap-3">
                {/* Vertical line + dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      c.status === 'connected'
                        ? 'bg-emerald-500'
                        : isActive
                        ? 'bg-primary'
                        : 'border border-border bg-transparent'
                    }`}
                  >
                    {c.status === 'connected' && <Check className="h-3 w-3 text-white" />}
                    {isActive && c.status !== 'connected' && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                  </div>
                  {i < connections.length - 1 && (
                    <div className={`w-0.5 h-8 ${isPast || c.status === 'connected' ? 'bg-emerald-500' : 'bg-border'}`} />
                  )}
                </div>
                {/* Label */}
                <span
                  className={`text-xs pt-0.5 ${
                    c.status === 'connected'
                      ? 'text-muted-foreground line-through'
                      : isActive
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  {c.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Active step content */}
        <div className="flex-1 bg-card border border-border rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{conn.name}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">{conn.description}</p>
          </div>

          <ConnectionFields
            id={conn.id}
            config={conn.config}
            onConfigChange={(cfg) => setConnectionConfig(conn.id, cfg)}
            status={conn.status}
          />

          <div className="flex items-center gap-3">
            <button
              onClick={() => testConnection(conn.id)}
              disabled={conn.status === 'testing'}
              className="bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 py-1.5 text-xs hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {conn.status === 'testing' ? (
                <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Testen...</span>
              ) : (
                'Test verbinding'
              )}
            </button>
            <StatusIndicator status={conn.status} message={conn.statusMessage} />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <button onClick={handleSkip} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Overslaan
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-xs disabled:opacity-40 transition-colors hover:bg-primary/90"
            >
              {currentSetupStep === connections.length - 1 ? 'Voltooien' : 'Volgende →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── DASHBOARD MODE ─── */
function SetupDashboard() {
  const { connections, setConnectionConfig, testConnection, resetSetup } = useConnectionStore();
  const [searchParams] = useSearchParams();
  const openId = searchParams.get('open');

  const [testingAll, setTestingAll] = useState(false);

  const handleTestAll = async () => {
    setTestingAll(true);
    for (const conn of connections) {
      await testConnection(conn.id);
    }
    setTestingAll(false);
  };

  const defaultOpen = openId ? [openId] : [];

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={defaultOpen}>
        {connections.map((conn) => (
          <AccordionItem key={conn.id} value={conn.id} className="bg-card border border-border rounded-xl mb-3 overflow-hidden border-b-0">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/20 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <StatusIcon status={conn.status} />
                <div className="flex-1 text-left">
                  <p className="text-xs font-medium text-foreground">{conn.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Laatst gecontroleerd: {relativeTime(conn.lastChecked)}
                  </p>
                </div>
                <div className="mr-2">
                  <StatusIndicator status={conn.status} message={conn.statusMessage} />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4 pt-2">
                <ConnectionFields
                  id={conn.id}
                  config={conn.config}
                  onConfigChange={(cfg) => setConnectionConfig(conn.id, cfg)}
                  status={conn.status}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => testConnection(conn.id)}
                    disabled={conn.status === 'testing'}
                    className="bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 py-1.5 text-xs hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    {conn.status === 'testing' ? (
                      <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Testen...</span>
                    ) : (
                      'Test opnieuw'
                    )}
                  </button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleTestAll}
          disabled={testingAll}
          className="bg-primary/10 text-primary border border-primary/20 rounded-lg px-4 py-2 text-xs hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {testingAll ? <><Loader2 className="h-3 w-3 animate-spin" /> Testen...</> : <><RotateCcw className="h-3 w-3" /> Alles opnieuw testen</>}
        </button>
        <button
          onClick={resetSetup}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Setup opnieuw starten
        </button>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: ConnectionStatus }) {
  switch (status) {
    case 'connected':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
    case 'error':
      return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />;
    case 'testing':
      return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground shrink-0" />;
  }
}

/* ─── MAIN PAGE ─── */
export default function SetupPage() {
  const { setupCompleted } = useConnectionStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-2xl"
    >
      <div>
        <h1 className="text-xl font-semibold text-foreground">Setup</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {setupCompleted ? 'Status van je verbonden tools' : 'Verbind je tools om Lead Catalyst te activeren'}
        </p>
      </div>

      {setupCompleted ? <SetupDashboard /> : <SetupWizard />}
    </motion.div>
  );
}
