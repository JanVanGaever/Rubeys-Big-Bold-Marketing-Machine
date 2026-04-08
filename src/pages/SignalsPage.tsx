import { useState, useMemo } from 'react';
import ConnectionAlert from '@/components/ConnectionAlert';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Heart, MessageCircle, Activity, Users, Zap, Radio } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ALL_DOMAINS, DOMAIN_META } from '@/types';
import type { Tier } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const tierLabels: Record<Tier, string> = { kern: 'Kern', extended: 'Extended', peripheral: 'Peripheral' };

export default function SignalsPage() {
  const { signals, contacts, settings } = useStore();
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  const today = new Date('2026-04-07');
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const filtered = useMemo(() => {
    let list = [...signals].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
    if (domainFilter !== 'all') list = list.filter(s => s.domain === domainFilter);
    if (typeFilter !== 'all') list = list.filter(s => s.engagementType === typeFilter);
    if (tierFilter !== 'all') list = list.filter(s => s.tier === tierFilter);
    return list;
  }, [signals, domainFilter, typeFilter, tierFilter]);

  const signalsToday = signals.filter(s => new Date(s.detectedAt).toDateString() === today.toDateString()).length;
  const signalsWeek = signals.filter(s => new Date(s.detectedAt) >= weekAgo).length;
  const newContactsWeek = contacts.filter(c => new Date(c.addedAt) >= weekAgo).length;
  const crossSignals = contacts.filter(c => c.activeDomainCount >= 2).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Signalen</h1>
        <p className="text-xs text-muted-foreground">Alle engagement signalen — live feed</p>
      </div>
      <ConnectionAlert connectionId="chrome-extension" featureName="Signaalverzameling" />

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Vandaag', value: signalsToday, icon: Activity },
          { label: 'Deze week', value: signalsWeek, icon: Zap },
          { label: 'Nieuwe contacten', value: newContactsWeek, icon: Users },
          { label: 'Cross-signalen', value: crossSignals, icon: Heart },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border"><CardContent className="p-3 flex items-center gap-2">
            <s.icon className="h-4 w-4 text-muted-foreground" />
            <div><p className="text-lg font-bold text-foreground">{s.value}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Select value={domainFilter} onValueChange={setDomainFilter}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Domein" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle domeinen</SelectItem>
            {ALL_DOMAINS.map(d => <SelectItem key={d} value={d}>{DOMAIN_META[d].name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle types</SelectItem>
            <SelectItem value="like">Likes</SelectItem>
            <SelectItem value="comment">Comments</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Tier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle tiers</SelectItem>
            <SelectItem value="kern">Kern</SelectItem>
            <SelectItem value="extended">Extended</SelectItem>
            <SelectItem value="peripheral">Peripheral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Radio className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nog geen signalen ontvangen. Signalen verschijnen wanneer contacten interactie hebben met organisaties op je watchlist.</p>
        </div>
      ) : (
      <div className="space-y-1">
        {filtered.map(s => {
          const contact = contacts.find(c => c.linkedinUrl === s.contactLinkedinUrl);
          const isCross = contact && contact.activeDomainCount >= 2;
          const meta = settings.domainConfig[s.domain];
          return (
            <motion.div key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              className={`flex items-start gap-3 p-3 rounded border transition-colors ${isCross ? 'border-l-2 bg-muted/20' : 'border-transparent'}`}
              style={isCross ? { borderLeftColor: meta.color } : undefined}>
              <div className="text-[10px] text-muted-foreground w-20 shrink-0 pt-0.5">
                {formatDistanceToNow(new Date(s.detectedAt), { addSuffix: false, locale: nl })}
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <p className="text-foreground">
                  <span className="font-medium">{s.contactName}</span>{' '}
                  {s.engagementType === 'like' ? <><Heart className="inline h-3 w-3 text-red-400" /> liked</> : <><MessageCircle className="inline h-3 w-3 text-blue-400" /> commented on</>}{' '}
                  <span className="font-medium">{s.orgName}</span>
                </p>
                {s.commentText && <p className="text-muted-foreground truncate mt-0.5">"{s.commentText}"</p>}
                {isCross && <p className="text-[10px] mt-1 font-medium" style={{ color: meta.color }}>✨ Cross-signaal! Nu actief in {contact.activeDomainCount} domeinen</p>}
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0" style={{ borderColor: meta.color, color: meta.color }}>{meta.name.split(' ')[0]}</Badge>
              <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">{tierLabels[s.tier]}</Badge>
            </motion.div>
          );
        })}
      </div>
      )}
    </div>
  );
}
