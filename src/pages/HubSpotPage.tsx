import { useState } from 'react';
import { Database, RefreshCw, CheckCircle, ExternalLink } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export default function HubSpotPage() {
  const { contacts } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [lastSync] = useState('Vandaag 08:15');
  const synced = contacts.filter(c => c.hubspotSynced);
  const unsynced = contacts.filter(c => !c.hubspotSynced && c.status !== 'cold');

  const doSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">HubSpot</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Synchroniseer contacten naar HubSpot CRM</p>
        </div>
        <button onClick={doSync} disabled={syncing} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-lg transition-colors disabled:opacity-60">
          <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
          {syncing ? 'Bezig...' : 'Sync nu'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[{ label: 'Gesynchroniseerd', value: synced.length, color: 'text-emerald-400' }, { label: 'Klaar voor sync', value: unsynced.length, color: 'text-orange-400' }, { label: 'Laatste sync', value: lastSync, color: 'text-foreground' }].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className={cn('text-xl font-semibold', s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Klaar voor sync</h3>
        </div>
        <div className="divide-y divide-border">
          {unsynced.map(c => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary shrink-0">{c.firstName[0]}{c.lastName[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">{c.firstName} {c.lastName}</p>
                <p className="text-[10px] text-muted-foreground">{c.company}</p>
              </div>
              <span className="text-[10px] font-mono text-foreground">{c.score} pts</span>
              <button className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-md hover:bg-primary/20 transition-colors">
                <Database className="h-3 w-3" /> Sync
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
