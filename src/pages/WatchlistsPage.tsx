import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, ToggleLeft, ToggleRight, Trash2, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import type { WatchlistOrg, Tier } from '@/types';
import { getDomainColor, getDomainName } from '@/types';
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
  const { watchlistOrgs, signals, contacts, toggleOrgActive, removeOrg, addWatchlistOrg, settings, updateOrgRank } = useStore();
  const domainDefs = settings.domains ?? [];
  const domainIds = domainDefs.map(d => d.id);
  const [activeDomain, setActiveDomain] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [addDomainId, setAddDomainId] = useState<string>(domainIds[0] ?? '');

  const displayDomainIds = activeDomain === 'all' ? domainIds : [activeDomain];
  const activeCount = watchlistOrgs.filter(o => o.isActive).length;
  const phantomCapacity = 50;

  const customers = useMemo(() => contacts.filter(c => c.isCustomer), [contacts]);
  const customerUrls = useMemo(() => new Set(customers.map(c => c.linkedinUrl)), [customers]);
  const customerSignals = useMemo(() => signals.filter(s => customerUrls.has(s.contactLinkedinUrl)), [signals, customerUrls]);

  const orgCustomerStats = useMemo(() => {
    const stats: Record<string, { customers: number; likes: number; comments: number }> = {};
    for (const s of customerSignals) {
      if (!stats[s.orgId]) stats[s.orgId] = { customers: 0, likes: 0, comments: 0 };
      if (s.engagementType === 'like') stats[s.orgId].likes++;
      else stats[s.orgId].comments++;
    }
    for (const orgId of Object.keys(stats)) {
      const uniqueCustomers = new Set(customerSignals.filter(s => s.orgId === orgId).map(s => s.contactLinkedinUrl));
      stats[orgId].customers = uniqueCustomers.size;
    }
    return stats;
  }, [customerSignals]);

  const orgsWithEngagement = Object.keys(orgCustomerStats).filter(id => watchlistOrgs.some(o => o.id === id)).length;

  const handleRankChange = (org: WatchlistOrg, direction: 'up' | 'down') => {
    const sameGroup = watchlistOrgs.filter(o => o.domain === org.domain && o.tier === org.tier);
    const maxRank = sameGroup.length;
    const newRank = direction === 'up' ? Math.max(1, org.rank - 1) : Math.min(maxRank, org.rank + 1);
    if (newRank !== org.rank) updateOrgRank(org.id, newRank);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Watchlists</h1>
          <p className="text-xs text-muted-foreground">{watchlistOrgs.length} organisaties over {domainIds.length} domeinen</p>
        </div>
      </div>

      {customers.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{orgsWithEngagement} van {watchlistOrgs.length} organisaties hebben klant-engagement</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={(orgsWithEngagement / Math.max(watchlistOrgs.length, 1)) * 100} className="flex-1 h-1.5" />
                <span className="text-xs text-foreground font-medium">{Math.round((orgsWithEngagement / Math.max(watchlistOrgs.length, 1)) * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant={activeDomain === 'all' ? 'default' : 'outline'} className="text-xs h-8" onClick={() => setActiveDomain('all')}>Alle</Button>
        {domainDefs.map(d => (
          <Button key={d.id} size="sm" variant={activeDomain === d.id ? 'default' : 'outline'} className="text-xs h-8 gap-1.5 whitespace-nowrap" onClick={() => setActiveDomain(d.id)}>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
            {d.name}
          </Button>
        ))}
      </div>

      <div className={`grid gap-4 ${activeDomain === 'all' ? `grid-cols-1 lg:grid-cols-${Math.min(domainIds.length, 3)}` : 'grid-cols-1 max-w-2xl'}`}>
        {displayDomainIds.map(domainId => {
          const orgs = watchlistOrgs.filter(o => o.domain === domainId);
          const color = getDomainColor(domainDefs, domainId);
          const name = getDomainName(domainDefs, domainId);
          return (
            <Card key={domainId} className="bg-card border-border">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <h3 className="text-sm font-semibold text-foreground">{name}</h3>
                    <Badge variant="outline" className="text-[10px]">{orgs.length}</Badge>
                  </div>
                  <Button size="sm" variant="ghost" className="text-xs h-7 gap-1" onClick={() => { setAddDomainId(domainId); setShowAdd(true); }}>
                    <Plus className="h-3 w-3" />Toevoegen
                  </Button>
                </div>

                {TIERS.map(tier => {
                  const tierOrgs = orgs.filter(o => o.tier === tier).sort((a, b) => a.rank - b.rank);
                  if (tierOrgs.length === 0) return null;
                  return (
                    <div key={tier} className="space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{tierLabels[tier]}</p>
                      {tierOrgs.map(org => {
                        const orgSignals = signals.filter(s => s.orgId === org.id);
                        const scoreImpact = (settings.tierWeights[org.tier] / org.rank).toFixed(2);
                        const custStats = orgCustomerStats[org.id];
                        return (
                          <div key={org.id} className={`flex items-center gap-2 p-2 rounded border transition-colors ${org.isActive ? 'border-border bg-muted/20' : 'border-border/50 bg-muted/5 opacity-50'}`}>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-[10px] font-semibold text-foreground">{org.rank}</span>
                              </div>
                              <div className="flex flex-col">
                                <button onClick={(e) => { e.stopPropagation(); handleRankChange(org, 'up'); }} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
                                  <ChevronUp className="h-3 w-3" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleRankChange(org, 'down'); }} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{org.name}</p>
                              <p className="text-[10px] text-muted-foreground">Impact: {scoreImpact}</p>
                              {custStats && (
                                <p className="text-[10px] text-muted-foreground">{custStats.customers} klanten | {custStats.likes} likes | {custStats.comments} comments</p>
                              )}
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

      <AddOrgDialog open={showAdd} onClose={() => setShowAdd(false)} defaultDomain={addDomainId} />
    </div>
  );
}

function AddOrgDialog({ open, onClose, defaultDomain }: { open: boolean; onClose: () => void; defaultDomain: string }) {
  const { addWatchlistOrg, watchlistOrgs, settings } = useStore();
  const domainDefs = settings.domains ?? [];
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [domain, setDomain] = useState<string>(defaultDomain);
  const [tier, setTier] = useState<Tier>('extended');

  const handleSave = () => {
    if (!name || !url) return;
    const sameGroup = watchlistOrgs.filter(o => o.domain === domain && o.tier === tier);
    const nextRank = sameGroup.length + 1;
    addWatchlistOrg({ id: `org-${Date.now()}`, name, linkedinUrl: url, domain, tier, isActive: true, postsScrapedCount: 0, lastScrapedAt: null, rank: nextRank });
    setName(''); setUrl(''); onClose();
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
              <Select value={domain} onValueChange={v => setDomain(v)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{domainDefs.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tier</Label>
              <Select value={tier} onValueChange={v => setTier(v as Tier)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{TIERS.map(t => <SelectItem key={t} value={t}>{tierLabels[t]}</SelectItem>)}</SelectContent>
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
