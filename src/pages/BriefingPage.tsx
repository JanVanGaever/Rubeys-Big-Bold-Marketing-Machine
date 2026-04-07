import { useState } from 'react';
import { Zap, ThumbsUp, MessageSquare, Users, TrendingUp, Send, ChevronRight, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getScoreBadge } from '@/lib/mock-data';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const today = new Date().toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' });

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', color)}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

export default function BriefingPage() {
  const navigate = useNavigate();
  const { contacts, domains } = useApp();
  const [pushed, setPushed] = useState<string[]>([]);

  const hotLeads = contacts.filter(c => c.status === 'hot').slice(0, 5);
  const newToday = contacts.filter(c => c.createdAt === new Date().toISOString().slice(0, 10)).length;
  const replies = contacts.filter(c => c.outreachStatus === 'replied').length;
  const crossSignals = contacts.filter(c => new Set(c.signals.map(s => s.type)).size >= 2).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Dagelijkse Briefing</h1>
          </div>
          <p className="text-xs text-muted-foreground capitalize">{today}</p>
        </div>
        <button onClick={() => navigate('/contacts')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          Alle contacten <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={TrendingUp} label="Hot leads vandaag" value={hotLeads.length} color="bg-red-500/10 text-red-400" />
        <StatCard icon={Users} label="Nieuwe leads" value={newToday} color="bg-blue-500/10 text-blue-400" />
        <StatCard icon={MessageSquare} label="Replies" value={replies} color="bg-emerald-500/10 text-emerald-400" />
        <StatCard icon={Brain} label="Cross-signalen" value={crossSignals} color="bg-violet-500/10 text-violet-400" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-sm font-medium text-foreground">Top hot leads</h2>
          <span className="text-[10px] text-muted-foreground">Score · Signalen · Actie</span>
        </div>
        <div className="divide-y divide-border">
          {hotLeads.map(contact => {
            const badge = getScoreBadge(contact.score);
            const isPushed = pushed.includes(contact.id);
            return (
              <div key={contact.id} className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-medium text-primary">{contact.firstName[0]}{contact.lastName[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/contacts/${contact.id}`)} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                      {contact.firstName} {contact.lastName}
                    </button>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded', badge.className)}>{badge.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{contact.title} · {contact.company}</p>
                </div>
                <div className="text-center shrink-0">
                  <p className="text-lg font-semibold text-foreground">{contact.score}</p>
                  <p className="text-[10px] text-muted-foreground">score</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {domains.filter(d => d.isActive).map(d => {
                    const count = contact.signals.filter(s => s.type === d.id).length;
                    return (
                      <div key={d.id} className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-mono font-medium"
                        style={{ background: `${d.color}20`, color: d.color }}>
                        {count}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setPushed(p => [...p, contact.id])} disabled={isPushed}
                    className={cn('flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-md border transition-colors',
                      isPushed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                    )}>
                    <Send className="h-3 w-3" />
                    {isPushed ? 'Verstuurd' : 'Lemlist'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-3.5 w-3.5 text-emerald-400" />
          <h2 className="text-sm font-medium text-foreground">Recente cross-signalen</h2>
        </div>
        <div className="space-y-2">
          {contacts.filter(c => new Set(c.signals.map(s => s.type)).size >= 2).slice(0, 5).map(contact => (
            <div key={contact.id} className="flex items-center gap-3 py-2 px-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
              <div className="flex gap-1">
                {domains.filter(d => d.isActive).map(d => {
                  const has = contact.signals.some(s => s.type === d.id);
                  return <div key={d.id} className={cn('w-2 h-2 rounded-full', has ? 'opacity-100' : 'opacity-20')} style={{ background: d.color }} />;
                })}
              </div>
              <p className="text-xs text-foreground flex-1">
                <span className="font-medium">{contact.firstName} {contact.lastName}</span>
                <span className="text-muted-foreground"> — {contact.signals.length} signalen uit {new Set(contact.signals.map(s => s.type)).size} domeinen</span>
              </p>
              <span className="text-xs font-mono text-emerald-400">{contact.score} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
