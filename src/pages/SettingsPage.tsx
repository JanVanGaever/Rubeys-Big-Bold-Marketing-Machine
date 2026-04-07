import { useState } from 'react';
import { Eye, EyeOff, Plus, Trash2, Save, RefreshCw } from 'lucide-react';
import { DEFAULT_SETTINGS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import type { AppSettings } from '@/types';

type Tab = 'api' | 'scoring' | 'keywords' | 'hubspot';

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

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('api');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [show, setShow] = useState({ apollo: false, lemlist: false, hubspot: false, phantombuster: false });
  const [newKeyword, setNewKeyword] = useState('');
  const [newKeywordType, setNewKeywordType] = useState<'positive' | 'negative'>('positive');

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

  const tabs: { id: Tab; label: string }[] = [
    { id: 'api', label: 'API Keys' },
    { id: 'scoring', label: 'Scoring' },
    { id: 'keywords', label: 'Keywords' },
    { id: 'hubspot', label: 'HubSpot Mapping' },
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
          {/* Add keyword */}
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
    </div>
  );
}
