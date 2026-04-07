import { Zap, Upload, Users, Building2, Layers, Sparkles, Send, Database, Settings, BookOpen } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
const nav = [
  { title: 'Briefing',     to: '/',              icon: Zap,       end: true },
  { title: 'Import',       to: '/import',        icon: Upload },
  { title: 'Contacten',    to: '/contacts',      icon: Users },
  { title: 'Organisaties', to: '/organizations', icon: Building2 },
  { title: 'Signalen',     to: '/signals',       icon: Layers },
  { title: 'Enrichment',   to: '/enrichment',    icon: Sparkles },
  { title: 'Lemlist',      to: '/lemlist',       icon: Send },
  { title: 'HubSpot',      to: '/hubspot',       icon: Database },
  { title: 'Instellingen', to: '/settings',      icon: Settings },
  { title: 'Handleiding',  to: '/guide',         icon: BookOpen },
];
export default function AppSidebar() {
  return (
    <aside className="w-48 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-xs">RB</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-sidebar-foreground leading-tight">Rubey's Big Bold</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Marketing Machine</p>
        </div>
      </div>
      <nav className="flex-1 py-2">
        {nav.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            activeClassName="text-primary bg-sidebar-accent font-medium border-l-2 border-primary pl-[14px]">
            <item.icon className="h-3.5 w-3.5 shrink-0" />{item.title}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-sidebar-border">
        <p className="text-[10px] text-muted-foreground">v1.0 — Personal Tool</p>
      </div>
    </aside>
  );
}
