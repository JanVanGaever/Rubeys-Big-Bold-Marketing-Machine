import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SECTIONS = [
  { id: 'hoe-werkt-het', title: 'Hoe werkt Lead Catalyst?' },
  { id: 'scoring', title: 'Scoring uitgelegd' },
  { id: 'workflow', title: 'Dagelijkse workflow' },
  { id: 'watchlists', title: 'Watchlists instellen' },
  { id: 'importeren', title: 'Importeren' },
  { id: 'enrichment', title: 'Enrichment' },
  { id: 'hubspot', title: 'HubSpot integratie' },
  { id: 'faq', title: 'Veelgestelde vragen' },
];

function Tag({ children }: { children: React.ReactNode }) {
  return <code className="px-1.5 py-0.5 rounded bg-muted text-primary text-[11px] font-mono">{children}</code>;
}

export default function HandleidingPage() {
  const [activeSection, setActiveSection] = useState('hoe-werkt-het');

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-8 max-w-5xl relative">
      {/* TOC */}
      <aside className="w-48 shrink-0 hidden lg:block self-start sticky top-6">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-semibold">Inhoud</p>
        <nav className="space-y-0.5">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`block w-full text-left text-xs py-1.5 px-2 rounded transition-colors ${
                activeSection === s.id
                  ? 'text-primary bg-primary/10 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {s.title}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 space-y-10 pb-20">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Handleiding</h1>
          <p className="text-xs text-muted-foreground">Alles wat je moet weten om Lead Catalyst te gebruiken</p>
        </div>

        <section id="hoe-werkt-het" className="space-y-3 scroll-mt-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Hoe werkt Lead Catalyst?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Lead Catalyst is een lead intelligence platform dat prospects identificeert op basis van LinkedIn engagement signalen. Het systeem werkt met een <Tag>drie-domeinen model</Tag>:
          </p>
          <ol className="text-sm text-muted-foreground leading-relaxed space-y-2 list-decimal list-inside">
            <li>Je definieert domeinen (standaard: <Tag>Kunst & Cultuur</Tag>, <Tag>Vermogen & Banking</Tag>, <Tag>Luxe & Lifestyle</Tag>)</li>
            <li>Per domein monitor je LinkedIn bedrijfspagina's via <Tag>Phantombuster</Tag></li>
            <li>Wanneer iemand interactie heeft met posts van die pagina's, detecteert het systeem dit als een <Tag>signaal</Tag></li>
            <li>Hoe meer domeinen iemand actief is, hoe warmer de lead</li>
          </ol>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Het kernidee: iemand die actief is in meerdere domeinen tegelijk is waarschijnlijker een <Tag>High Net Worth</Tag> prospect dan iemand die slechts in één domein verschijnt.
          </p>
        </section>

        <section id="scoring" className="space-y-3 scroll-mt-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Scoring uitgelegd</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Elk signaal krijgt een gewicht op basis van de <Tag>tier</Tag> van de organisatie:</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { tier: 'Kern', weight: '3×', desc: 'Belangrijkste organisaties' },
              { tier: 'Extended', weight: '2×', desc: 'Relevante organisaties' },
              { tier: 'Peripheral', weight: '1×', desc: 'Aanvullende organisaties' },
            ].map(t => (
              <div key={t.tier} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                <p className="text-xs font-semibold text-foreground">{t.tier}</p>
                <p className="text-lg font-bold text-primary">{t.weight}</p>
                <p className="text-[10px] text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p>• De <Tag>score per domein</Tag> is de som van gewogen signalen in dat domein</p>
            <p>• De <Tag>totale score</Tag> is de som van alle domeinscores</p>
            <p>• Status wordt bepaald door het aantal actieve domeinen:</p>
          </div>
          <div className="flex gap-3">
            {[
              { status: 'Cold', domains: '1 domein', color: 'bg-muted text-muted-foreground' },
              { status: 'Warm', domains: '2 domeinen', color: 'bg-orange-500/20 text-orange-400' },
              { status: 'Hot', domains: '3 domeinen', color: 'bg-red-500/20 text-red-400' },
            ].map(s => (
              <div key={s.status} className={`flex-1 rounded-lg px-3 py-2 text-center ${s.color}`}>
                <p className="text-xs font-semibold">{s.status}</p>
                <p className="text-[10px]">{s.domains}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="space-y-3 scroll-mt-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Dagelijkse workflow</h2>
          <div className="space-y-3">
            {[
              { step: 1, title: 'Open de Briefing pagina', desc: 'Bekijk het dagelijkse overzicht van nieuwe signalen en top leads.' },
              { step: 2, title: 'Bekijk actie-items', desc: 'Controleer nieuwe hot leads, follow-ups die nodig zijn en contacten die bijna warm/hot worden.' },
              { step: 3, title: 'Push hot leads naar Lemlist', desc: 'Stuur gekwalificeerde leads door naar je email campagnes voor opvolging.' },
              { step: 4, title: 'Check de Stijgers', desc: 'Bekijk leads die recent veel activiteit tonen en bijna van status veranderen.' },
              { step: 5, title: 'Bekijk de Signalen feed', desc: 'Optioneel: bekijk de ruwe signaaldata voor gedetailleerde inzichten.' },
            ].map(w => (
              <div key={w.step} className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{w.step}</div>
                <div>
                  <p className="text-sm font-medium text-foreground">{w.title}</p>
                  <p className="text-xs text-muted-foreground">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="watchlists" className="space-y-3 scroll-mt-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Watchlists instellen</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Watchlists bevatten de LinkedIn bedrijfspagina's die je monitort. Organisaties zijn gegroepeerd per domein en gerangschikt op <Tag>tier</Tag>.
          </p>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p>• <Tag>Kern</Tag> — De belangrijkste organisaties. Signalen hiervan wegen het zwaarst (3×).</p>
            <p>• <Tag>Extended</Tag> — Relevante maar minder kritieke organisaties (2×).</p>
            <p>• <Tag>Peripheral</Tag> — Aanvullende organisaties voor extra dekking (1×).</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong>Tips:</strong> Begin met 5–8 kern organisaties per domein. Voeg extended organisaties toe naarmate je meer data wil verzamelen. Gebruik peripheral voor "nice to have" dekking.
          </p>
        </section>

        <section id="importeren" className="space-y-3 scroll-mt-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Importeren</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Er zijn twee manieren om data te importeren:</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">CSV Import:</strong> Upload een CSV-bestand met contactgegevens. Map de kolommen naar de juiste velden (LinkedIn URL is verplicht). Het systeem detecteert automatisch duplicaten.</p>
            <p><strong className="text-foreground">Phantombuster:</strong> Koppel Phantombuster via <Tag>n8n</Tag> voor automatische signaaldetectie. Je kunt ook handmatig een Phantombuster CSV exporteren en uploaden. Het systeem herkent automatisch het Phantombuster formaat.</p>
          </div>
        </section>

        <section id="enrichment" className="space-y-3 scroll-mt-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Enrichment</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <Tag>Apollo.io</Tag> wordt gebruikt om contactgegevens te verrijken. Wanneer een contact de status <Tag>warm</Tag> of <Tag>hot</Tag> bereikt, kan het verrijkt worden met:
          </p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>• Email adres</p>
            <p>• Telefoonnummer</p>
            <p>• Bedrijfsgrootte en industrie</p>
            <p>• Aanvullende profiel data</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Je kunt <Tag>auto-enrich</Tag> inschakelen zodat contacten automatisch verrijkt worden bij statuswijziging, of handmatig contacten selecteren voor verrijking.
          </p>
        </section>

        <section id="hubspot" className="space-y-3 scroll-mt-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">HubSpot integratie</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Lead Catalyst synchroniseert contacten met HubSpot CRM. Je configureert:
          </p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>• <strong className="text-foreground">Welke contacten:</strong> alleen hot, warm+hot, of alle leads</p>
            <p>• <strong className="text-foreground">Welke velden:</strong> selecteer welke data gesynchroniseerd wordt</p>
            <p>• <strong className="text-foreground">Wanneer:</strong> automatisch bij statuswijziging, dagelijks, of manueel</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            De <Tag>veld mapping</Tag> bepaalt hoe Lead Catalyst velden vertaald worden naar HubSpot properties. Standaard mappings zijn vooraf ingevuld, maar je kunt custom mappings toevoegen.
          </p>
        </section>

        <section id="faq" className="space-y-4 scroll-mt-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Veelgestelde vragen</h2>
          {[
            {
              q: 'Waarom zie ik geen signalen?',
              a: 'Controleer of je watchlist organisaties actief zijn (groene toggle) en of Phantombuster correct draait. Ga naar Instellingen > Koppelingen om de Phantombuster status te checken.',
            },
            {
              q: 'Hoe voeg ik manueel een prospect toe?',
              a: 'Ga naar de Contacten pagina en klik op de "+ Contact" knop rechtsboven. Vul minimaal de LinkedIn URL in.',
            },
            {
              q: 'Wat betekent de score?',
              a: 'De score is de som van gewogen signalen over alle domeinen. Een hoger gewicht (kern=3, extended=2, peripheral=1) betekent dat signalen van belangrijkere organisaties meer meetellen. Zie "Scoring uitgelegd" hierboven.',
            },
            {
              q: 'Kan ik de domeinen aanpassen?',
              a: 'Ja, ga naar Instellingen > Domeinen. Je kunt domeinnamen, kleuren en beschrijvingen wijzigen, en nieuwe domeinen toevoegen of verwijderen.',
            },
          ].map((faq, i) => (
            <div key={i} className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground mb-1">{faq.q}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </section>
      </div>
    </motion.div>
  );
}
