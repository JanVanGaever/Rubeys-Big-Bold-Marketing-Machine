import { useNavigate } from 'react-router-dom';
import { Zap, Upload, Users, Eye, Activity, Sparkles, Database, Send, GitBranch, Plug, SlidersHorizontal, BookOpen, AlertTriangle } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useConnectionStore } from '@/stores/connectionStore';

const mainNav = [
  { title: 'Briefing',      to: '/',             icon: Zap,        end: true },
  { title: 'Import',        to: '/import',       icon: Upload,     connectionId: 'phantombuster' },
  { title: 'Contacten',     to: '/contacten',    icon: Users },
  { title: 'Watchlists',    to: '/watchlists',   icon: Eye },
  { title: 'Signalen',      to: '/signalen',     icon: Activity },
  { title: 'Kalibratie',    to: '/kalibratie',   icon: Sparkles },
  { title: 'Enrichment',    to: '/enrichment',   icon: Database,   connectionId: 'apollo' },
  { title: 'Campagnes',     to: '/campagnes',    icon: Send,       connectionId: 'lemlist' },
  { title: 'HubSpot',       to: '/hubspot',      icon: GitBranch,  connectionId: 'hubspot' },
];

const settingsNav = [
  { title: 'Setup',         to: '/settings/setup',  icon: Plug },
  { title: 'Configuratie',  to: '/settings/config', icon: SlidersHorizontal },
];

export default function AppSidebar() {
  const connections = useConnectionStore((s) => s.connections);
  const navigate = useNavigate();

  const getConnectionAlert = (connectionId?: string) => {
    if (!connectionId) return null;
    const conn = connections.find((c) => c.id === connectionId);
    if (!conn) return null;
    if (conn.status === 'error') return 'error';
    if (conn.status === 'warning') return 'warning';
    return null;
  };

  const hasAnyAlert = connections.some((c) => c.status === 'error' || c.status === 'warning');

  return (
    <aside className="w-[220px] shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-xs">RB</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-sidebar-foreground leading-tight">Rubey's Big Bold</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Marketing Machine</p>
        </div>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {mainNav.map(item => {
          const alert = getConnectionAlert(item.connectionId);
          return (
            <NavLink key={item.to} to={item.to} end={item.end}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
              activeClassName="text-primary bg-sidebar-accent font-medium border-l-2 border-primary pl-[14px]">
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.title}</span>
              {alert && (
                <AlertTriangle className={`h-3 w-3 shrink-0 ${alert === 'error' ? 'text-red-500' : 'text-amber-500'}`} />
              )}
            </NavLink>
          );
        })}

        {/* Settings group */}
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-4 mb-1 px-4">Instellingen</p>
        {settingsNav.map(item => {
          const isSetup = item.to === '/settings/setup';
          return (
            <NavLink key={item.to} to={item.to}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
              activeClassName="text-primary bg-sidebar-accent font-medium border-l-2 border-primary pl-[14px]">
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.title}</span>
              {isSetup && hasAnyAlert && (
                <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
              )}
            </NavLink>
          );
        })}

        <NavLink to="/handleiding"
          className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          activeClassName="text-primary bg-sidebar-accent font-medium border-l-2 border-primary pl-[14px]">
          <BookOpen className="h-4 w-4 shrink-0" />Handleiding
        </NavLink>
      </nav>

      <div
        onClick={() => navigate('/settings/setup')}
        className="px-4 py-2 border-t border-sidebar-border cursor-pointer hover:bg-sidebar-accent/50 transition-colors"
      >
        <div className="flex flex-col gap-1 mb-2">
          {connections.map(c => (
            <div key={c.id} className="flex items-center gap-1.5">
              {c.status === 'connected' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              {c.status === 'warning' && <AlertTriangle className="h-3 w-3 text-amber-500" />}
              {c.status === 'error' && <AlertTriangle className="h-3 w-3 text-red-500" />}
              {c.status === 'not_configured' && <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />}
              {c.status === 'testing' && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
              <span className="text-[10px] text-muted-foreground">{c.name}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">v2.0 — Lead Catalyst</p>
      </div>
    </aside>
  );
}
