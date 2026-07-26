export type ProspectRow = {
  id: string;
  notionId: string;
  source: string;
  name: string;
  stage: string | null;
  sector: string | null;
  status: string | null;
  connectionStatus: string | null;
  programs: string[];
  notes: string | null;
  keyContacts: string | null;
  nextAction: string | null;
  nextActionDate: string | null;
  notionUrl: string | null;
  deliveryModel: string;
  grantLikelihood: string;
  rationale: string | null;
};

export type ResearchLeadRow = {
  id: string;
  name: string;
  title: string | null;
  role: string | null;
  iitAffiliation: string | null;
  linkedinUrl: string | null;
  email: string | null;
  warmPath: string | null;
  notes: string | null;
  status: string;
};

export type ResearchCompanyRow = {
  id: string;
  name: string;
  sector: string;
  hqCity: string | null;
  csrBudget: string | null;
  csrFocus: string | null;
  themes: string[];
  iitConnect: string | null;
  warmPath: string | null;
  fitRationale: string | null;
  deliveryModel: string;
  grantLikelihood: string;
  externalGrantEvidence: string | null;
  priority: string;
  status: string;
  sourceUrls: string[];
  notes: string | null;
  notionPageUrl: string | null;
  leads: ResearchLeadRow[];
};
