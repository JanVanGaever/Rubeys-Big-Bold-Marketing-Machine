import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ALL_DOMAINS } from '@/types';
import type { Tier } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

const TIERS: Tier[] = ['kern', 'extended', 'peripheral'];
const tierLabels: Record<Tier, string> = { kern: 'Kern', extended: 'Extended', peripheral: 'Peripheral' };

export default function SettingsPage() {
  const { settings, updateSettings } = useStore();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Instellingen</h1>
        <p className="text-xs text-muted-foreground">App configuratie en scoring parameters</p>
      </div>

      <Tabs defaultValue="scoring">
        <TabsList className="bg-muted">
          <TabsTrigger value="scoring" className="text-xs">Scoring</TabsTrigger>
          <TabsTrigger value="domeinen" className="text-xs">Domeinen</TabsTrigger>
          <TabsTrigger value="koppelingen" className="text-xs">Koppelingen</TabsTrigger>
          <TabsTrigger value="profiel" className="text-xs">Profiel</TabsTrigger>
        </TabsList>

        <TabsContent value="scoring" className="space-y-4 mt-4">
          <Card className="bg-card border-border"><CardContent className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Drempelwaarden</h3>
            <div>
              <Label className="text-xs">Hot score drempel (bij 2 domeinen)</Label>
              <Input type="number" value={settings.hotScoreThreshold} onChange={e => updateSettings({ hotScoreThreshold: Number(e.target.value) })} className="h-8 text-xs mt-1 w-32" />
              <p className="text-[10px] text-muted-foreground mt-1">3 domeinen = altijd hot. 2 domeinen = hot als score ≥ {settings.hotScoreThreshold}</p>
            </div>
          </CardContent></Card>

          <Card className="bg-card border-border"><CardContent className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Tier gewichten</h3>
            <p className="text-[10px] text-muted-foreground">Elk signaal wordt gewogen op basis van de tier van de organisatie</p>
            <div className="grid grid-cols-3 gap-4">
              {TIERS.map(tier => (
                <div key={tier}>
                  <Label className="text-xs">{tierLabels[tier]}</Label>
                  <Input type="number" value={settings.tierWeights[tier]} onChange={e => updateSettings({ tierWeights: { ...settings.tierWeights, [tier]: Number(e.target.value) } })} className="h-8 text-xs mt-1" />
                </div>
              ))}
            </div>
          </CardContent></Card>

          <Card className="bg-card border-border"><CardContent className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Manueel toevoegen gewicht</h3>
            <div>
              <Label className="text-xs">Gewicht voor manueel getagde domeinen</Label>
              <Input type="number" value={settings.manualAddWeight} onChange={e => updateSettings({ manualAddWeight: Number(e.target.value) })} className="h-8 text-xs mt-1 w-32" />
            </div>
          </CardContent></Card>

          <Card className="bg-card border-border"><CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Recency decay</h3>
            <div className="flex items-center gap-3">
              <Switch checked={settings.recencyDecay} onCheckedChange={v => updateSettings({ recencyDecay: v })} />
              <span className="text-xs text-foreground">Oudere signalen wegen minder</span>
            </div>
            {settings.recencyDecay && (
              <div>
                <Label className="text-xs">Decay factor (0-1)</Label>
                <Input type="number" step="0.05" min="0" max="1" value={settings.recencyDecayFactor} onChange={e => updateSettings({ recencyDecayFactor: Number(e.target.value) })} className="h-8 text-xs mt-1 w-32" />
              </div>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="domeinen" className="space-y-4 mt-4">
          {ALL_DOMAINS.map(d => {
            const cfg = settings.domainConfig[d];
            return (
              <Card key={d} className="bg-card border-border"><CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ background: cfg.color }} />
                  <h3 className="text-sm font-semibold text-foreground">{cfg.name}</h3>
                  <Badge variant="outline" className="text-[10px] ml-auto">{d}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Naam</Label>
                    <Input value={cfg.name} onChange={e => updateSettings({ domainConfig: { ...settings.domainConfig, [d]: { ...cfg, name: e.target.value } } })} className="h-8 text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Kleur</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={cfg.color} onChange={e => updateSettings({ domainConfig: { ...settings.domainConfig, [d]: { ...cfg, color: e.target.value } } })} className="w-8 h-8 rounded border border-border cursor-pointer" />
                      <Input value={cfg.color} onChange={e => updateSettings({ domainConfig: { ...settings.domainConfig, [d]: { ...cfg, color: e.target.value } } })} className="h-8 text-xs flex-1" />
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Beschrijving</Label>
                  <Textarea value={cfg.description} onChange={e => updateSettings({ domainConfig: { ...settings.domainConfig, [d]: { ...cfg, description: e.target.value } } })} className="text-xs mt-1 min-h-[60px]" />
                </div>
              </CardContent></Card>
            );
          })}
        </TabsContent>

        <TabsContent value="koppelingen" className="space-y-4 mt-4">
          {[
            { name: 'Phantombuster', desc: 'LinkedIn scraping & signal detection', connected: true },
            { name: 'Apollo', desc: 'Contact enrichment (email, phone)', connected: false },
            { name: 'Lemlist', desc: 'Email outreach campaigns', connected: true },
            { name: 'HubSpot', desc: 'CRM sync', connected: false },
          ].map(c => (
            <Card key={c.name} className="bg-card border-border"><CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{c.name}</p>
                <p className="text-[10px] text-muted-foreground">{c.desc}</p>
              </div>
              <Badge variant="outline" className={`text-[10px] ${c.connected ? 'text-green-400 border-green-500/30' : 'text-muted-foreground border-border'}`}>
                {c.connected ? 'Verbonden' : 'Niet verbonden'}
              </Badge>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="profiel" className="mt-4">
          <Card className="bg-card border-border"><CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Profiel</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Naam</Label><Input value="Rubey" disabled className="h-8 text-xs mt-1" /></div>
              <div><Label className="text-xs">Email</Label><Input value="rubey@merciervanderlinden.be" disabled className="h-8 text-xs mt-1" /></div>
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
