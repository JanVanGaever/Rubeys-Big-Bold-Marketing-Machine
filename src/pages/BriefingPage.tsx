import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Zap, TrendingUp, Clock, Send, CalendarClock } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ALL_DOMAINS } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export default function BriefingPage() {
  const { contacts, signals, settings } = useStore();
  const today = new Date('2026-04-07');

  const newHot = useMemo(() => contacts.filter(c => c.status === 'hot' && c.source === 'auto' && !c.lemlistCampaignId), [contacts]);
  const followUp = useMemo(() => contacts.filter(c => c.status === 'hot' && c.lemlistCampaignId && c.lemlistPushedAt && (today.getTime() - new Date(c.lemlistPushedAt).getTime()) > 7 * 86400000), [contacts]);
  const warmRisers = useMemo(() => contacts.filter(c => c.status === 'warm').sort((a, b) => b.totalScore - a.totalScore), [contacts]);
  const actionable = [...newHot, ...followUp];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Dinsdag 7 april</p>
          <h1 className="text-2xl font-bold text-foreground">{actionable.length > 0 ? `${actionable.length} lead${actionable.length > 1 ? 's' : ''} klaar voor outreach` : 'Geen directe acties vandaag'}</h1>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Nieuw hot', value: newHot.length, icon: Zap, color: 'text-red-400' },
          { label: 'Follow-up nodig', value: followUp.length, icon: Clock, color: 'text-amber-400' },
          { label: 'Warm stijgers', value: warmRisers.length, icon: TrendingUp, color: 'text-blue-400' },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {actionable.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Vandaag actie nemen</h2>
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
            {actionable.map(c => {
              const isFollowUp = !!c.lemlistCampaignId;
              const daysSincePush = c.lemlistPushedAt ? Math.floor((today.getTime() - new Date(c.lemlistPushedAt).getTime()) / 86400000) : 0;
              return (
                <motion.div key={c.id} variants={fadeIn}>
                  <Card className="bg-card border-border">
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-foreground">{c.firstName[0]}{c.lastName[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{c.firstName} {c.lastName}</p>
                            <p className="text-xs text-muted-foreground">{c.title} — {c.company}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-foreground">{c.totalScore}</p>
                            <p className="text-[10px] text-muted-foreground">{c.activeDomainCount} domeinen</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {ALL_DOMAINS.filter(d => c.domains[d].signalCount > 0).map(d => {
                            const meta = settings.domainConfig[d];
                            const lastOrg = signals.filter(s => s.contactLinkedinUrl === c.linkedinUrl && s.domain === d).sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))[0];
                            return (
                              <Badge key={d} variant="outline" className="text-[10px] px-2 py-0.5" style={{ borderColor: meta.color, color: meta.color }}>
                                {meta.name.split(' ')[0]}: {lastOrg?.orgName} {lastOrg?.engagementType === 'like' ? 'liked' : 'comment'}
                              </Badge>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                          {isFollowUp ? `Follow-up: ${daysSincePush} dagen geen reactie na Lemlist` : `Score drempel bereikt: actief in ${c.activeDomainCount} domeinen`}
                        </p>
                      </div>
                      <Button size="sm" variant="default" className="shrink-0 text-xs gap-1">
                        {isFollowUp ? <><CalendarClock className="h-3.5 w-3.5" />Hercontact</> : <><Send className="h-3.5 w-3.5" />Push naar Lemlist</>}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      )}

      {warmRisers.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Stijgers om in de gaten te houden</h2>
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-3 font-medium">Naam</th>
                    <th className="text-center p-3 font-medium">Score</th>
                    <th className="text-center p-3 font-medium">Domeinen</th>
                    <th className="text-right p-3 font-medium">Laatste signaal</th>
                  </tr>
                </thead>
                <tbody>
                  {warmRisers.slice(0, 8).map(c => (
                    <tr key={c.id} className="border-b border-border/50 last:border-0">
                      <td className="p-3 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-semibold">{c.firstName[0]}{c.lastName[0]}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{c.firstName} {c.lastName}</p>
                          <p className="text-muted-foreground">{c.company}</p>
                        </div>
                      </td>
                      <td className="p-3 text-center font-semibold text-foreground">{c.totalScore}</td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          {ALL_DOMAINS.map(d => (
                            <div key={d} className="w-2.5 h-2.5 rounded-full" style={{ background: settings.domainConfig[d].color, opacity: c.domains[d].signalCount > 0 ? 1 : 0.15 }} />
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-right text-muted-foreground">
                        {(() => {
                          const last = ALL_DOMAINS.map(d => c.domains[d].lastSignalAt).filter(Boolean).sort().reverse()[0];
                          return last ? formatDistanceToNow(new Date(last), { addSuffix: true, locale: nl }) : '—';
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
