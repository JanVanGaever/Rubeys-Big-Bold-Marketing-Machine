import { useNavigate } from 'react-router-dom';
import type { Contact } from '@/types';
import { useStore } from '@/store/useStore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

const statusLabels: Record<string, string> = { hot: 'Hot', warm: 'Warm', cold: 'Cold' };
const statusColors: Record<string, string> = {
  hot: 'bg-red-500/20 text-red-400 border-red-500/30',
  warm: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  cold: 'bg-muted text-muted-foreground border-border',
};

function MiniBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-16 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] font-medium text-foreground w-6 text-right">{score}</span>
    </div>
  );
}

interface ScorePopoverProps {
  contact: Contact;
  onOpenProfile?: (contactId: string) => void;
  children: React.ReactNode;
}

export default function ScorePopover({ contact, onOpenProfile, children }: ScorePopoverProps) {
  const { settings } = useStore();
  const navigate = useNavigate();
  const c = contact;

  const handleProfileClick = () => {
    if (onOpenProfile) {
      onOpenProfile(c.id);
    } else {
      navigate(`/contacten?selected=${c.id}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[200px] p-3 space-y-2" side="left" align="start">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">{c.totalScore}/100</span>
          <Badge className={`text-[9px] ${statusColors[c.status]}`}>{statusLabels[c.status]}</Badge>
        </div>
        <div className="space-y-1.5">
          <MiniBar label="Engagement" score={c.engagementScore} />
          <MiniBar label="Keywords" score={c.keywordScore} />
          <MiniBar label="Cross-sign." score={c.crossSignalScore} />
          <MiniBar label="Enrichment" score={c.enrichmentScore} />
          <MiniBar label="Diversiteit" score={c.diversityScore} />
        </div>
        <div className="text-[9px] text-muted-foreground/60 pt-1 border-t border-border">
          Hot ≥ {settings.hotScoreThreshold} · Warm ≥ {settings.warmThreshold}
        </div>
        <button onClick={handleProfileClick} className="text-[10px] text-primary hover:underline w-full text-left">
          Bekijk volledig profiel →
        </button>
      </PopoverContent>
    </Popover>
  );
}
