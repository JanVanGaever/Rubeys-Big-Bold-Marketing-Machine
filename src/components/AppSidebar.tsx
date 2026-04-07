import { Zap, Upload, Users, Eye, Activity, Database, Send, GitBranch, Settings, BookOpen } from 'lucide-react';
import { NavLink } from '@/components/NavLink';

const nav = [
  { title: 'Briefing',      to: '/',             icon: Zap,        end: true },
  { title: 'Import',        to: '/import',       icon: Upload },
  { title: 'Contacten',     to: '/contacten',    icon: Users },
  { title: 'Watchlists',    to: '/watchlists',   icon: Eye },
  { title: 'Signalen',      to: '/signalen',     icon: Activity },
  { title: 'Enrichment',    to: '/enrichment',   icon: Database },
  { title: 'Campagnes',     to: '/campagnes',    icon: Send },
  { title: 'HubSpot',       to: '/hubspot',      icon: GitBranch },
  { title: 'Instellingen',  to: '/instellingen', icon: Settings },
  { title: 'Handleiding',   to: '/handleiding',  icon: BookOpen },
];

export default function AppSidebar() {
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
        {nav.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            activeClassName="text-primary bg-sidebar-accent font-medium border-l-2 border-primary pl-[14px]">
            <item.icon className="h-4 w-4 shrink-0" />{item.title}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-sidebar-border">
        <p className="text-[10px] text-muted-foreground">v2.0 — Lead Catalyst</p>
      </div>
    </aside>
  );
}
