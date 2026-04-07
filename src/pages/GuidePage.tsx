import { BookOpen, ChevronRight } from 'lucide-react';

const sections = [
  { title: 'Hoe werkt de score?', content: 'De score is opgebouwd uit 5 componenten: engagement (25%), profiel keywords (25%), cross-signaal (25%), enrichment (15%) en org diversiteit (10%). Een lead die reageert op zowel KMSKA als Bank Delen krijgt een cross-signaal bonus van +10 punten.' },
  { title: 'Wat zijn signalen?', content: 'Signalen zijn LinkedIn-engagements (likes en reacties) van een lead op posts van organisaties in jouw Signaal Architectuur. Organisaties hoger op de ranglijst geven meer punten. KMSKA op positie 1 geeft 35 punten per engagement.' },
  { title: 'Hoe werkt de Chrome-extensie?', content: 'De extensie draait in jouw LinkedIn browser. Wanneer je een profiel bezoekt, zie je rechtsboven een badge met de score. Klik op "Opslaan" om het contact aan de app toe te voegen. De extensie laat jou ook de context van het engagement opgeven.' },
  { title: 'Wat is AI Kalibratie?', content: 'Na het converteren van leads analyseert de AI de LinkedIn-activiteit van jouw klanten en vergelijkt die met jouw signaalmodel. Ze suggereert aanpassingen op 3 niveaus: rangorde (welke org staat te laag), lidmaatschap (nieuwe org toevoegen) en domein (nieuwe pijler overwegen).' },
  { title: 'Hoe gebruik ik Lemlist?', content: 'Selecteer hot leads in de Briefing of Contacten pagina en klik "Push naar Lemlist". Kies de campagne en het e-mailadres (privé of werk). De app geeft standaard het privé-adres als dat beschikbaar is.' },
];

export default function GuidePage() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Handleiding</h1>
      </div>
      <div className="space-y-3">
        {sections.map(s => (
          <details key={s.title} className="bg-card border border-border rounded-xl overflow-hidden group">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none hover:bg-secondary/20 transition-colors">
              <span className="text-sm font-medium text-foreground">{s.title}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
            </summary>
            <div className="px-4 pb-4 pt-1">
              <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
