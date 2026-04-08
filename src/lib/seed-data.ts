import type { WatchlistOrg, Signal, Contact, Tier, LemlistCampaign, AppSettings, DomainDefinition } from '@/types';
import { TIER_WEIGHT, DEFAULT_DOMAINS } from '@/types';

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

let _sigId = 0;
function sig(
  contactUrl: string, contactName: string, contactTitle: string | null,
  orgId: string, type: 'like' | 'comment', days: number, comment?: string
): Omit<Signal, 'orgName' | 'domain' | 'tier'> & { orgId: string } {
  return {
    id: `sig-${++_sigId}`,
    contactLinkedinUrl: contactUrl, contactName, contactTitle, orgId,
    engagementType: type, commentText: comment ?? null, detectedAt: daysAgo(days), postUrl: null,
  };
}

export const SEED_ORGS: WatchlistOrg[] = [
  // Kunst — Kern
  { id: 'k01', name: 'KMSKA', linkedinUrl: 'https://linkedin.com/company/kmska', domain: 'kunst', tier: 'kern', isActive: true, postsScrapedCount: 42, lastScrapedAt: daysAgo(0), rank: 1 },
  { id: 'k02', name: 'M HKA', linkedinUrl: 'https://linkedin.com/company/muhka', domain: 'kunst', tier: 'kern', isActive: true, postsScrapedCount: 38, lastScrapedAt: daysAgo(0), rank: 2 },
  { id: 'k03', name: 'Bozar', linkedinUrl: 'https://linkedin.com/company/bozar', domain: 'kunst', tier: 'kern', isActive: true, postsScrapedCount: 51, lastScrapedAt: daysAgo(0), rank: 3 },
  { id: 'k04', name: 'Wiels', linkedinUrl: 'https://linkedin.com/company/wiels', domain: 'kunst', tier: 'kern', isActive: true, postsScrapedCount: 29, lastScrapedAt: daysAgo(1), rank: 4 },
  { id: 'k05', name: 'S.M.A.K.', linkedinUrl: 'https://linkedin.com/company/smak', domain: 'kunst', tier: 'kern', isActive: true, postsScrapedCount: 34, lastScrapedAt: daysAgo(0), rank: 5 },
  // Kunst — Extended
  { id: 'k06', name: 'Mu.ZEE', linkedinUrl: 'https://linkedin.com/company/muzee', domain: 'kunst', tier: 'extended', isActive: true, postsScrapedCount: 22, lastScrapedAt: daysAgo(1), rank: 1 },
  { id: 'k07', name: 'Design Museum Gent', linkedinUrl: 'https://linkedin.com/company/design-museum-gent', domain: 'kunst', tier: 'extended', isActive: true, postsScrapedCount: 19, lastScrapedAt: daysAgo(2), rank: 2 },
  { id: 'k08', name: 'BRAFA', linkedinUrl: 'https://linkedin.com/company/brafa', domain: 'kunst', tier: 'extended', isActive: true, postsScrapedCount: 15, lastScrapedAt: daysAgo(1), rank: 3 },
  { id: 'k09', name: 'Art Brussels', linkedinUrl: 'https://linkedin.com/company/art-brussels', domain: 'kunst', tier: 'extended', isActive: true, postsScrapedCount: 17, lastScrapedAt: daysAgo(3), rank: 4 },
  { id: 'k10', name: 'Galerij De Zwarte Panter', linkedinUrl: 'https://linkedin.com/company/de-zwarte-panter', domain: 'kunst', tier: 'extended', isActive: false, postsScrapedCount: 8, lastScrapedAt: daysAgo(7), rank: 5 },
  // Kunst — Peripheral
  { id: 'k11', name: 'Tim Van Laere Gallery', linkedinUrl: 'https://linkedin.com/company/tim-van-laere-gallery', domain: 'kunst', tier: 'peripheral', isActive: true, postsScrapedCount: 11, lastScrapedAt: daysAgo(2), rank: 1 },
  { id: 'k12', name: 'Zeno X Gallery', linkedinUrl: 'https://linkedin.com/company/zeno-x-gallery', domain: 'kunst', tier: 'peripheral', isActive: true, postsScrapedCount: 9, lastScrapedAt: daysAgo(3), rank: 2 },
  { id: 'k13', name: 'Galerie Nathalie Obadia', linkedinUrl: 'https://linkedin.com/company/galerie-nathalie-obadia', domain: 'kunst', tier: 'peripheral', isActive: true, postsScrapedCount: 7, lastScrapedAt: daysAgo(4), rank: 3 },
  { id: 'k14', name: 'Irène Laub Gallery', linkedinUrl: 'https://linkedin.com/company/irene-laub-gallery', domain: 'kunst', tier: 'peripheral', isActive: false, postsScrapedCount: 5, lastScrapedAt: daysAgo(10), rank: 4 },
  { id: 'k15', name: 'Hopstreet Gallery', linkedinUrl: 'https://linkedin.com/company/hopstreet-gallery', domain: 'kunst', tier: 'peripheral', isActive: true, postsScrapedCount: 6, lastScrapedAt: daysAgo(5), rank: 5 },
  // Beleggen — Kern
  { id: 'b01', name: 'Bank Delen', linkedinUrl: 'https://linkedin.com/company/bank-delen', domain: 'beleggen', tier: 'kern', isActive: true, postsScrapedCount: 55, lastScrapedAt: daysAgo(0), rank: 1 },
  { id: 'b02', name: 'Degroof Petercam', linkedinUrl: 'https://linkedin.com/company/degroof-petercam', domain: 'beleggen', tier: 'kern', isActive: true, postsScrapedCount: 48, lastScrapedAt: daysAgo(0), rank: 2 },
  { id: 'b03', name: 'Econopolis', linkedinUrl: 'https://linkedin.com/company/econopolis', domain: 'beleggen', tier: 'kern', isActive: true, postsScrapedCount: 37, lastScrapedAt: daysAgo(0), rank: 3 },
  { id: 'b04', name: 'Ackermans & van Haaren', linkedinUrl: 'https://linkedin.com/company/ackermans-van-haaren', domain: 'beleggen', tier: 'kern', isActive: true, postsScrapedCount: 44, lastScrapedAt: daysAgo(1), rank: 4 },
  { id: 'b05', name: 'GBL', linkedinUrl: 'https://linkedin.com/company/gbl', domain: 'beleggen', tier: 'kern', isActive: true, postsScrapedCount: 31, lastScrapedAt: daysAgo(0), rank: 5 },
  // Beleggen — Extended
  { id: 'b06', name: 'Gimv', linkedinUrl: 'https://linkedin.com/company/gimv', domain: 'beleggen', tier: 'extended', isActive: true, postsScrapedCount: 26, lastScrapedAt: daysAgo(1), rank: 1 },
  { id: 'b07', name: 'Sofina', linkedinUrl: 'https://linkedin.com/company/sofina', domain: 'beleggen', tier: 'extended', isActive: true, postsScrapedCount: 23, lastScrapedAt: daysAgo(1), rank: 2 },
  { id: 'b08', name: 'Brederode', linkedinUrl: 'https://linkedin.com/company/brederode', domain: 'beleggen', tier: 'extended', isActive: true, postsScrapedCount: 14, lastScrapedAt: daysAgo(3), rank: 3 },
  { id: 'b09', name: 'Quest for Growth', linkedinUrl: 'https://linkedin.com/company/quest-for-growth', domain: 'beleggen', tier: 'extended', isActive: true, postsScrapedCount: 11, lastScrapedAt: daysAgo(2), rank: 4 },
  { id: 'b10', name: 'KBC Private Banking', linkedinUrl: 'https://linkedin.com/company/kbc-private-banking', domain: 'beleggen', tier: 'extended', isActive: false, postsScrapedCount: 18, lastScrapedAt: daysAgo(6), rank: 5 },
  // Beleggen — Peripheral
  { id: 'b11', name: 'Value Square', linkedinUrl: 'https://linkedin.com/company/value-square', domain: 'beleggen', tier: 'peripheral', isActive: true, postsScrapedCount: 9, lastScrapedAt: daysAgo(3), rank: 1 },
  { id: 'b12', name: 'Capricorn Partners', linkedinUrl: 'https://linkedin.com/company/capricorn-partners', domain: 'beleggen', tier: 'peripheral', isActive: true, postsScrapedCount: 7, lastScrapedAt: daysAgo(4), rank: 2 },
  { id: 'b13', name: 'Waterland', linkedinUrl: 'https://linkedin.com/company/waterland', domain: 'beleggen', tier: 'peripheral', isActive: true, postsScrapedCount: 12, lastScrapedAt: daysAgo(2), rank: 3 },
  { id: 'b14', name: 'Vendis Capital', linkedinUrl: 'https://linkedin.com/company/vendis-capital', domain: 'beleggen', tier: 'peripheral', isActive: false, postsScrapedCount: 5, lastScrapedAt: daysAgo(9), rank: 4 },
  { id: 'b15', name: 'Belfius Private Banking', linkedinUrl: 'https://linkedin.com/company/belfius-private-banking', domain: 'beleggen', tier: 'peripheral', isActive: true, postsScrapedCount: 10, lastScrapedAt: daysAgo(3), rank: 5 },
  // Luxe — Kern
  { id: 'l01', name: 'Zoute Grand Prix', linkedinUrl: 'https://linkedin.com/company/zoute-grand-prix', domain: 'luxe', tier: 'kern', isActive: true, postsScrapedCount: 33, lastScrapedAt: daysAgo(0), rank: 1 },
  { id: 'l02', name: 'Knokke Hippique', linkedinUrl: 'https://linkedin.com/company/knokke-hippique', domain: 'luxe', tier: 'kern', isActive: true, postsScrapedCount: 28, lastScrapedAt: daysAgo(1), rank: 2 },
  { id: 'l03', name: 'Patek Philippe Belgium', linkedinUrl: 'https://linkedin.com/company/patek-philippe-belgium', domain: 'luxe', tier: 'kern', isActive: true, postsScrapedCount: 21, lastScrapedAt: daysAgo(0), rank: 3 },
  { id: 'l04', name: 'Breguet Belgium', linkedinUrl: 'https://linkedin.com/company/breguet-belgium', domain: 'luxe', tier: 'kern', isActive: true, postsScrapedCount: 18, lastScrapedAt: daysAgo(1), rank: 4 },
  { id: 'l05', name: 'Maison Margiela Belgium', linkedinUrl: 'https://linkedin.com/company/maison-margiela-belgium', domain: 'luxe', tier: 'kern', isActive: true, postsScrapedCount: 25, lastScrapedAt: daysAgo(0), rank: 5 },
  // Luxe — Extended
  { id: 'l06', name: "Sotheby's Realty Belgium", linkedinUrl: 'https://linkedin.com/company/sothebys-realty-belgium', domain: 'luxe', tier: 'extended', isActive: true, postsScrapedCount: 16, lastScrapedAt: daysAgo(2), rank: 1 },
  { id: 'l07', name: 'Bentley Antwerp', linkedinUrl: 'https://linkedin.com/company/bentley-antwerp', domain: 'luxe', tier: 'extended', isActive: true, postsScrapedCount: 13, lastScrapedAt: daysAgo(2), rank: 2 },
  { id: 'l08', name: 'Richard Mille Belgium', linkedinUrl: 'https://linkedin.com/company/richard-mille-belgium', domain: 'luxe', tier: 'extended', isActive: true, postsScrapedCount: 10, lastScrapedAt: daysAgo(3), rank: 3 },
  { id: 'l09', name: 'Graff Antwerp', linkedinUrl: 'https://linkedin.com/company/graff-antwerp', domain: 'luxe', tier: 'extended', isActive: false, postsScrapedCount: 6, lastScrapedAt: daysAgo(8), rank: 4 },
  { id: 'l10', name: 'Maison Ullens', linkedinUrl: 'https://linkedin.com/company/maison-ullens', domain: 'luxe', tier: 'extended', isActive: true, postsScrapedCount: 8, lastScrapedAt: daysAgo(4), rank: 5 },
  // Luxe — Peripheral
  { id: 'l11', name: 'Hotel La Réserve Knokke', linkedinUrl: 'https://linkedin.com/company/la-reserve-knokke', domain: 'luxe', tier: 'peripheral', isActive: true, postsScrapedCount: 7, lastScrapedAt: daysAgo(3), rank: 1 },
  { id: 'l12', name: 'Restaurant Bartholomeus', linkedinUrl: 'https://linkedin.com/company/bartholomeus', domain: 'luxe', tier: 'peripheral', isActive: true, postsScrapedCount: 5, lastScrapedAt: daysAgo(5), rank: 2 },
  { id: 'l13', name: 'La Durée Belgium', linkedinUrl: 'https://linkedin.com/company/laduree-belgium', domain: 'luxe', tier: 'peripheral', isActive: true, postsScrapedCount: 9, lastScrapedAt: daysAgo(2), rank: 3 },
  { id: 'l14', name: 'Delvaux', linkedinUrl: 'https://linkedin.com/company/delvaux', domain: 'luxe', tier: 'peripheral', isActive: true, postsScrapedCount: 11, lastScrapedAt: daysAgo(1), rank: 4 },
  { id: 'l15', name: 'De Mangerie', linkedinUrl: 'https://linkedin.com/company/de-mangerie', domain: 'luxe', tier: 'peripheral', isActive: false, postsScrapedCount: 3, lastScrapedAt: daysAgo(12), rank: 5 },
];

interface ContactDef {
  url: string; first: string; last: string; title: string; company: string;
  location: string; source: 'auto' | 'manual'; enriched?: boolean; email?: string; phone?: string;
  lemlistId?: string; lemlistPushedDaysAgo?: number; lastContactedDaysAgo?: number; notes?: string;
  isCustomer?: boolean;
}

const CONTACTS: ContactDef[] = [
  { url: 'linkedin.com/in/marie-janssens', first: 'Marie', last: 'Janssens', title: 'Partner', company: 'Mercier Vanderlinden', location: 'Antwerpen', source: 'auto', enriched: true, email: 'marie.janssens@merciervanderlinden.be', phone: '+32 478 12 34 56', lemlistId: 'camp-1', lemlistPushedDaysAgo: 3, notes: 'Top lead — actief in alle 3 domeinen', isCustomer: true },
  { url: 'linkedin.com/in/philippe-van-damme', first: 'Philippe', last: 'Van Damme', title: 'Managing Director', company: 'Sofina', location: 'Brussel', source: 'auto', enriched: true, email: 'pvandamme@sofina.be', isCustomer: true },
  { url: 'linkedin.com/in/nathalie-wouters', first: 'Nathalie', last: 'Wouters', title: 'Director', company: 'Wouters Family Office', location: 'Gent', source: 'auto', enriched: true, email: 'n.wouters@woutersfo.be', phone: '+32 499 88 77 66', isCustomer: true },
  { url: 'linkedin.com/in/thomas-de-smedt', first: 'Thomas', last: 'De Smedt', title: 'CEO', company: 'De Smedt Capital', location: 'Gent', source: 'auto', enriched: true, email: 'thomas@desmedtcapital.be', lemlistId: 'camp-1', lemlistPushedDaysAgo: 10, lastContactedDaysAgo: 10, notes: 'Follow-up nodig — al 10 dagen geen reactie', isCustomer: true },
  { url: 'linkedin.com/in/sophie-claes', first: 'Sophie', last: 'Claes', title: 'CFO', company: 'Claes & Partners', location: 'Brussel', source: 'auto', notes: 'Stijgende activiteit — in de gaten houden', isCustomer: true },
  { url: 'linkedin.com/in/jan-peeters', first: 'Jan', last: 'Peeters', title: 'Wealth Manager', company: 'Puilaetco', location: 'Brussel', source: 'auto', isCustomer: true },
  { url: 'linkedin.com/in/charlotte-dubois', first: 'Charlotte', last: 'Dubois', title: 'Partner', company: 'Dubois Family Office', location: 'Brussel', source: 'auto', enriched: true, email: 'c.dubois@duboisfo.be', isCustomer: true },
  { url: 'linkedin.com/in/pieter-vdberg', first: 'Pieter', last: 'Van den Berg', title: 'Director', company: 'Ackermans & van Haaren', location: 'Antwerpen', source: 'auto', isCustomer: true },
  { url: 'linkedin.com/in/luc-vermeersch', first: 'Luc', last: 'Vermeersch', title: 'Bestuurder', company: 'Vermeersch Holding', location: 'Antwerpen', source: 'auto' },
  { url: 'linkedin.com/in/alexis-laurent', first: 'Alexis', last: 'Laurent', title: 'VP Private Banking', company: 'Degroof Petercam', location: 'Brussel', source: 'auto' },
  { url: 'linkedin.com/in/isabelle-maes', first: 'Isabelle', last: 'Maes', title: 'Managing Director', company: 'IM Investments', location: 'Knokke', source: 'auto' },
  { url: 'linkedin.com/in/hendrik-claessens', first: 'Hendrik', last: 'Claessens', title: 'Senior Advisor', company: 'Gimv', location: 'Antwerpen', source: 'auto' },
  { url: 'linkedin.com/in/els-de-wolf', first: 'Els', last: 'De Wolf', title: 'Portfolio Manager', company: 'Econopolis', location: 'Gent', source: 'auto' },
  { url: 'linkedin.com/in/bart-willems', first: 'Bart', last: 'Willems', title: 'Galeriehouder', company: 'Galerie Willems', location: 'Antwerpen', source: 'auto' },
  { url: 'linkedin.com/in/anne-devries', first: 'Anne', last: 'De Vries', title: 'Curator', company: 'Privécollectie', location: 'Brussel', source: 'auto' },
  { url: 'linkedin.com/in/koen-maertens', first: 'Koen', last: 'Maertens', title: 'Ondernemer', company: 'Maertens Group', location: 'Kortrijk', source: 'auto' },
  { url: 'linkedin.com/in/sarah-lambert', first: 'Sarah', last: 'Lambert', title: 'Investment Analyst', company: 'Brederode', location: 'Brussel', source: 'auto' },
  { url: 'linkedin.com/in/wouter-coppens', first: 'Wouter', last: 'Coppens', title: 'CEO', company: 'Coppens Vastgoed', location: 'Knokke', source: 'auto' },
  { url: 'linkedin.com/in/katrien-de-backer', first: 'Katrien', last: 'De Backer', title: 'Advocaat-vennoot', company: 'De Backer & Partners', location: 'Antwerpen', source: 'auto' },
  { url: 'linkedin.com/in/vincent-deprez', first: 'Vincent', last: 'Deprez', title: 'Directeur', company: 'Deprez Investments', location: 'Brussel', source: 'auto' },
  { url: 'linkedin.com/in/laura-hermans', first: 'Laura', last: 'Hermans', title: 'Family Officer', company: 'Hermans FO', location: 'Hasselt', source: 'auto' },
  { url: 'linkedin.com/in/marc-goossens', first: 'Marc', last: 'Goossens', title: 'Verzamelaar', company: '', location: 'Antwerpen', source: 'auto' },
  { url: 'linkedin.com/in/hendrik-mertens', first: 'Hendrik', last: 'Mertens', title: 'CEO', company: 'Mertens & Zonen', location: 'Leuven', source: 'manual', notes: 'Ontmoet op BRAFA beurs — sterke interesse in kunst' },
  { url: 'linkedin.com/in/annelies-de-vos', first: 'Annelies', last: 'De Vos', title: 'Partner', company: 'De Vos Advocaten', location: 'Gent', source: 'manual', notes: 'Doorverwezen door Thomas De Smedt' },
];

const SIGNAL_PATTERNS: { contactIdx: number; orgId: string; orgName?: string; domain?: string; tier?: Tier; days: number; type: 'like' | 'comment'; comment?: string }[] = [
  { contactIdx: 0, orgId: 'k01', days: 1, type: 'like' },
  { contactIdx: 0, orgId: 'k03', days: 3, type: 'comment', comment: 'Schitterend initiatief van Bozar. Kunst verbindt.' },
  { contactIdx: 0, orgId: 'k03', days: 12, type: 'like' },
  { contactIdx: 0, orgId: 'k01', days: 5, type: 'like' },
  { contactIdx: 0, orgId: 'k08', days: 7, type: 'like' },
  { contactIdx: 0, orgId: 'b01', days: 2, type: 'like' },
  { contactIdx: 0, orgId: 'b02', days: 4, type: 'comment', comment: 'Sterk kwartaalrapport. Indrukwekkende groei.' },
  { contactIdx: 0, orgId: 'b01', days: 8, type: 'like' },
  { contactIdx: 0, orgId: 'b03', days: 6, type: 'like' },
  { contactIdx: 0, orgId: 'l01', days: 1, type: 'comment', comment: 'Was er vorig jaar ook bij. Prachtig evenement!' },
  { contactIdx: 0, orgId: 'l03', days: 3, type: 'like' },
  { contactIdx: 0, orgId: 'l14', days: 5, type: 'like' },
  { contactIdx: 0, orgId: 'l02', days: 9, type: 'like' },
  { contactIdx: 0, orgId: 'ext-tefaf', orgName: 'Tefaf Maastricht', domain: 'kunst', tier: 'extended', days: 4, type: 'like' },
  { contactIdx: 1, orgId: 'k01', days: 2, type: 'like' },
  { contactIdx: 1, orgId: 'k03', days: 4, type: 'like' },
  { contactIdx: 1, orgId: 'k03', days: 11, type: 'comment', comment: 'Bozar blijft inspireren.' },
  { contactIdx: 1, orgId: 'k05', days: 6, type: 'like' },
  { contactIdx: 1, orgId: 'b07', days: 1, type: 'comment', comment: 'Goed resultaat dit kwartaal.' },
  { contactIdx: 1, orgId: 'b04', days: 3, type: 'like' },
  { contactIdx: 1, orgId: 'b01', days: 7, type: 'like' },
  { contactIdx: 1, orgId: 'l01', days: 2, type: 'like' },
  { contactIdx: 1, orgId: 'l04', days: 5, type: 'like' },
  { contactIdx: 1, orgId: 'l05', days: 8, type: 'like' },
  { contactIdx: 1, orgId: 'ext-tefaf', orgName: 'Tefaf Maastricht', domain: 'kunst', tier: 'extended', days: 6, type: 'comment', comment: 'Fantastische editie dit jaar.' },
  { contactIdx: 2, orgId: 'k03', days: 1, type: 'like' },
  { contactIdx: 2, orgId: 'k03', days: 8, type: 'comment', comment: 'Bozar is een must-see.' },
  { contactIdx: 2, orgId: 'k06', days: 4, type: 'comment', comment: 'Mooie tentoonstelling in Mu.ZEE!' },
  { contactIdx: 2, orgId: 'b02', days: 2, type: 'like' },
  { contactIdx: 2, orgId: 'b05', days: 5, type: 'like' },
  { contactIdx: 2, orgId: 'l03', days: 3, type: 'like' },
  { contactIdx: 2, orgId: 'l06', days: 6, type: 'like' },
  { contactIdx: 2, orgId: 'l01', days: 8, type: 'comment', comment: 'Wat een line-up dit jaar!' },
  { contactIdx: 2, orgId: 'ext-tefaf', orgName: 'Tefaf Maastricht', domain: 'kunst', tier: 'extended', days: 5, type: 'like' },
  { contactIdx: 3, orgId: 'k01', days: 3, type: 'like' },
  { contactIdx: 3, orgId: 'k03', days: 2, type: 'like' },
  { contactIdx: 3, orgId: 'k09', days: 6, type: 'like' },
  { contactIdx: 3, orgId: 'k12', days: 10, type: 'like' },
  { contactIdx: 3, orgId: 'b02', days: 2, type: 'comment', comment: 'Interessante analyse over Belgische markt.' },
  { contactIdx: 3, orgId: 'b01', days: 5, type: 'like' },
  { contactIdx: 3, orgId: 'b06', days: 8, type: 'like' },
  { contactIdx: 3, orgId: 'ext-voorlinden', orgName: 'Museum Voorlinden', domain: 'kunst', tier: 'extended', days: 3, type: 'like' },
  { contactIdx: 4, orgId: 'b01', days: 1, type: 'like' },
  { contactIdx: 4, orgId: 'b03', days: 2, type: 'comment', comment: 'Geert Noels op zijn best.' },
  { contactIdx: 4, orgId: 'b11', days: 4, type: 'like' },
  { contactIdx: 4, orgId: 'l01', days: 1, type: 'like' },
  { contactIdx: 4, orgId: 'l13', days: 3, type: 'like' },
  { contactIdx: 4, orgId: 'k03', days: 5, type: 'like' },
  { contactIdx: 5, orgId: 'k01', days: 4, type: 'like' },
  { contactIdx: 5, orgId: 'k03', days: 3, type: 'like' },
  { contactIdx: 5, orgId: 'k11', days: 9, type: 'like' },
  { contactIdx: 5, orgId: 'b01', days: 3, type: 'like' },
  { contactIdx: 5, orgId: 'b09', days: 7, type: 'like' },
  { contactIdx: 5, orgId: 'ext-tefaf', orgName: 'Tefaf Maastricht', domain: 'kunst', tier: 'extended', days: 7, type: 'like' },
  { contactIdx: 6, orgId: 'k03', days: 2, type: 'like' },
  { contactIdx: 6, orgId: 'k03', days: 9, type: 'like' },
  { contactIdx: 6, orgId: 'k07', days: 5, type: 'comment', comment: 'Design Museum Gent is een pareltje.' },
  { contactIdx: 6, orgId: 'l03', days: 1, type: 'like' },
  { contactIdx: 6, orgId: 'l07', days: 6, type: 'like' },
  { contactIdx: 6, orgId: 'ext-tefaf', orgName: 'Tefaf Maastricht', domain: 'kunst', tier: 'extended', days: 8, type: 'like' },
  { contactIdx: 7, orgId: 'b04', days: 2, type: 'like' },
  { contactIdx: 7, orgId: 'b13', days: 5, type: 'like' },
  { contactIdx: 7, orgId: 'l01', days: 3, type: 'like' },
  { contactIdx: 7, orgId: 'k03', days: 4, type: 'like' },
  { contactIdx: 8, orgId: 'k01', days: 4, type: 'like' },
  { contactIdx: 8, orgId: 'k08', days: 8, type: 'like' },
  { contactIdx: 9, orgId: 'b02', days: 3, type: 'like' },
  { contactIdx: 9, orgId: 'b02', days: 7, type: 'comment', comment: 'Goed artikel over asset allocatie.' },
  { contactIdx: 10, orgId: 'l01', days: 2, type: 'like' },
  { contactIdx: 10, orgId: 'l11', days: 6, type: 'like' },
  { contactIdx: 11, orgId: 'b06', days: 3, type: 'like' },
  { contactIdx: 11, orgId: 'b06', days: 9, type: 'like' },
  { contactIdx: 12, orgId: 'b03', days: 2, type: 'like' },
  { contactIdx: 12, orgId: 'b03', days: 5, type: 'comment', comment: 'Econopolis blijft vernieuwend.' },
  { contactIdx: 13, orgId: 'k11', days: 1, type: 'like' },
  { contactIdx: 13, orgId: 'k13', days: 4, type: 'like' },
  { contactIdx: 14, orgId: 'k03', days: 5, type: 'like' },
  { contactIdx: 14, orgId: 'k04', days: 10, type: 'like' },
  { contactIdx: 15, orgId: 'l05', days: 2, type: 'like' },
  { contactIdx: 15, orgId: 'l08', days: 7, type: 'like' },
  { contactIdx: 16, orgId: 'b08', days: 4, type: 'like' },
  { contactIdx: 16, orgId: 'b12', days: 8, type: 'like' },
  { contactIdx: 17, orgId: 'l14', days: 3, type: 'like' },
  { contactIdx: 17, orgId: 'l12', days: 11, type: 'like' },
  { contactIdx: 18, orgId: 'k05', days: 2, type: 'like' },
  { contactIdx: 18, orgId: 'k02', days: 6, type: 'like' },
  { contactIdx: 19, orgId: 'b15', days: 1, type: 'like' },
  { contactIdx: 19, orgId: 'b11', days: 5, type: 'like' },
  { contactIdx: 20, orgId: 'l06', days: 3, type: 'like' },
  { contactIdx: 20, orgId: 'l10', days: 7, type: 'like' },
  { contactIdx: 21, orgId: 'k01', days: 6, type: 'comment', comment: 'Prachtige collectie!' },
  { contactIdx: 21, orgId: 'k09', days: 11, type: 'like' },
  { contactIdx: 22, orgId: 'k08', days: 0, type: 'like' },
  { contactIdx: 23, orgId: 'b01', days: 0, type: 'like' },
];

const orgMap = new Map(SEED_ORGS.map(o => [o.id, o]));

export function buildSignals(): Signal[] {
  return SIGNAL_PATTERNS.map((p, i) => {
    const c = CONTACTS[p.contactIdx];
    const org = orgMap.get(p.orgId);
    return {
      id: `sig-${i + 1}`,
      contactLinkedinUrl: c.url,
      contactName: `${c.first} ${c.last}`,
      contactTitle: c.title,
      orgId: p.orgId,
      orgName: org?.name ?? p.orgName ?? 'Onbekend',
      domain: org?.domain ?? p.domain ?? 'kunst',
      tier: org?.tier ?? p.tier ?? 'extended',
      engagementType: p.type,
      commentText: p.comment ?? null,
      detectedAt: daysAgo(p.days),
      postUrl: null,
    };
  });
}

function emptyDomains(domainDefs: DomainDefinition[]): Record<string, Contact['domains'][string]> {
  const result: Record<string, Contact['domains'][string]> = {};
  for (const d of domainDefs) {
    result[d.id] = { signalCount: 0, lastSignalAt: null, weightedScore: 0 };
  }
  return result;
}

export function buildContacts(signals: Signal[], hotThreshold: number): Contact[] {
  const domainDefs = DEFAULT_DOMAINS;
  const domainIds = domainDefs.map(d => d.id);
  const contactMap = new Map<string, Contact>();

  CONTACTS.forEach((c, i) => {
    contactMap.set(c.url, {
      id: `contact-${i + 1}`,
      linkedinUrl: c.url,
      firstName: c.first, lastName: c.last,
      title: c.title, company: c.company || null,
      email: c.email ?? null, phone: c.phone ?? null,
      location: c.location, source: c.source,
      addedAt: daysAgo(13),
      domains: emptyDomains(domainDefs),
      activeDomainCount: 0, totalScore: 0, status: 'cold',
      isEnriched: c.enriched ?? false,
      enrichedAt: c.enriched ? daysAgo(10) : null,
      lemlistCampaignId: c.lemlistId ?? null,
      lemlistPushedAt: c.lemlistPushedDaysAgo != null ? daysAgo(c.lemlistPushedDaysAgo) : null,
      lastContactedAt: c.lastContactedDaysAgo != null ? daysAgo(c.lastContactedDaysAgo) : null,
      notes: c.notes ?? '',
      engagementScore: 0, keywordScore: 0, crossSignalScore: 0, enrichmentScore: 0, diversityScore: 0,
      previousScore: null, scoreChangedAt: null,
      isCustomer: c.isCustomer ?? false,
      customerSince: c.isCustomer ? daysAgo(60) : null,
    });
  });

  for (const s of signals) {
    const contact = contactMap.get(s.contactLinkedinUrl);
    if (!contact) continue;
    if (!contact.domains[s.domain]) {
      contact.domains[s.domain] = { signalCount: 0, lastSignalAt: null, weightedScore: 0 };
    }
    const dp = contact.domains[s.domain];
    dp.signalCount++;
    dp.weightedScore += TIER_WEIGHT[s.tier];
    if (!dp.lastSignalAt || s.detectedAt > dp.lastSignalAt) dp.lastSignalAt = s.detectedAt;
  }

  for (const contact of contactMap.values()) {
    contact.activeDomainCount = domainIds.filter(d => (contact.domains[d]?.signalCount ?? 0) > 0).length;
    contact.totalScore = domainIds.reduce((sum, d) => sum + (contact.domains[d]?.weightedScore ?? 0), 0);
  }

  return Array.from(contactMap.values());
}

export const SEED_CAMPAIGNS: LemlistCampaign[] = [
  { id: 'camp-1', name: 'Rubey — Cross-Domain HNW', status: 'active', leadsCount: 8, emailsSent: 24, opens: 18, replies: 3 },
  { id: 'camp-2', name: 'Rubey — Kunst Liefhebbers', status: 'active', leadsCount: 5, emailsSent: 15, opens: 9, replies: 1 },
  { id: 'camp-3', name: 'Rubey — Beleggers Q2', status: 'paused', leadsCount: 4, emailsSent: 12, opens: 7, replies: 0 },
  { id: 'camp-4', name: 'Rubey — Luxe Segment', status: 'completed', leadsCount: 6, emailsSent: 18, opens: 14, replies: 4 },
];

export const DEFAULT_SETTINGS: AppSettings = {
  hotScoreThreshold: 70,
  tierWeights: { kern: 3, extended: 2, peripheral: 1 },
  manualAddWeight: 3,
  recencyDecay: true,
  recencyDecayFactor: 0.9,
  domains: [...DEFAULT_DOMAINS],
  profileName: 'Rubey',
  profileEmail: 'rubey@merciervanderlinden.be',
  scoreWeights: { engagement: 30, profileKeywords: 25, crossSignal: 25, enrichment: 10, orgDiversity: 10 },
  warmThreshold: 40,
  decayDaysUntilCold: 30,
  maxSignalsPerOrg: 5,
  positiveKeywords: ['kunst', 'investeren', 'collectie', 'galerie', 'beleggen', 'portefeuille', 'oldtimer', 'classic car', 'luxe', 'vermogensbeheer'],
  negativeKeywords: ['stage', 'student', 'gratis', 'goedkoop', 'crypto', 'NFT'],
  hubspotMapping: { leadSource: "Rubey's Big Bold Marketing Machine", lifecycleStage: 'lead', contactOwner: 'jan.van.gaever@rubey.be' },
  lemlistConfig: { dailySendLimit: 50, defaultCampaignId: '' },
  appearance: { theme: 'dark', compactMode: false, accentColor: 'coral' },
  notifications: { newHotLead: true, enrichmentFailed: true, connectionDown: true, dailyDigest: false },
  autoEnrichEnabled: false,
  hubspotFieldMappings: [
    { lc: 'firstName', hs: 'firstname' },
    { lc: 'lastName', hs: 'lastname' },
    { lc: 'email', hs: 'email' },
    { lc: 'phone', hs: 'phone' },
    { lc: 'totalScore', hs: 'lead_score' },
    { lc: 'status', hs: 'lead_status' },
    { lc: 'activeDomainCount', hs: 'domain_count' },
  ],
  hubspotSyncRules: {
    who: 'warm_hot',
    when: 'auto',
    fields: { nameContact: true, scoreStatus: true, domainTags: true, signalHistory: false, enrichmentData: true, notes: false },
  },
};
