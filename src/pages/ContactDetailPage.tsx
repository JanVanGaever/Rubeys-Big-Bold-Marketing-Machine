import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Database, Linkedin, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { MOCK_CONTACTS, getScoreBadge, getOutreachLabel } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const DOMAIN_COLORS: Record<string, string> = { kunst: '#534AB7', vermogen: '#0fb57a', luxe: '#f4a261' };
const DOMAIN_LABELS: Record<string, string> = { kunst: 'Kunst & Cultuur', vermogen: 'Vermogen & Banking', luxe: 'Luxe & Kapitaal' };

export default function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const contact = MOCK_CONTACTS.find(c => c.id === id);

  if (!contact) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-muted-foreground text-sm">Contact niet gevonden</p>
      <button onClick={() => navigate('/contacts')} className="text-xs text-primary hover:underline">Terug naar contacten</button>
    </div>
  );

  const badge = getScoreBadge(contact.score);
  const kunstPts = contact.signals.filter(s => s.type === 'kunst').reduce((s, i) => s + i.weight, 0);
  const vermPts  = contact.signals.filter(s => s.type === 'vermogen').reduce((s, i) => s + i.weight, 0);
  const luxePts  = contact.signals.filter(s => s.type === 'luxe').reduce((s, i) => s + i.weight, 0);
  const hasCross = [kunstPts, vermPts, luxePts].filter(p => p > 0).length >= 2;

  return (
    <div className="space-y-5 max-w-3xl">
      <button onClick={() => navigate('/contacts')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Terug naar contacten
      </button>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-lg font-semibold text-primary">{contact.firstName[0]}{contact.lastName[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-foreground">{contact.firstName} {contact.lastName}</h1>
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded', badge.className)}>{badge.label}</span>
              {hasCross && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Cross-signaal</span>}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{contact.title} · {contact.company}</p>
            <div className="flex flex-wrap gap-3 mt-2">
              {contact.location && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{contact.location}</span>}
              {contact.emailPersonal && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{contact.emailPersonal}</span>}
              {contact.emailWork && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{contact.emailWork}</span>}
              {contact.phone && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{contact.phone}</span>}
              {contact.linkedinUrl && (
                <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  <Linkedin className="h-3 w-3" /> LinkedIn <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          </div>
          <div className="text-center shrink-0">
            <p className="text-4xl font-bold text-foreground">{contact.score}</p>
            <p className="text-[10px] text-muted-foreground">/ 100</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs rounded-lg transition-colors">
            <Send className="h-3.5 w-3.5" /> Push naar Lemlist
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-muted-foreground border border-border hover:text-foreground text-xs rounded-lg transition-colors">
            <Database className="h-3.5 w-3.5" /> Sync HubSpot
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-xs font-medium text-foreground mb-3">Score breakdown</h2>
          <div className="space-y-2">
            {([['kunst', kunstPts, 35], ['vermogen', vermPts, 35], ['luxe', luxePts, 20]] as const).map(([type, pts, max]) => (
              <div key={type}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: DOMAIN_COLORS[type] }} />
                    <span className="text-[11px] text-muted-foreground">{DOMAIN_LABELS[type]}</span>
                  </div>
                  <span className="text-[11px] font-mono text-foreground">{pts}/{max}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(pts / max) * 100}%`, background: DOMAIN_COLORS[type] }} />
                </div>
              </div>
            ))}
            {hasCross && (
              <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                <span className="text-[11px] text-emerald-400">Cross-signaal bonus</span>
                <span className="text-[11px] font-mono text-emerald-400">+10</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-xs font-medium text-foreground mb-3">Outreach status</h2>
          <div className="space-y-2">
            {[
              { label: 'Status', value: getOutreachLabel(contact.outreachStatus) },
              { label: 'Bron', value: contact.sourceType.replace('_', ' ') },
              { label: 'Lemlist', value: contact.lemlistStatus ?? 'Niet verstuurd' },
              { label: 'HubSpot', value: contact.hubspotSynced ? 'Gesynchroniseerd' : 'Niet gesynchroniseerd' },
              { label: 'Aangemaakt', value: contact.createdAt },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                <span className="text-[11px] text-muted-foreground">{row.label}</span>
                <span className="text-[11px] text-foreground">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="text-xs font-medium text-foreground mb-3">Signaalhistorie ({contact.signals.length})</h2>
        <div className="space-y-2">
          {contact.signals.map((signal, i) => (
            <div key={i} className="flex items-center gap-3 py-2 px-3 bg-secondary/30 rounded-lg">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: DOMAIN_COLORS[signal.type] }} />
              <div className="flex-1">
                <p className="text-xs text-foreground">{signal.source}</p>
                <p className="text-[10px] text-muted-foreground">{DOMAIN_LABELS[signal.type]}</p>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">+{signal.weight} pts</span>
              <span className="text-[10px] text-muted-foreground">{signal.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
