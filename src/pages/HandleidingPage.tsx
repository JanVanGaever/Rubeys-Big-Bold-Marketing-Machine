import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

const SECTIONS = [
  { id: 'hoe-werkt-het', title: 'Hoe werkt Lead Catalyst?' },
  { id: 'scoring', title: 'Scoring uitgelegd' },
  { id: 'workflow', title: 'Dagelijkse workflow' },
  { id: 'watchlists', title: 'Watchlists instellen' },
  { id: 'importeren', title: 'Importeren' },
  { id: 'enrichment', title: 'Enrichment' },
  { id: 'hubspot', title: 'HubSpot integratie' },
  { id: 'n8n-workflows', title: 'n8n Workflows instellen' },
  { id: 'faq', title: 'Veelgestelde vragen' },
];

function Tag({ children }: { children: React.ReactNode }) {
  return <code className="px-1.5 py-0.5 rounded bg-muted text-primary text-[11px] font-mono">{children}</code>;
}

function WorkflowSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        <span className="text-sm font-medium text-foreground">{title}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-8 pr-3 pt-2 pb-3 space-y-2 text-sm text-muted-foreground leading-relaxed">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function HandleidingPage() {
  const [activeSection, setActiveSection] = useState('hoe-werkt-het');

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );
    SECTIONS.forEach(s => { const el = document.getElementById(s.id); if (el) observer.observe(el); });
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
            <button key={s.id} onClick={() => scrollTo(s.id)}
              className={`block w-full text-left text-xs py-1.5 px-2 rounded transition-colors ${activeSection === s.id ? 'text-primary bg-primary/10 font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
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
          <p className="text-sm text-muted-foreground leading-relaxed">Het scoring model bestaat uit 5 componenten, elk gewogen:</p>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p>• <Tag>Engagement</Tag> (30%) — Gewogen signaalactiviteit per organisatie rank en tier</p>
            <p>• <Tag>Keywords</Tag> (25%) — Match van profiel keywords (positief/negatief)</p>
            <p>• <Tag>Cross-signaal</Tag> (25%) — Activiteit over meerdere domeinen (sterkste signaal)</p>
            <p>• <Tag>Enrichment</Tag> (10%) — Beschikbaarheid van email en telefoon</p>
            <p>• <Tag>Diversiteit</Tag> (10%) — Aantal unieke organisaties</p>
          </div>
          <div className="flex gap-3">
            {[
              { tier: 'Kern', weight: '3×', desc: 'Belangrijkste organisaties' },
              { tier: 'Extended', weight: '2×', desc: 'Relevante organisaties' },
              { tier: 'Peripheral', weight: '1×', desc: 'Aanvullende organisaties' },
            ].map(t => (
              <div key={t.tier} className="flex-1 rounded-lg border border-border bg-muted/30 p-3 text-center">
                <p className="text-xs font-semibold text-foreground">{t.tier}</p>
                <p className="text-lg font-bold text-primary">{t.weight}</p>
                <p className="text-[10px] text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="space-y-3 scroll-mt-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Dagelijkse workflow</h2>
          <div className="space-y-3">
            {[
              { step: 1, title: 'Open de Briefing pagina', desc: 'Bekijk het dagelijkse overzicht van nieuwe signalen en top leads.' },
              { step: 2, title: 'Bekijk actie-items', desc: 'Controleer nieuwe hot leads, follow-ups en contacten die bijna hot worden.' },
              { step: 3, title: 'Push hot leads naar Lemlist', desc: 'Stuur gekwalificeerde leads door naar je email campagnes.' },
              { step: 4, title: 'Check de Stijgers', desc: 'Bekijk leads die recent veel activiteit tonen.' },
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
            Watchlists bevatten de LinkedIn bedrijfspagina's die je monitort. Organisaties zijn gegroepeerd per domein en gerangschikt op <Tag>tier</Tag> en <Tag>rank</Tag>.
          </p>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p>• <Tag>Kern</Tag> — De belangrijkste organisaties. Signalen hiervan wegen het zwaarst (3×).</p>
            <p>• <Tag>Extended</Tag> — Relevante maar minder kritieke organisaties (2×).</p>
            <p>• <Tag>Peripheral</Tag> — Aanvullende organisaties voor extra dekking (1×).</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            De <Tag>rank</Tag> binnen een tier bepaalt de exacte score-impact: positie 1 geeft de volle tier-weight, positie 2 de helft, etc.
          </p>
        </section>

        <section id="importeren" className="space-y-3 scroll-mt-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Importeren</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">Er zijn twee manieren om data te importeren:</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">CSV Import:</strong> Upload een CSV-bestand met contactgegevens. Map de kolommen naar de juiste velden (LinkedIn URL is verplicht).</p>
            <p><strong className="text-foreground">Phantombuster:</strong> Upload een Phantombuster CSV export. Het systeem herkent automatisch het formaat, maakt contacten aan en genereert signalen voor watchlist-organisaties.</p>
          </div>
        </section>

        <section id="enrichment" className="space-y-3 scroll-mt-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Enrichment</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            De enrichment-pipeline werkt als <Tag>waterfall</Tag>. <Tag>Apollo.io</Tag> zoekt eerst naar contactgegevens. Als <Tag>Dropcontact</Tag> geconfigureerd is, verifieert en vult het de email aan. Dropcontact is optioneel maar wordt aanbevolen voor Europese leads vanwege hogere hit rates en GDPR-compliance.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Alle API-calls verlopen via <Tag>n8n webhooks</Tag>, zodat API keys veilig aan de serverzijde blijven.
          </p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>• Email adres (prioriteit: persoonlijk {'>'} zakelijk)</p>
            <p>• Telefoonnummer</p>
            <p>• Bedrijfsgrootte en industrie</p>
            <p>• Email verificatie via Dropcontact (GDPR-compliant)</p>
          </div>
        </section>

        <section id="hubspot" className="space-y-3 scroll-mt-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">HubSpot integratie</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Lead Catalyst synchroniseert contacten bidirectioneel met HubSpot CRM via <Tag>n8n webhooks</Tag>.
          </p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>• <strong className="text-foreground">Push:</strong> Stuur leads naar HubSpot op basis van status en sync-regels</p>
            <p>• <strong className="text-foreground">Pull:</strong> Haal contacten op uit HubSpot en merge ze met je bestaande data</p>
            <p>• <strong className="text-foreground">Veld mapping:</strong> Configureer hoe Lead Catalyst velden vertaald worden naar HubSpot properties</p>
          </div>
        </section>

        <section id="n8n-workflows" className="space-y-4 scroll-mt-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">n8n Workflows instellen</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Lead Catalyst communiceert met externe services via <Tag>n8n webhooks</Tag>. Hieronder staan de workflows die je moet aanmaken in n8n.
          </p>
          <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 border border-border">
            💡 Deze workflows zijn beschikbaar als n8n template. Importeer ze via de template library of bouw ze handmatig op basis van onderstaande beschrijvingen.
          </p>

          <div className="space-y-2">
            <WorkflowSection title="1. apollo-enrich — Contact verrijking">
              <p><strong className="text-foreground">Trigger:</strong> Webhook node (<Tag>POST</Tag>, pad: <Tag>/apollo-enrich</Tag>)</p>
              <p><strong className="text-foreground">Input:</strong></p>
              <p className="pl-4 font-mono text-[11px]">{`{ service: 'apollo', action: 'apollo-enrich', payload: { linkedinUrl, firstName, lastName, company } }`}</p>
              <p><strong className="text-foreground">Logica:</strong></p>
              <div className="pl-4 space-y-1">
                <p>1. HTTP Request node → Apollo People Enrichment API</p>
                <p className="font-mono text-[11px]">POST https://api.apollo.io/api/v1/people/match</p>
                <p>2. Parse het resultaat en extraheer email, phone, title, company</p>
                <p>3. Respond to Webhook node met het resultaat</p>
              </div>
              <p><strong className="text-foreground">Output:</strong></p>
              <p className="pl-4 font-mono text-[11px]">{`{ email, phone, personalEmail, workEmail, title, company, companySize, industry }`}</p>
            </WorkflowSection>

            <WorkflowSection title="2. apollo-enrich-batch — Batch verrijking">
              <p>Zelfde als <Tag>apollo-enrich</Tag> maar met een <Tag>SplitInBatches</Tag> node voor meerdere contacten.</p>
              <p><strong className="text-foreground">Trigger:</strong> Webhook (<Tag>POST</Tag>, pad: <Tag>/apollo-enrich-batch</Tag>)</p>
              <p><strong className="text-foreground">Input:</strong> <Tag>contacts</Tag> array met id, linkedinUrl, firstName, lastName, company</p>
              <p><strong className="text-foreground">Rate limiting:</strong> Max 5 per minuut (Apollo free tier limiet)</p>
              <p><strong className="text-foreground">Output:</strong> Object met contact-IDs als keys en enrichment data als values</p>
            </WorkflowSection>

            <WorkflowSection title="3. hubspot-push — Contacten naar HubSpot">
              <p><strong className="text-foreground">Trigger:</strong> Webhook (<Tag>POST</Tag>, pad: <Tag>/hubspot-push</Tag>)</p>
              <p><strong className="text-foreground">Input:</strong></p>
              <p className="pl-4 font-mono text-[11px]">{`{ contacts: [...], mappings: [{ lc: 'firstName', hs: 'firstname' }, ...] }`}</p>
              <p><strong className="text-foreground">Logica:</strong></p>
              <div className="pl-4 space-y-1">
                <p>1. Loop door elke contact</p>
                <p>2. Map de velden volgens de mappings array</p>
                <p>3. HubSpot Create/Update Contact API — match op email</p>
                <p>4. Als contact bestaat: update. Anders: create.</p>
              </div>
              <p><strong className="text-foreground">Output:</strong></p>
              <p className="pl-4 font-mono text-[11px]">{`{ created: number, updated: number, errors: number, details: [...] }`}</p>
            </WorkflowSection>

            <WorkflowSection title="4. hubspot-pull — Contacten ophalen uit HubSpot">
              <p><strong className="text-foreground">Trigger:</strong> Webhook (<Tag>POST</Tag>, pad: <Tag>/hubspot-pull</Tag>)</p>
              <p><strong className="text-foreground">Logica:</strong> HubSpot List Contacts API met optionele filters</p>
              <p><strong className="text-foreground">Output:</strong> Array van contacten in HubSpot property formaat</p>
            </WorkflowSection>

            <WorkflowSection title="5. lemlist-push — Leads naar campagne">
              <p><strong className="text-foreground">Trigger:</strong> Webhook (<Tag>POST</Tag>, pad: <Tag>/lemlist-push</Tag>)</p>
              <p><strong className="text-foreground">Input:</strong></p>
              <p className="pl-4 font-mono text-[11px]">{`{ contacts: [{ email, firstName, lastName, company, linkedinUrl }], campaignId }`}</p>
              <p><strong className="text-foreground">Logica:</strong> Lemlist Add Lead to Campaign API per contact</p>
              <p><strong className="text-foreground">Output:</strong></p>
              <p className="pl-4 font-mono text-[11px]">{`{ added: number, duplicates: number, errors: number, campaignId }`}</p>
            </WorkflowSection>

            <WorkflowSection title="6. lemlist-campaigns — Campagnes ophalen">
              <p><strong className="text-foreground">Trigger:</strong> Webhook (<Tag>POST</Tag>, pad: <Tag>/lemlist-campaigns</Tag>)</p>
              <p><strong className="text-foreground">Logica:</strong> Lemlist Get Campaigns API</p>
              <p><strong className="text-foreground">Output:</strong> Array van campagnes met <Tag>id</Tag>, <Tag>name</Tag>, <Tag>status</Tag>, <Tag>stats</Tag></p>
            </WorkflowSection>

            <WorkflowSection title="7. dropcontact-enrich — Dropcontact verrijking (optioneel)">
              <p><strong className="text-foreground">Trigger:</strong> Webhook node (<Tag>POST</Tag>, pad: <Tag>/dropcontact-enrich</Tag>)</p>
              <p><strong className="text-foreground">Input:</strong></p>
              <p className="pl-4 font-mono text-[11px]">{`{ service: 'dropcontact', action: 'dropcontact-enrich', payload: { firstName, lastName, company, companyWebsite, email } }`}</p>
              <p><strong className="text-foreground">Logica:</strong> Dropcontact API — email lookup + verificatie</p>
              <p><strong className="text-foreground">Output:</strong></p>
              <p className="pl-4 font-mono text-[11px]">{`{ email, phone, jobTitle, company, companyWebsite, isVerified }`}</p>
              <p className="text-amber-400 text-[11px]">Optioneel — alleen nodig als je Europese leads wilt verrijken met GDPR-compliant data.</p>
            </WorkflowSection>

            <WorkflowSection title="8. Test endpoints">
              <p>Simpele API key validatie workflows:</p>
              <div className="pl-4 space-y-1">
                <p>• <Tag>apollo-test</Tag> — Valideer Apollo API key</p>
                <p>• <Tag>dropcontact-test</Tag> — Valideer Dropcontact API key</p>
                <p>• <Tag>hubspot-test</Tag> — Valideer HubSpot API key/OAuth token</p>
                <p>• <Tag>lemlist-test</Tag> — Valideer Lemlist API key</p>
                <p>• <Tag>health</Tag> — Retourneer <Tag>{`{ status: 'ok', timestamp: now }`}</Tag></p>
              </div>
              <p>Elke test workflow stuurt een simpele API-call naar de betreffende service en retourneert success of failure.</p>
            </WorkflowSection>
          </div>
        </section>

        <section id="faq" className="space-y-4 scroll-mt-6">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Veelgestelde vragen</h2>
          {[
            { q: 'Waarom zie ik geen signalen?', a: 'Controleer of je watchlist organisaties actief zijn en of Phantombuster correct draait. Ga naar Setup om de connectiestatus te checken.' },
            { q: 'Hoe voeg ik manueel een prospect toe?', a: 'Ga naar de Contacten pagina en klik op de "+ Prospect toevoegen" knop rechtsboven.' },
            { q: 'Wat betekent de score?', a: 'De score (0-100) is een gewogen combinatie van 5 componenten: engagement, keywords, cross-signaal, enrichment en diversiteit. Klik op een contact om de breakdown te zien.' },
            { q: 'Kan ik de domeinen aanpassen?', a: 'Ja, ga naar Configuratie. Je kunt domeinnamen, kleuren en beschrijvingen wijzigen.' },
            { q: 'Waarom zijn knoppen disabled?', a: 'Alle integratie-knoppen (enrichment, HubSpot sync, Lemlist push) vereisen een werkende n8n webhook verbinding. Configureer eerst n8n in Setup.' },
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
