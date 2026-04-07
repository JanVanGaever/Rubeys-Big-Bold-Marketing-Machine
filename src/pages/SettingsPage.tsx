import { useState, useCallback } from 'react';
import { Eye, EyeOff, Plus, Trash2, Save, RefreshCw, ChevronUp, ChevronDown, Palette } from 'lucide-react';
import { DEFAULT_SETTINGS, MOCK_DOMAINS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import type { AppSettings, Domain } from '@/types';

type Tab = 'api' | 'scoring' | 'keywords' | 'hubspot' | 'domains';

const PRESET_COLORS = ['#534AB7', '#0fb57a', '#f4a261', '#e63946', '#457b9d', '#e9c46a', '#2a9d8f', '#f72585', '#7209b7', '#4cc9f0'];

function ApiKeyField({ label, field, settings, show, onToggleShow, onChange }: {
  label: string; field: keyof AppSettings; settings: AppSettings;
  show: boolean; onToggleShow: () => void; onChange: (val: string) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-xs font-medium text-foreground mb-3">{label}</h3>
      <div className="flex gap-2">
        <input
          type={show ? 'text' : 'password'}
          value={settings[field] as string}
          onChange={e => onChange(e.target.value)}
          placeholder={`Voer ${label} in...`}
          className="flex-1 font-mono text-xs bg-secondary/40 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button onClick={onToggleShow} className="p-2 rounded-lg border border-border bg-secondary/40 text-muted-foreground hover:text-foreground transition-colors">
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button className="px-3 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">Test</button>
        <button className="px-3 py-2 text-xs bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors">Opslaan</button>
      </div>
    </div>
  );
}

function DomainCard({ domain, index, total, onUpdate, onDelete, onMoveUp, onMoveDown }: {
  domain: Domain; index: number; total: number;
  onUpdate: (id: string, partial: Partial<Domain>) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showColors, setShowColors] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        {/* Move arrows */}
        <div className="flex flex-col gap-0.5 pt-0.5 shrink-0">
          <button onClick={() => onMoveUp(domain.id)} disabled={index === 0}
            className={cn('p-0.5 rounded transition-colors', index === 0 ? 'text-muted-foreground/20' : 'text-muted-foreground hover:text-foreground')}>
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onMoveDown(domain.id)} disabled={index === total - 1}
            className={cn('p-0.5 rounded transition-colors', index === total - 1 ? 'text-muted-foreground/20' : 'text-muted-foreground hover:text-foreground')}>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Color dot + name */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowColors(!showColors)}
                className="w-5 h-5 rounded-full border border-border shrink-0 hover:ring-2 hover:ring-primary/30 transition-all"
                style={{ background: domain.color }} />
              {showColors && (
                <div className="absolute top-7 left-0 z-10 bg-card border border-border rounded-lg p-2 shadow-xl grid grid-cols-5 gap-1.5">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => { onUpdate(domain.id, { color: c }); setShowColors(false); }}
                      className={cn('w-5 h-5 rounded-full border transition-all hover:scale-110', c === domain.color ? 'border-foreground ring-2 ring-primary/40' : 'border-border/50')}
                      style={{ background: c }} />
                  ))}
                  <div className="col-span-5 mt-1">
                    <input type="color" value={domain.color}
                      onChange={e => onUpdate(domain.id, { color: e.target.value })}
                      className="w-full h-6 rounded cursor-pointer bg-transparent border-0" />
                  </div>
                </div>
              )}
            </div>
            <input value={domain.name}
              onChange={e => onUpdate(domain.id, { name: e.target.value })}
              className="flex-1 text-sm font-medium bg-transparent text-foreground border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors px-1 py-0.5" />
          </div>
          <input value={domain.description ?? ''}
            onChange={e => onUpdate(domain.id, { description: e.target.value })}
            placeholder="Beschrijving (optioneel)..."
            className="w-full text-xs bg-transparent text-muted-foreground border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors px-1 py-0.5 placeholder:text-muted-foreground/40" />
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Max points */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Max pts</span>
            <input type="number" min={1} max={100} value={domain.maxPoints}
              onChange={e => onUpdate(domain.id, { maxPoints: Math.max(1, +e.target.value) })}
              className="w-14 text-xs bg-secondary/40 border border-border rounded-lg px-2 py-1.5 text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          {/* Active toggle */}
          <button onClick={() => onUpdate(domain.id, { isActive: !domain.isActive })}
            className={cn('w-9 h-5 rounded-full transition-all shrink-0 relative', domain.isActive ? 'bg-primary' : 'bg-secondary border border-border')}>
            <div className={cn('w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all', domain.isActive ? 'left-[18px]' : 'left-0.5')} />
          </button>

          {/* Delete */}
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button onClick={() => onDelete(domain.id)}
                className="px-2 py-1 text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500/20 transition-colors">
                Verwijder
              </button>
              <button onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-[10px] border border-border text-muted-foreground rounded hover:text-foreground transition-colors">
                Annuleer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 pl-8 text-[10px] text-muted-foreground/50">
        <span>Sorteer: {domain.sortOrder}</span>
        <span>·</span>
        <span>{domain.items.length} organisaties</span>
        <span>·</span>
        <span>{domain.isActive ? 'Actief' : 'Inactief'}</span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('api');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [show, setShow] = useState({ apollo: false, lemlist: false, hubspot: false, phantombuster: false });
  const [newKeyword, setNewKeyword] = useState('');
  const [newKeywordType, setNewKeywordType] = useState<'positive' | 'negative'>('positive');
  const [domains, setDomains] = useState<Domain[]>(MOCK_DOMAINS);

  const totalWeight = Object.values(settings.scoreWeights).reduce((a, b) => a + b, 0);

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    if (newKeywordType === 'positive') {
      setSettings(s => ({ ...s, positiveKeywords: [...s.positiveKeywords, newKeyword.trim()] }));
    } else {
      setSettings(s => ({ ...s, negativeKeywords: [...s.negativeKeywords, newKeyword.trim()] }));
    }
    setNewKeyword('');
  };

  const updateDomain = useCallback((id: string, partial: Partial<Domain>) => {
    setDomains(prev => prev.map(d => d.id === id ? { ...d, ...partial } : d));
  }, []);

  const deleteDomain = useCallback((id: string) => {
    setDomains(prev => {
      const filtered = prev.filter(d => d.id !== id);
      return filtered.map((d, i) => ({ ...d, sortOrder: i + 1 }));
    });
  }, []);

  const moveDomain = useCallback((id: string, direction: 'up' | 'down') => {
    setDomains(prev => {
      const idx = prev.findIndex(d => d.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next.map((d, i) => ({ ...d, sortOrder: i + 1 }));
    });
  }, []);

  const addDomain = useCallback(() => {
    const newDomain: Domain = {
      id: `domain-${Date.now()}`,
      name: 'Nieuw domein',
      description: '',
      color: PRESET_COLORS[domains.length % PRESET_COLORS.length],
      maxPoints: 20,
      sortOrder: domains.length + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      items: [],
    };
    setDomains(prev => [...prev, newDomain]);
  }, [domains.length]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'api', label: 'API Keys' },
    { id: 'scoring', label: 'Scoring' },
    { id: 'keywords', label: 'Keywords' },
    { id: 'hubspot', label: 'HubSpot Mapping' },
    { id: 'domains', label: 'Domeinen' },
  ];

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Instellingen</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Configureer scoring, API keys en integraties</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn('px-4 py-2 text-xs transition-colors border-b-2 -mb-px',
              tab === t.id ? 'text-primary border-primary font-medium' : 'text-muted-foreground border-transparent hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* API Keys */}
      {tab === 'api' && (
        <div className="space-y-3">
          <ApiKeyField label="Apollo API Key" field="apolloApiKey" settings={settings} show={show.apollo} onToggleShow={() => setShow(s => ({ ...s, apollo: !s.apollo }))} onChange={v => setSettings(s => ({ ...s, apolloApiKey: v }))} />
          <ApiKeyField label="Lemlist API Key" field="lemlistApiKey" settings={settings} show={show.lemlist} onToggleShow={() => setShow(s => ({ ...s, lemlist: !s.lemlist }))} onChange={v => setSettings(s => ({ ...s, lemlistApiKey: v }))} />
          <ApiKeyField label="HubSpot Private App Token" field="hubspotToken" settings={settings} show={show.hubspot} onToggleShow={() => setShow(s => ({ ...s, hubspot: !s.hubspot }))} onChange={v => setSettings(s => ({ ...s, hubspotToken: v }))} />
          <ApiKeyField label="Phantombuster API Key" field="phantombusterApiKey" settings={settings} show={show.phantombuster} onToggleShow={() => setShow(s => ({ ...s, phantombuster: !s.phantombuster }))} onChange={v => setSettings(s => ({ ...s, phantombusterApiKey: v }))} />
        </div>
      )}

      {/* Scoring */}
      {tab === 'scoring' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium text-foreground">Component gewichten</h3>
              <span className={cn('text-[10px] font-mono px-2 py-0.5 rounded', totalWeight === 100 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
                Totaal: {totalWeight}/100
              </span>
            </div>
            <div className="space-y-3">
              {(Object.entries(settings.scoreWeights) as [keyof typeof settings.scoreWeights, number][]).map(([key, value]) => {
                const labels: Record<string, string> = { engagement: 'Engagement', profileKeywords: 'Profiel Keywords', crossSignal: 'Cross-signaal', enrichment: 'Enrichment', orgDiversity: 'Org. Diversiteit' };
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-36 shrink-0">{labels[key]}</span>
                    <input
                      type="range" min={0} max={50} step={5} value={value}
                      onChange={e => setSettings(s => ({ ...s, scoreWeights: { ...s.scoreWeights, [key]: +e.target.value } }))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-xs font-mono text-foreground w-8 text-right">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-medium text-foreground mb-3">Drempelwaarden</h3>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Hot ≥</span>
                <input type="number" value={settings.hotThreshold} onChange={e => setSettings(s => ({ ...s, hotThreshold: +e.target.value }))}
                  className="w-16 text-xs bg-secondary/40 border border-border rounded-lg px-2 py-1.5 text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Warm ≥</span>
                <input type="number" value={settings.warmThreshold} onChange={e => setSettings(s => ({ ...s, warmThreshold: +e.target.value }))}
                  className="w-16 text-xs bg-secondary/40 border border-border rounded-lg px-2 py-1.5 text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-lg transition-colors">
              <Save className="h-3.5 w-3.5" /> Opslaan & herbereken scores
            </button>
          </div>
        </div>
      )}

      {/* Keywords */}
      {tab === 'keywords' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-xs font-medium text-foreground mb-3">Keyword toevoegen</h3>
            <div className="flex gap-2">
              <input
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addKeyword()}
                placeholder="Nieuw keyword..."
                className="flex-1 text-xs bg-secondary/40 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <select
                value={newKeywordType}
                onChange={e => setNewKeywordType(e.target.value as 'positive' | 'negative')}
                className="text-xs bg-secondary/40 border border-border rounded-lg px-2 py-2 text-muted-foreground focus:outline-none"
              >
                <option value="positive">Positief (+10)</option>
                <option value="negative">Negatief (-20)</option>
              </select>
              <button onClick={addKeyword} className="flex items-center gap-1 px-3 py-2 bg-primary/10 text-primary border border-primary/20 text-xs rounded-lg hover:bg-primary/20 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Toevoegen
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-xs font-medium text-emerald-400 mb-3">Positief ({settings.positiveKeywords.length})</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {settings.positiveKeywords.map(kw => (
                  <div key={kw} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-secondary/40 group">
                    <span className="text-xs text-foreground">{kw}</span>
                    <button onClick={() => setSettings(s => ({ ...s, positiveKeywords: s.positiveKeywords.filter(k => k !== kw) }))}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-xs font-medium text-red-400 mb-3">Negatief ({settings.negativeKeywords.length})</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {settings.negativeKeywords.map(kw => (
                  <div key={kw} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-secondary/40 group">
                    <span className="text-xs text-foreground">{kw}</span>
                    <button onClick={() => setSettings(s => ({ ...s, negativeKeywords: s.negativeKeywords.filter(k => k !== kw) }))}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HubSpot mapping */}
      {tab === 'hubspot' && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-medium text-foreground">Veldmapping naar HubSpot</h3>
          {[
            { label: 'Lead source', value: "Rubey's Big Bold Marketing Machine" },
            { label: 'Lifecycle stage', value: 'lead' },
            { label: 'Contact owner', value: 'jan.van.gaever@rubey.be' },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-40 shrink-0">{row.label}</span>
              <input defaultValue={row.value} className="flex-1 text-xs bg-secondary/40 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          ))}
          <div className="pt-2">
            <button className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary border border-primary/20 text-xs rounded-lg hover:bg-primary/20 transition-colors">
              <Save className="h-3.5 w-3.5" /> Opslaan
            </button>
          </div>
        </div>
      )}

      {/* Domeinen */}
      {tab === 'domains' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{domains.length} domeinen · {domains.filter(d => d.isActive).length} actief · Totaal max: {domains.reduce((s, d) => s + (d.isActive ? d.maxPoints : 0), 0)} pts</p>
          </div>

          {domains.map((domain, idx) => (
            <DomainCard key={domain.id} domain={domain} index={idx} total={domains.length}
              onUpdate={updateDomain} onDelete={deleteDomain}
              onMoveUp={id => moveDomain(id, 'up')} onMoveDown={id => moveDomain(id, 'down')} />
          ))}

          <button onClick={addDomain}
            className="w-full flex items-center justify-center gap-1.5 py-3 border border-dashed border-border/60 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors">
            <Plus className="h-3.5 w-3.5" /> Domein toevoegen
          </button>
        </div>
      )}
    </div>
  );
}
