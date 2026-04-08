import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useConnectionStore } from '@/stores/connectionStore';

interface ConnectionAlertProps {
  connectionId: string;
  featureName: string;
}

export default function ConnectionAlert({ connectionId, featureName }: ConnectionAlertProps) {
  const conn = useConnectionStore((s) => s.connections.find((c) => c.id === connectionId));
  if (!conn) return null;

  if (conn.status === 'connected') return null;

  if (conn.status === 'testing') {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4">
        <p className="text-xs text-muted-foreground animate-pulse">Verbinding wordt getest...</p>
      </div>
    );
  }

  if (conn.status === 'warning') {
    return (
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 mb-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-amber-400">{featureName} werkt beperkt</p>
            {conn.statusMessage && <p className="text-xs text-muted-foreground mt-1">{conn.statusMessage}</p>}
            <Link to={`/settings/setup?open=${connectionId}`} className="text-xs text-amber-400 hover:text-amber-300 underline mt-1 inline-block">
              Bekijk in Setup
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // error or not_configured
  const message = conn.status === 'not_configured'
    ? 'Deze tool is nog niet geconfigureerd.'
    : conn.statusMessage || 'Er is een fout opgetreden.';

  return (
    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 mb-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-medium text-red-400">{featureName} is niet beschikbaar</p>
          <p className="text-xs text-muted-foreground mt-1">{message}</p>
          <Link to={`/settings/setup?open=${connectionId}`} className="text-xs text-red-400 hover:text-red-300 underline mt-1 inline-block">
            Ga naar Setup
          </Link>
        </div>
      </div>
    </div>
  );
}
