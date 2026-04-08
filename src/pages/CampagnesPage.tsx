import { useState, useMemo } from 'react';
import ConnectionAlert from '@/components/ConnectionAlert';
import { Send, Play, Pause, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Contact } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDomainColor } from '@/types';
import { isConnectionReady, fetchLemlistCampaigns } from '@/lib/api-service';
import LemlistPushDialog from '@/components/LemlistPushDialog';
import { toast } from 'sonner';

const statusIcons = { active: Play, paused: Pause, completed: CheckCircle2 };
const statusLabels = { active: 'Actief', paused: 'Gepauzeerd', completed: 'Voltooid' };
const statusColors = { active: 'text-green-400', paused: 'text-amber-400', completed: 'text-muted-foreground' };

export default function CampagnesPage() {
  const { campaigns, contacts, settings } = useStore();
  const ready = isConnectionReady('lemlist');

  const [pushDialogOpen, setPushDialogOpen] = useState(false);
  const [pushContacts, setPushContacts] = useState<Contact[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const pushQueue = useMemo(() =>
    contacts.filter(c => c.status === 'hot' && !c.lemlistCampaignId).sort((a, b) => b.totalScore - a.totalScore),
    [contacts]
  );

  const handlePushSingle = (contact: Contact) => {
    setPushContacts([contact]);
    setPushDialogOpen(true);
  };

  const handlePushAll = () => {
    setPushContacts(pushQueue);
    setPushDialogOpen(true);
  };

  const handleRefresh = async () => {
    if (!ready) { toast.error('Lemlist of n8n niet geconfigureerd'); return; }
    setRefreshing(true);
    const result = await fetchLemlistCampaigns();
    setRefreshing(false);
    if (result.success) {
      toast.success('Campagne data vernieuwd');
    } else {
      toast.error(result.error || 'Campagnes ophalen mislukt');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Campagnes</h1>
        <p className="text-xs text-muted-foreground">Lemlist campagnes en push queue</p>
      </div>
      <ConnectionAlert connectionId="lemlist" featureName="Campagnes" />

      {!ready && (
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 text-xs text-amber-400">
            Toont demo-data. Configureer Lemlist in Setup voor echte campagnes.
          </CardContent>
        </Card>
      )}

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
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{statusLabels[camp.status]}</Badge>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleRefresh} disabled={refreshing}>
                      {refreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    </Button>
                  </div>
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
                          {(settings.domains ?? []).map(dd => (
                            <div key={dd.id} className="w-2 h-2 rounded-full" style={{
                              background: dd.color,
                              opacity: (c.domains[dd.id]?.signalCount ?? 0) > 0 ? 1 : 0.15,
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
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Push queue — Hot leads zonder campagne</h2>
          {pushQueue.length > 0 && (
            <Button size="sm" onClick={handlePushAll} disabled={!ready} className="text-xs gap-1">
              <Send className="h-3 w-3" /> Push alle hot leads
            </Button>
          )}
        </div>
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
                    <th className="text-center p-3 font-medium">Email</th>
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
                      <td className="p-3 text-center">
                        {c.email ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400 mx-auto" /> : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          {(settings.domains ?? []).map(dd => (
                            <div key={dd.id} className="w-2.5 h-2.5 rounded-full" style={{
                              background: dd.color,
                              opacity: (c.domains[dd.id]?.signalCount ?? 0) > 0 ? 1 : 0.15,
                            }} />
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="outline" className="text-xs h-7 gap-1" disabled={!ready} onClick={() => handlePushSingle(c)}>
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

      <LemlistPushDialog contacts={pushContacts} open={pushDialogOpen} onOpenChange={setPushDialogOpen} />
    </div>
  );
}
