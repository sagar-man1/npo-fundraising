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
  owner: string | null;
  contactDetails: string | null;
  pitchAngle: string | null;
  routeIn: string | null;
  boardConnection: string | null;
  csrBudget: string | null;
  priority: string | null;
  lastTouch: string | null;
  flag: string | null;
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
  discoveredBy: string;
  createdAt: string;
  leads: ResearchLeadRow[];
};

export type JobRunRow = {
  status: string;
  found: number;
  notified: boolean;
  summary: string | null;
  error: string | null;
  finishedAt: string | null;
};
