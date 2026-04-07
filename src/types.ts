export interface ContactSignal {
  type: string;
  source: string;
  weight: number;
  date: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
  emailPersonal?: string;
  emailWork?: string;
  phone?: string;
  location?: string;
  score: number;
  status: 'hot' | 'warm' | 'cold';
  signals: ContactSignal[];
  sourceType: string;
  outreachStatus: string;
  lemlistStatus?: string;
  hubspotSynced?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DomainItem {
  id: string;
  name: string;
  city: string;
  country: string;
  type: string;
  domain: string;
  rank: number;
  active: boolean;
  likes: number;
  comments: number;
}

export interface Domain {
  id: string;
  name: string;
  color: string;
  maxPts: number;
  items: DomainItem[];
}

export interface LemlistCampaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft';
  leadsCount: number;
  repliesCount: number;
}

export interface ScoreWeights {
  engagement: number;
  profileKeywords: number;
  crossSignal: number;
  enrichment: number;
  orgDiversity: number;
}

export interface AppSettings {
  hotThreshold: number;
  warmThreshold: number;
  scoreWeights: ScoreWeights;
  positiveKeywords: string[];
  negativeKeywords: string[];
  apolloApiKey: string;
  lemlistApiKey: string;
  hubspotToken: string;
  phantombusterApiKey: string;
}
