import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  Users,
  Building2,
  Radio,
  Sparkles,
  Mail,
  Cable,
  Settings,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Briefing', icon: LayoutDashboard },
  { to: '/import', label: 'Import', icon: Upload },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/organizations', label: 'Organizations', icon: Building2 },
  { to: '/signals', label: 'Signals', icon: Radio },
  { to: '/enrichment', label: 'Enrichment', icon: Sparkles },
  { to: '/lemlist', label: 'Lemlist', icon: Mail },
  { to: '/hubspot', label: 'HubSpot', icon: Cable },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/guide', label: 'Guide', icon: BookOpen },
];

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-4 font-bold text-lg tracking-tight text-sidebar-primary">
          LeadEngine
        </div>
        <nav className="flex-1 space-y-0.5 px-2 py-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
