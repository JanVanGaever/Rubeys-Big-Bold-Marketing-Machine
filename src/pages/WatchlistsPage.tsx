import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Plus, ToggleLeft, ToggleRight, ExternalLink, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { WatchlistOrg, Domain, Tier } from '@/types';
import { ALL_DOMAINS } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

const TIERS: Tier[] = ['kern', 'extended', 'peripheral'];
const tierLabels: Record<Tier, string> = { kern: 'Kern', extended: 'Extended', peripheral: 'Peripheral' };
const tierColors: Record<Tier, string> = { kern: 'bg-green-500/20 text-green-400 border-green-500/30', extended: 'bg-blue-500/20 text-blue-400 border-blue-500/30', peripheral: 'bg-muted text-muted-foreground border-border' };

export default function WatchlistsPage() {
  const { watchlistOrgs, signals, toggleOrgActive, removeOrg, addWatchlistOrg } = useStore();
  const [activeDomain, setActiveDomain] = useState<Domain | 'all'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [addDomain, setAddDomain] = useState<Domain>('kunst');

  const displayDomains = activeDomain === 'all' ? ALL_DOMAINS : [activeDomain as Domain];
  const activeCount = watchlistOrgs.filter(o => o.isActive).length;
  const phantomCapacity = 50;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Watchlists</h1>
          <p className="text-xs text-muted-foreground">{watchlistOrgs.length} organisaties over {ALL_DOMAINS.length} domeinen</p>
        </div>
      </div>

      {/* Domain tabs */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant={activeDomain === 'all' ? 'default' : 'outline'} className="text-xs h-8" onClick={() => setActiveDomain('all')}>Alle</Button>
        {ALL_DOMAINS.map(d => (
          <Button key={d} size="sm" variant={activeDomain === d ? 'default' : 'outline'} className="text-xs h-8 gap-1.5" onClick={() => setActiveDomain(d)}>
            <div className="w-2 h-2 rounded-full" style={{ background: DOMAIN_META[d].color }} />
            {DOMAIN_META[d].name.split(' ')[0]}
          </Button>
        ))}
      </div>

      {/* Domain columns */}
      <div className={`grid gap-4 ${activeDomain === 'all' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 max-w-2xl'}`}>
        {displayDomains.map(domain => {
          const orgs = watchlistOrgs.filter(o => o.domain === domain);
          return (
            <Card key={domain} className="bg-card border-border">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: DOMAIN_META[domain].color }} />
                    <h3 className="text-sm font-semibold text-foreground">{DOMAIN_META[domain].name}</h3>
                    <Badge variant="outline" className="text-[10px]">{orgs.length}</Badge>
                  </div>
                  <Button size="sm" variant="ghost" className="text-xs h-7 gap-1" onClick={() => { setAddDomain(domain); setShowAdd(true); }}>
                    <Plus className="h-3 w-3" />Toevoegen
                  </Button>
                </div>

                {TIERS.map(tier => {
                  const tierOrgs = orgs.filter(o => o.tier === tier);
                  if (tierOrgs.length === 0) return null;
                  return (
                    <div key={tier} className="space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{tierLabels[tier]}</p>
                      {tierOrgs.map(org => {
                        const orgSignals = signals.filter(s => s.orgId === org.id);
                        return (
                          <div key={org.id} className={`flex items-center gap-3 p-2 rounded border transition-colors ${org.isActive ? 'border-border bg-muted/20' : 'border-border/50 bg-muted/5 opacity-50'}`}>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{org.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{org.linkedinUrl.replace('https://', '')}</p>
                            </div>
                            <Badge variant="outline" className={`text-[10px] ${tierColors[tier]}`}>{tierLabels[tier]}</Badge>
                            <div className="text-[10px] text-muted-foreground text-right shrink-0">
                              <p>{org.postsScrapedCount} posts</p>
                              <p>{orgSignals.length} leads</p>
                            </div>
                            <button onClick={() => toggleOrgActive(org.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                              {org.isActive ? <ToggleRight className="h-4 w-4 text-green-400" /> : <ToggleLeft className="h-4 w-4" />}
                            </button>
                            <button onClick={() => removeOrg(org.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary footer */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-6 text-xs">
            <div>
              <p className="text-muted-foreground">Actieve organisaties</p>
              <p className="text-lg font-bold text-foreground">{activeCount} / {watchlistOrgs.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Geschatte dagelijkse posts</p>
              <p className="text-lg font-bold text-foreground">~{Math.round(activeCount * 0.5)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phantombuster capaciteit</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={(activeCount / phantomCapacity) * 100} className="flex-1 h-2" />
                <span className="text-foreground font-medium">{activeCount}/{phantomCapacity}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add org dialog */}
      <AddOrgDialog open={showAdd} onClose={() => setShowAdd(false)} defaultDomain={addDomain} />
    </div>
  );
}

function AddOrgDialog({ open, onClose, defaultDomain }: { open: boolean; onClose: () => void; defaultDomain: Domain }) {
  const { addWatchlistOrg } = useStore();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [domain, setDomain] = useState<Domain>(defaultDomain);
  const [tier, setTier] = useState<Tier>('extended');

  const handleSave = () => {
    if (!name || !url) return;
    addWatchlistOrg({
      id: `org-${Date.now()}`,
      name, linkedinUrl: url, domain, tier, isActive: true,
      postsScrapedCount: 0, lastScrapedAt: null,
    });
    setName(''); setUrl('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader><DialogTitle className="text-foreground">Organisatie toevoegen</DialogTitle></DialogHeader>
        <div className="space-y-3 text-xs">
          <div><Label className="text-xs">Naam *</Label><Input value={name} onChange={e => setName(e.target.value)} className="text-xs h-8 mt-1" /></div>
          <div><Label className="text-xs">LinkedIn URL *</Label><Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://linkedin.com/company/..." className="text-xs h-8 mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Domein</Label>
              <Select value={domain} onValueChange={v => setDomain(v as Domain)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_DOMAINS.map(d => <SelectItem key={d} value={d}>{DOMAIN_META[d].name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tier</Label>
              <Select value={tier} onValueChange={v => setTier(v as Tier)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIERS.map(t => <SelectItem key={t} value={t}>{tierLabels[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">Annuleren</Button>
          <Button size="sm" onClick={handleSave} className="text-xs">Toevoegen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
