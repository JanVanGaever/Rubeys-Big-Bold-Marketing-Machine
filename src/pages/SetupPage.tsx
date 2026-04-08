import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, AlertTriangle, Circle, Loader2, ExternalLink, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';
import { useConnectionStore, type ConnectionStatus } from '@/stores/connectionStore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { testWebhookConnection, testServiceViaWebhook } from '@/lib/api-service';
import { getApiLog, clearApiLog, type ApiLogEntry } from '@/lib/api-error-handler';
import { Badge } from '@/components/ui/badge';

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

function StatusIndicator({ status, message, isService }: { status: ConnectionStatus; message: string; isService?: boolean }) {
  // For services (apollo/hubspot/lemlist), use simplified labels
  if (isService) {
    const serviceMap: Record<ConnectionStatus, { icon: typeof CheckCircle2; cls: string; text: string }> = {
      connected: { icon: CheckCircle2, cls: 'text-emerald-500', text: 'Beschikbaar' },
      warning: { icon: AlertTriangle, cls: 'text-amber-500', text: message || 'Waarschuwing' },
      error: { icon: AlertTriangle, cls: 'text-red-500', text: 'Niet beschikbaar' },
      testing: { icon: Loader2, cls: 'text-muted-foreground animate-spin', text: 'Testen via n8n...' },
      not_configured: { icon: Circle, cls: 'text-muted-foreground', text: message || 'Wacht op n8n' },
    };
    const m = serviceMap[status];
    return (
      <div className="flex items-center gap-1.5">
        <m.icon className={`h-3.5 w-3.5 ${m.cls}`} />
        <span className={`text-[10px] ${m.cls}`}>{m.text}</span>
      </div>
    );
  }

  const map: Record<ConnectionStatus, { icon: typeof CheckCircle2; cls: string; text: string }> = {
    connected: { icon: CheckCircle2, cls: 'text-emerald-500', text: 'Verbonden' },
    warning: { icon: AlertTriangle, cls: 'text-amber-500', text: message || 'Waarschuwing' },
    error: { icon: AlertTriangle, cls: 'text-red-500', text: message || 'Fout' },
    testing: { icon: Loader2, cls: 'text-muted-foreground animate-spin', text: 'Testen...' },
    not_configured: { icon: Circle, cls: 'text-muted-foreground', text: message || 'Niet geconfigureerd' },
  };
  const m = map[status];
  return (
    <div className="flex items-center gap-1.5">
      <m.icon className={`h-3.5 w-3.5 ${m.cls}`} />
      <span className={`text-[10px] ${m.cls}`}>{m.text}</span>
    </div>
  );
}

const SERVICE_LABELS: Record<string, string> = {
  apollo: 'Apollo',
  dropcontact: 'Dropcontact',
  hubspot: 'HubSpot',
  lemlist: 'Lemlist',
};

function ConnectionFields({ id, config, onConfigChange }: { id: string; config: Record<string, string>; onConfigChange: (cfg: Record<string, string>) => void; status: ConnectionStatus }) {
  if (id === 'chrome-extension') {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">Installeer de Chrome extensie vanuit de Chrome Web Store en activeer deze op LinkedIn.</p>
        <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
          <ExternalLink className="h-3 w-3" /> Chrome Web Store
        </a>
      </div>
    );
  }
  if (id === 'n8n') {
    return (
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Webhook URL</label>
        <input type="text" value={config.webhookUrl || ''} onChange={(e) => onConfigChange({ webhookUrl: e.target.value })} placeholder="https://n8n.example.com/webhook/..."
          className="w-full text-xs bg-secondary/40 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>
    );
  }
  // Apollo, Dropcontact, HubSpot, Lemlist – no API key fields, managed in n8n
  const label = SERVICE_LABELS[id] || id;
  const isOptional = id === 'dropcontact';
  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border">
      <p className="text-xs text-muted-foreground">
        API keys worden beheerd in n8n. Configureer je <span className="font-medium text-foreground">{label}</span> credentials in het n8n workflow.
        {isOptional && <span className="text-amber-400 ml-1">(optioneel)</span>}
      </p>
    </div>
  );
}

function StatusIcon({ status }: { status: ConnectionStatus }) {
  switch (status) {
    case 'connected': return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
    case 'error': return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />;
    case 'testing': return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />;
    default: return <Circle className="h-4 w-4 text-muted-foreground shrink-0" />;
  }
}

/* ─── WIZARD MODE ─── */
function SetupWizard() {
  const { connections, currentSetupStep, setCurrentStep, setConnectionConfig, testConnection, completeSetup, setConnectionStatus } = useConnectionStore();
  const conn = connections[currentSetupStep];
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const n8nConn = connections.find(c => c.id === 'n8n');
  const n8nReady = n8nConn?.status === 'connected';

  const handleTest = async () => {
    if (conn.id === 'n8n') {
      setConnectionStatus(conn.id, 'testing', 'Verbinding testen...');
      const url = conn.config.webhookUrl;
      if (!url || !url.trim()) { setConnectionStatus(conn.id, 'error', 'Geen webhook URL'); return; }
      const result = await testWebhookConnection(url);
      setConnectionStatus(conn.id, result.success ? 'connected' : 'error', result.success ? 'Webhook bereikbaar' : result.error || 'Niet bereikbaar');
    } else if (conn.id === 'chrome-extension') {
      await testConnection(conn.id);
    } else {
      if (!n8nReady) { setConnectionStatus(conn.id, 'error', 'Configureer eerst n8n'); return; }
      setConnectionStatus(conn.id, 'testing', 'Testen via n8n...');
      const result = await testServiceViaWebhook(conn.id);
      setConnectionStatus(conn.id, result.success ? 'connected' : 'error', result.success ? 'API verbinding succesvol' : result.error || 'Test mislukt');
    }
  };

  const handleSkip = () => {
    skipped.add(currentSetupStep); setSkipped(new Set(skipped));
    if (currentSetupStep < connections.length - 1) setCurrentStep(currentSetupStep + 1); else completeSetup();
  };
  const handleNext = () => { if (currentSetupStep < connections.length - 1) setCurrentStep(currentSetupStep + 1); else completeSetup(); };
  const canProceed = conn.status === 'connected';
  const needsN8n = conn.id !== 'n8n' && conn.id !== 'chrome-extension' && !n8nReady;
  const isOptionalStep = conn.id === 'dropcontact';

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">Stap {currentSetupStep + 1} van {connections.length}</p>
      <div className="flex gap-8">
        <div className="shrink-0 flex flex-col">
          {connections.map((c, i) => {
            const isActive = i === currentSetupStep;
            const isPast = i < currentSetupStep;
            return (
              <div key={c.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${c.status === 'connected' ? 'bg-emerald-500' : isActive ? 'bg-primary' : 'border border-border bg-transparent'}`}>
                    {c.status === 'connected' && <Check className="h-3 w-3 text-white" />}
                    {isActive && c.status !== 'connected' && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                  </div>
                  {i < connections.length - 1 && <div className={`w-0.5 h-8 ${isPast || c.status === 'connected' ? 'bg-emerald-500' : 'bg-border'}`} />}
                </div>
                <span className={`text-xs pt-0.5 ${c.status === 'connected' ? 'text-muted-foreground line-through' : isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{c.name}</span>
              </div>
            );
          })}
        </div>

        <div className="flex-1 bg-card border border-border rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {conn.name}
              {isOptionalStep && <span className="text-[10px] text-amber-400 font-normal ml-2">(optioneel)</span>}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">{conn.description}</p>
          </div>

          {needsN8n && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="text-[10px] text-amber-400">Configureer eerst n8n — alle services communiceren via n8n webhooks</span>
            </div>
          )}

          <ConnectionFields id={conn.id} config={conn.config} onConfigChange={(cfg) => setConnectionConfig(conn.id, cfg)} status={conn.status} />

          <div className="flex items-center gap-3">
            <button onClick={handleTest} disabled={conn.status === 'testing' || needsN8n}
              className="bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 py-1.5 text-xs hover:bg-primary/20 transition-colors disabled:opacity-50">
              {conn.status === 'testing' ? <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Testen...</span> : ['apollo', 'dropcontact', 'hubspot', 'lemlist'].includes(conn.id) ? 'Test via n8n' : 'Test verbinding'}
            </button>
            <StatusIndicator status={conn.status} message={conn.statusMessage} isService={['apollo', 'dropcontact', 'hubspot', 'lemlist'].includes(conn.id)} />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <button onClick={handleSkip} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Overslaan</button>
            <button onClick={handleNext} disabled={!canProceed} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-xs disabled:opacity-40 transition-colors hover:bg-primary/90">
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
  const { connections, setConnectionConfig, testConnection, resetSetup, setConnectionStatus } = useConnectionStore();
  const [searchParams] = useSearchParams();
  const openId = searchParams.get('open');
  const [testingAll, setTestingAll] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [logEntries, setLogEntries] = useState<ApiLogEntry[]>([]);

  const n8nConn = connections.find(c => c.id === 'n8n');
  const n8nReady = n8nConn?.status === 'connected';

  const handleTest = async (id: string) => {
    const conn = connections.find(c => c.id === id);
    if (!conn) return;
    if (id === 'n8n') {
      setConnectionStatus(id, 'testing', 'Verbinding testen...');
      const url = conn.config.webhookUrl;
      if (!url || !url.trim()) { setConnectionStatus(id, 'error', 'Geen webhook URL'); return; }
      const result = await testWebhookConnection(url);
      setConnectionStatus(id, result.success ? 'connected' : 'error', result.success ? 'Webhook bereikbaar' : result.error || 'Niet bereikbaar');
    } else if (id === 'chrome-extension') {
      await testConnection(id);
    } else {
      if (!n8nReady) { setConnectionStatus(id, 'error', 'Configureer eerst n8n'); return; }
      setConnectionStatus(id, 'testing', 'Testen via n8n...');
      const result = await testServiceViaWebhook(id);
      setConnectionStatus(id, result.success ? 'connected' : 'error', result.success ? 'API verbinding succesvol' : result.error || 'Test mislukt');
    }
  };

  const handleTestAll = async () => {
    setTestingAll(true);
    for (const conn of connections) { await handleTest(conn.id); }
    setTestingAll(false);
  };

  const defaultOpen = openId ? [openId] : [];

  return (
    <div className="space-y-4">
      {/* Dependency notice */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
        <span className="text-xs text-muted-foreground">n8n</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Apollo, HubSpot, Lemlist</span>
        <span className="text-[10px] text-muted-foreground ml-2">(alle services communiceren via n8n webhooks)</span>
      </div>

      <Accordion type="multiple" defaultValue={defaultOpen}>
        {connections.map((conn) => {
          const needsN8n = conn.id !== 'n8n' && conn.id !== 'chrome-extension' && !n8nReady;
          return (
            <AccordionItem key={conn.id} value={conn.id} className="bg-card border border-border rounded-xl mb-3 overflow-hidden border-b-0">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <StatusIcon status={conn.status} />
                  <div className="flex-1 text-left">
                    <p className="text-xs font-medium text-foreground">{conn.name}</p>
                    <p className="text-[10px] text-muted-foreground">Laatst gecontroleerd: {relativeTime(conn.lastChecked)}</p>
                  </div>
                  <div className="mr-2"><StatusIndicator status={conn.status} message={conn.statusMessage} isService={['apollo', 'dropcontact', 'hubspot', 'lemlist'].includes(conn.id)} /></div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-2">
                  {needsN8n && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="text-[10px] text-amber-400">Configureer eerst n8n</span>
                    </div>
                  )}
                  <ConnectionFields id={conn.id} config={conn.config} onConfigChange={(cfg) => setConnectionConfig(conn.id, cfg)} status={conn.status} />
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleTest(conn.id)} disabled={conn.status === 'testing' || needsN8n}
                      className="bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 py-1.5 text-xs hover:bg-primary/20 transition-colors disabled:opacity-50">
                      {conn.status === 'testing' ? <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Testen...</span> : ['apollo', 'dropcontact', 'hubspot', 'lemlist'].includes(conn.id) ? 'Test via n8n' : 'Test opnieuw'}
                    </button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <button onClick={handleTestAll} disabled={testingAll}
            className="bg-primary/10 text-primary border border-primary/20 rounded-lg px-4 py-2 text-xs hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-1.5">
            {testingAll ? <><Loader2 className="h-3 w-3 animate-spin" /> Testen...</> : <><RotateCcw className="h-3 w-3" /> Alles opnieuw testen</>}
          </button>
          <button onClick={() => { setLogEntries(getApiLog()); setShowLog(!showLog); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {showLog ? 'Verberg API log' : 'Toon API log'}
          </button>
        </div>
        <button onClick={resetSetup} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Setup opnieuw starten</button>
      </div>

      {/* API Log */}
      {showLog && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">API Log</h3>
            <button onClick={() => { clearApiLog(); setLogEntries([]); }} className="text-xs text-muted-foreground hover:text-foreground">Wis log</button>
          </div>
          {logEntries.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Geen API-calls gelogd</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {logEntries.map((e, i) => (
                <div key={i} className="flex items-center gap-3 text-[10px] py-1 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground w-16 shrink-0">{new Date(e.timestamp).toLocaleTimeString('nl-BE')}</span>
                  <span className="text-foreground w-16 shrink-0">{e.service}</span>
                  <span className="text-muted-foreground flex-1">{e.action}</span>
                  <Badge className={`text-[8px] ${e.status === 'success' ? 'bg-green-500/20 text-green-400' : e.status === 'retrying' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                    {e.status}
                  </Badge>
                  {e.schemaValid !== undefined && (
                    <span title={e.schemaValid ? 'Response schema OK' : 'Response schema afwijkend'} className={e.schemaValid ? 'text-emerald-500' : 'text-amber-500'}>
                      {e.schemaValid ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    </span>
                  )}
                  <span className="text-muted-foreground w-12 text-right">{e.durationMs}ms</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function SetupPage() {
  const { setupCompleted } = useConnectionStore();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
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
