import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2, Send } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { pushToLemlist, isConnectionReady } from '@/lib/api-service';
import { toast } from 'sonner';
import type { Contact } from '@/types';

interface Props {
  contacts: Contact[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function LemlistPushDialog({ contacts, open, onOpenChange, onSuccess }: Props) {
  const { campaigns, updateContact } = useStore();
  const [campaignId, setCampaignId] = useState('');
  const [pushing, setPushing] = useState(false);
  const ready = isConnectionReady('lemlist');

  const withEmail = contacts.filter(c => c.email);
  const withoutEmail = contacts.filter(c => !c.email);

  const handlePush = async () => {
    if (!campaignId || withEmail.length === 0) return;

    if (!ready) {
      toast.error('Lemlist is niet geconfigureerd. Ga naar Setup.');
      return;
    }

    setPushing(true);
    const result = await pushToLemlist(
      withEmail.map(c => ({
        email: c.email!,
        firstName: c.firstName,
        lastName: c.lastName,
        company: c.company || undefined,
        linkedinUrl: c.linkedinUrl,
      })),
      campaignId
    );
    setPushing(false);

    if (result.success) {
      withEmail.forEach(c => {
        updateContact(c.id, { lemlistCampaignId: campaignId, lemlistPushedAt: new Date().toISOString() });
      });
      toast.success(`${withEmail.length} contact${withEmail.length > 1 ? 'en' : ''} toegevoegd aan campagne`);
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.error || 'Push naar Lemlist mislukt');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Push naar Lemlist campagne</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-xs">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Kies campagne</label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecteer campagne..." /></SelectTrigger>
              <SelectContent>
                {campaigns.filter(c => c.status === 'active').map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-foreground font-medium">{withEmail.length} contact{withEmail.length !== 1 ? 'en' : ''} worden gepusht</p>
            {withoutEmail.length > 0 && (
              <div className="flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                <span>{withoutEmail.length} overgeslagen (geen email). Verrijk eerst via Enrichment.</span>
              </div>
            )}
          </div>

          {withEmail.length > 0 && withEmail.length <= 5 && (
            <div className="space-y-1">
              {withEmail.map(c => (
                <div key={c.id} className="flex items-center justify-between py-1">
                  <span className="text-foreground">{c.firstName} {c.lastName}</span>
                  <span className="text-muted-foreground">{c.email}</span>
                </div>
              ))}
            </div>
          )}

          {!ready && (
            <Badge variant="outline" className="text-amber-400 border-amber-400/30 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />Lemlist of n8n niet geconfigureerd
            </Badge>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">Annuleren</Button>
          <Button size="sm" onClick={handlePush} disabled={!campaignId || withEmail.length === 0 || pushing || !ready} className="text-xs gap-1">
            {pushing ? <><Loader2 className="h-3 w-3 animate-spin" />Pushen...</> : <><Send className="h-3 w-3" />Push</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
