export interface Company {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string;
  sector?: string;
  location?: string;
  socials?: Record<string, string>;
  email?: string;
  phone?: string;
  description?: string;
  ownerId: string;
  confidence?: number;
  createdAt: string;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  description: string;
  category: string;
  benefits: string[];
  targetAudience: string;
  price: number;
  cost: number;
  competitiveAdvantages: string;
  maturity: string;
  aiSuggestions?: string;
}

export interface Lead {
  id: string;
  companyId: string;
  name: string;
  sector: string;
  city: string;
  country: string;
  web?: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  role?: string;
  priority: 'low' | 'medium' | 'high';
  source: string;
  capturedAt: string;
}

export interface Competitor {
  id: string;
  companyId: string;
  name: string;
  web: string;
  valueProposition: string;
  pricing: string;
  socials: Record<string, string>;
  weaknesses: string;
  strengths: string;
  differentiation: string;
}

export interface AutomationTask {
  id: string;
  companyId: string;
  channel: string;
  contentType: string;
  content: string;
  hashtags: string[];
  scheduledAt: string;
  status: 'pending' | 'completed' | 'failed';
  adaptation: string;
  logoUrl?: string;
}

export interface TrackReport {
  id: string;
  companyId: string;
  action: string;
  details: string;
  timestamp: string;
  metrics?: Record<string, any>;
  category: string;
}

export interface ROIData {
  investment: number;
  returns: number;
  costTools: number;
  costAds: number;
  costHuman: number;
  leadsGenerated: number;
  conversions: number;
}
