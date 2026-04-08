import { useMemo } from 'react';
import ConnectionAlert from '@/components/ConnectionAlert';
import { Send, Play, Pause, CheckCircle2, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Contact } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ALL_DOMAINS } from '@/types';

const statusIcons = { active: Play, paused: Pause, completed: CheckCircle2 };
const statusLabels = { active: 'Actief', paused: 'Gepauzeerd', completed: 'Voltooid' };
const statusColors = { active: 'text-green-400', paused: 'text-amber-400', completed: 'text-muted-foreground' };

export default function CampagnesPage() {
  const { campaigns, contacts, settings } = useStore();

  const pushQueue = useMemo(() =>
    contacts.filter(c => c.status === 'hot' && !c.lemlistCampaignId).sort((a, b) => b.totalScore - a.totalScore),
    [contacts]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Campagnes</h1>
        <p className="text-xs text-muted-foreground">Lemlist campagnes en push queue</p>
      </div>
      <ConnectionAlert connectionId="lemlist" featureName="Campagnes" />

      {/* Campaign cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map(camp => {
          const Icon = statusIcons[camp.status];
          const replyRate = camp.emailsSent > 0 ? Math.round((camp.replies / camp.emailsSent) * 100) : 0;
          const campContacts = contacts.filter(c => c.lemlistCampaignId === camp.id);

          return (
            <Card key={camp.id} className="bg-card border-border">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${statusColors[camp.status]}`} />
                    <h3 className="text-sm font-semibold text-foreground">{camp.name}</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{statusLabels[camp.status]}</Badge>
                </div>

                <div className="grid grid-cols-4 gap-3 text-center text-xs">
                  {[
                    { label: 'Leads', value: camp.leadsCount },
                    { label: 'Verzonden', value: camp.emailsSent },
                    { label: 'Opens', value: camp.opens },
                    { label: 'Replies', value: `${camp.replies} (${replyRate}%)` },
                  ].map(s => (
                    <div key={s.label}>
                      <p className="text-lg font-bold text-foreground">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>

                {campContacts.length > 0 && (
                  <div className="space-y-1 border-t border-border pt-3">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Contacten in campagne</p>
                    {campContacts.map(c => (
                      <div key={c.id} className="flex items-center gap-2 text-xs py-1">
                        <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-[8px] font-semibold">{c.firstName[0]}{c.lastName[0]}</span>
                        </div>
                        <span className="text-foreground">{c.firstName} {c.lastName}</span>
                        <span className="text-muted-foreground">— {c.company}</span>
                        <div className="flex gap-0.5 ml-auto">
                          {ALL_DOMAINS.map(d => (
                            <div key={d} className="w-2 h-2 rounded-full" style={{
                              background: settings.domainConfig[d].color,
                              opacity: c.domains[d].signalCount > 0 ? 1 : 0.15,
                            }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Push queue */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Push queue — Hot leads zonder campagne</h2>
        {pushQueue.length === 0 ? (
          <p className="text-xs text-muted-foreground">Alle hot leads zijn al gepusht naar een campagne.</p>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-3 font-medium">Naam</th>
                    <th className="text-left p-3 font-medium">Bedrijf</th>
                    <th className="text-center p-3 font-medium">Score</th>
                    <th className="text-center p-3 font-medium">Domeinen</th>
                    <th className="text-right p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {pushQueue.map(c => (
                    <tr key={c.id} className="border-b border-border/50 last:border-0">
                      <td className="p-3 font-medium text-foreground">{c.firstName} {c.lastName}</td>
                      <td className="p-3 text-muted-foreground">{c.company}</td>
                      <td className="p-3 text-center font-semibold text-foreground">{c.totalScore}</td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          {ALL_DOMAINS.map(d => (
                            <div key={d} className="w-2.5 h-2.5 rounded-full" style={{
                              background: settings.domainConfig[d].color,
                              opacity: c.domains[d].signalCount > 0 ? 1 : 0.15,
                            }} />
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                          <Send className="h-3 w-3" />Push naar campagne
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
