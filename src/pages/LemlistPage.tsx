import { Send, Play, Pause, Users, MessageSquare, TrendingUp } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export default function LemlistPage() {
  const { contacts, campaigns } = useApp();
  const hotLeads = contacts.filter(c => c.status === 'hot' && c.outreachStatus === 'not_contacted');

  const STATUS_COLORS = { active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', paused: 'bg-orange-500/10 text-orange-400 border-orange-500/20', draft: 'bg-secondary text-muted-foreground border-border' };
  const STATUS_LABELS = { active: 'Actief', paused: 'Gepauzeerd', draft: 'Concept' };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Lemlist</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Beheer outreach campagnes en stuur leads door</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[{ label: 'Actieve campagnes', value: campaigns.filter(c => c.status === 'active').length, icon: Send }, { label: 'Hot leads klaar', value: hotLeads.length, icon: Users }, { label: 'Replies totaal', value: campaigns.reduce((s, c) => s + c.repliesCount, 0), icon: MessageSquare }].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <s.icon className="h-4 w-4 text-muted-foreground mb-2" />
            <p className="text-2xl font-semibold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Campagnes</h3>
          <button className="text-xs text-primary hover:underline">+ Nieuwe campagne</button>
        </div>
        <div className="divide-y divide-border">
          {campaigns.map(c => (
            <div key={c.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <div className="flex gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Users className="h-3 w-3" />{c.leadsCount} leads</span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><MessageSquare className="h-3 w-3" />{c.repliesCount} replies</span>
                  {c.leadsCount > 0 && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><TrendingUp className="h-3 w-3" />{Math.round((c.repliesCount / c.leadsCount) * 100)}%</span>}
                </div>
              </div>
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full border', STATUS_COLORS[c.status])}>{STATUS_LABELS[c.status]}</span>
              <button className="flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 text-primary border border-primary/20 text-[10px] rounded-md hover:bg-primary/20 transition-colors">
                <Send className="h-3 w-3" /> Push leads
              </button>
            </div>
          ))}
        </div>
      </div>

      {hotLeads.length > 0 && (
        <div className="bg-card border border-primary/20 rounded-xl p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">{hotLeads.length} hot leads wachten op outreach</h3>
          <div className="space-y-2">
            {hotLeads.slice(0, 3).map(c => (
              <div key={c.id} className="flex items-center gap-3 py-1.5 px-3 bg-secondary/30 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary shrink-0">{c.firstName[0]}{c.lastName[0]}</div>
                <p className="text-xs text-foreground flex-1">{c.firstName} {c.lastName} · {c.company}</p>
                <span className="text-[10px] font-mono text-primary">{c.score} pts</span>
                <button className="text-[10px] px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md hover:bg-primary/20 transition-colors">Push</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
