export type SignalType = 'kunst' | 'vermogen' | 'luxe';
export type LeadStatus = 'hot' | 'warm' | 'cold';
export type SourceType = 'chrome_extension' | 'apollo' | 'phantombuster' | 'manual' | 'import';
export type OutreachStatus = 'not_contacted' | 'in_sequence' | 'replied' | 'meeting_booked' | 'converted';

export interface Signal {
  type: SignalType;
  source: string;
  weight: number;
  date: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  linkedinUrl?: string;
  emailPersonal?: string;
  emailWork?: string;
  phone?: string;
  location?: string;
  score: number;
  status: LeadStatus;
  signals: Signal[];
  sourceType: SourceType;
  outreachStatus: OutreachStatus;
  lemlistStatus?: string;
  hubspotSynced?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrgSignal {
  id: string;
  name: string;
  city: string;
  country: string;
  type: 'museum' | 'bank' | 'family_office' | 'luxury_brand' | 'kunstbeurs' | 'galerij' | 'overig';
  domain: SignalType;
  rank: number;
  active: boolean;
  likes: number;
  comments: number;
  linkedinUrl?: string;
}

export interface Domain {
  id: string;
  name: string;
  color: string;
  maxPts: number;
  items: OrgSignal[];
}

export interface ApolloSearch {
  id: string;
  name: string;
  isActive: boolean;
  lastRunAt?: string;
  resultsCount?: number;
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
