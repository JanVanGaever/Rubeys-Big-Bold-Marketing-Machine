import { Outlet, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import { useConnectionStore } from '@/stores/connectionStore';

function SystemStatusBar() {
  const connections = useConnectionStore((s) => s.connections);
  const navigate = useNavigate();
  const allConnected = connections.every(c => c.status === 'connected');
  const hasError = connections.some(c => c.status === 'error');

  return (
    <div
      onClick={() => navigate('/settings/setup')}
      className={`shrink-0 border-t border-border bg-card px-4 py-2 cursor-pointer hover:bg-secondary/20 transition-colors flex items-center gap-4 ${hasError ? 'ring-1 ring-inset ring-red-500/20' : ''}`}
    >
      {allConnected ? (
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-emerald-400">Alle systemen operationeel</span>
        </div>
      ) : (
        connections.map(c => (
          <div key={c.id} className="flex items-center gap-1.5">
            {c.status === 'connected' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            {c.status === 'warning' && <AlertTriangle className="h-3 w-3 text-amber-500" />}
            {c.status === 'error' && <AlertTriangle className="h-3 w-3 text-red-500" />}
            {c.status === 'not_configured' && <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />}
            {c.status === 'testing' && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
            <span className="text-[10px] text-muted-foreground">{c.name}</span>
          </div>
        ))
      )}
    </div>
  );
}

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
        <SystemStatusBar />
      </div>
    </div>
  );
}
