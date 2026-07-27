/**
 * A large CSR budget only matters if the company gives it to someone else.
 * Companies that run their own institutes (SMART Academies, CSTI, BRIDGE, LABS)
 * absorb their skilling spend internally and rarely grant to an outside partner,
 * so they rank below their headline budget for PARFI's purposes.
 */

export type DeliveryModel =
  | "Grant-maker"
  | "Mixed"
  | "Self-implementer"
  | "Unknown";

export type GrantLikelihood = "High" | "Medium" | "Low";

export const DELIVERY_MODELS: DeliveryModel[] = [
  "Grant-maker",
  "Mixed",
  "Self-implementer",
  "Unknown",
];

export const GRANT_LIKELIHOODS: GrantLikelihood[] = ["High", "Medium", "Low"];

export const DELIVERY_MODEL_HELP: Record<DeliveryModel, string> = {
  "Grant-maker": "Funds external NGOs to deliver. Best fit for a PARFI ask.",
  Mixed: "Runs some programmes in-house but also grants to partners.",
  "Self-implementer":
    "Runs its own institutes and absorbs its skilling budget internally — a weak grant prospect regardless of budget size.",
  Unknown: "Not yet assessed.",
};

type Assessment = {
  deliveryModel: DeliveryModel;
  grantLikelihood: GrantLikelihood;
  rationale: string;
};

/**
 * Keyed by a normalised company name. Applied to synced Notion rows that have no
 * hand-written assessment yet, so the tracker inherits this judgement without
 * anyone re-typing it.
 */
const KNOWN: Record<string, Assessment> = {
  "tech mahindra": {
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    rationale:
      "Tech Mahindra Foundation runs 12 SMART Academies directly. Skilling budget is committed to its own centres, so it competes with PARFI rather than funding it. Better as a placement/curriculum partner.",
  },
  "larsen & toubro": {
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    rationale:
      "L&T Construction Skills Training Institutes train 50K+/yr in-house for L&T's own labour pipeline. Approach for trade collaboration, not grants.",
  },
  "bosch india": {
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    rationale:
      "BRIDGE is Bosch's own vocational programme run through its centres. Near-identical to the Gurukul model, which makes it a peer rather than a funder.",
  },
  "niit limited": {
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    rationale:
      "NIIT Foundation's entire mission is delivering skilling itself. Strong co-investment or curriculum partner; unlikely grant source.",
  },
  "dr. reddy's foundation": {
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    rationale:
      "DRF runs LABS and GROW directly across its own centres. Structural similarity to PARFI Gurukuls cuts both ways — it is more likely to see PARFI as a peer than a grantee.",
  },
  "hcl technologies": {
    deliveryModel: "Mixed",
    grantLikelihood: "Medium",
    rationale:
      "HCL Foundation runs Samuday and its own education system, but does make external grants. Board access via Arjun Malhotra is the real asset here — lead with the relationship, not the budget.",
  },
  wipro: {
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    rationale:
      "Azim Premji Foundation delivers its own programmes at scale and concentrates on government school systems. Wipro Foundation grants exist but are small relative to headline numbers.",
  },
  infosys: {
    deliveryModel: "Mixed",
    grantLikelihood: "High",
    rationale:
      "Infosys Foundation makes open external grants alongside its own Springboard platform. Live conversation plus an executive sponsor makes this the strongest large-budget target.",
  },
  tcs: {
    deliveryModel: "Mixed",
    grantLikelihood: "Medium",
    rationale:
      "TCS Foundation both runs BridgeIT itself and issues sizeable NGO grants. Access needs the Tata Sons governance route.",
  },
  accenture: {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale:
      "Skills to Succeed is delivered almost entirely through NGO implementation partners. Good structural fit; the gap is access, not appetite.",
  },
  "accenture india": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale:
      "Skills to Succeed is delivered almost entirely through NGO implementation partners. Good structural fit; the gap is access, not appetite.",
  },
  "capgemini india": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "High",
    rationale:
      "LEAP and Enlight run through NGO partners, and Capgemini already backs third-party incubators. Theme fit is close to exact.",
  },
  "cognizant": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale:
      "Cognizant Foundation India funds 600+ projects through partners rather than running centres. Past PARFI experience was mixed — worth checking history before re-approach.",
  },
  "oracle india": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale:
      "Funds external organisations (Educate Girls, Mann Deshi) and already supports IIT Bombay scholarships. Grant-shaped, modest ticket sizes.",
  },
  "microsoft india": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale:
      "Microsoft Philanthropies works through NGO partners for digital skilling. Priorities are set partly outside India.",
  },
  "amazon india": {
    deliveryModel: "Mixed",
    grantLikelihood: "Medium",
    rationale:
      "Amazon Future Engineer uses delivery partners, but skilling spend is tied to Amazon's own hiring funnel (NAPS).",
  },
  "sap india": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale:
      "Code Unnati and Yuva Yuga are delivered by implementation partners. NASSCOM route via Ashank Desai is the practical opener.",
  },
  "ibm india": {
    deliveryModel: "Mixed",
    grantLikelihood: "Medium",
    rationale:
      "SkillsBuild is IBM's own platform, but IBM funds NGO partners to run it on the ground. Conversation already live.",
  },
  mphasis: {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale:
      "Mphasis F1 Foundation grants to external organisations. Constraint is budget timing (nothing in FY26-27), not model fit.",
  },
  ltimindtree: {
    deliveryModel: "Grant-maker",
    grantLikelihood: "High",
    rationale:
      "Funds external delivery partners and has no captive skilling institute. Proposal already in motion.",
  },
  hexaware: {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale: "Small CSR delivered through partners; ticket size is the limit.",
  },
  coforge: {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale: "Partner-delivered CSR, modest budget.",
  },
  "cisco india": {
    deliveryModel: "Mixed",
    grantLikelihood: "Medium",
    rationale:
      "Networking Academy is Cisco's own curriculum delivered via institutions; Cisco also grants to NGOs for digital inclusion.",
  },
  "quess corp": {
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    rationale:
      "Excelus is Quess's own training arm. Value here is placement and employer partnership, not CSR money.",
  },
  teamlease: {
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    rationale:
      "Vocational skilling is TeamLease's core business. Treat as employer/apprenticeship partner.",
  },
  mastek: {
    deliveryModel: "Mixed",
    grantLikelihood: "Low",
    rationale:
      "Small CSR budget and its own Avanshali Foundation programme. Worth far more as a warm-intro route through Ashank Desai than as a funder.",
  },
  "happiest minds": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale:
      "Funds external causes and Ashok Soota's personal philanthropy is substantial. Pitch the individual, not the CSR line item.",
  },
  "sonata software": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale: "Funds partners such as Agastya Foundation. Small budget.",
  },
  "samsung india": {
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    rationale:
      "Samsung Smart School and technical institutes are run under Samsung's own brand, with priorities set in Seoul.",
  },
  "salesforce india": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale:
      "Pledge 1% model is explicitly grant-based (Katalyst, FLOW are partner-delivered).",
  },
  "qualcomm india": {
    deliveryModel: "Mixed",
    grantLikelihood: "Low",
    rationale: "Thinkabit and Wireless Reach are Qualcomm-branded programmes; small India CSR.",
  },
  "adobe india": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale: "Digital literacy delivered through NGO partners; small budget.",
  },
  "dell india": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale: "Youth Learning Program runs through partners; access is the constraint.",
  },
  "dell technologies india": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale: "Youth Learning Program runs through partners; access is the constraint.",
  },
  "hp india": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale: "HP LIFE and Reinvent Futures are delivered with NGO partners; small budget.",
  },
  "hdfc bank": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "High",
    rationale:
      "Parivartan funds NGO partners at scale and PARFI is already a grantee. Renewal and expansion are the play.",
  },
  "kotak mahindra bank": {
    deliveryModel: "Mixed",
    grantLikelihood: "High",
    rationale:
      "Kotak Education Foundation delivers directly but also funds partners; existing PARFI funder.",
  },
  "bajaj finserv": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "High",
    rationale: "Existing PARFI funder with a partner-delivery model. Renewal is overdue.",
  },
  "sbi foundation": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "High",
    rationale:
      "Sashakti, GRAM and Kaushalya are all delivered through NGO partners. Existing PARFI funder.",
  },
  "axis bank": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale: "Axis Bank Foundation is a pure grant-maker for livelihoods at large scale.",
  },
  "icici bank": {
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    rationale:
      "ICICI Foundation runs its own ICICI Academy for Skills centres nationwide — direct overlap with the Gurukul model.",
  },
  "reliance industries": {
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    rationale:
      "Reliance Foundation delivers its own skill centres and institutions. Almost entirely internal.",
  },
  itc: {
    deliveryModel: "Mixed",
    grantLikelihood: "Medium",
    rationale:
      "ICTC and NIMANTRI are ITC-branded but delivered with NGO implementing partners.",
  },
  "mahindra & mahindra": {
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    rationale:
      "Mahindra Pride Schools are run by the Mahindra Foundation itself and target the same placement-linked model as the Gurukuls.",
  },
  "tata steel / tv narendran": {
    deliveryModel: "Mixed",
    grantLikelihood: "Medium",
    rationale:
      "Tata Steel Foundation runs its own programmes in Jharkhand/Odisha but funds partners too. Board access via TV Narendran is the lever.",
  },
  "tata motors": {
    deliveryModel: "Mixed",
    grantLikelihood: "Medium",
    rationale:
      "Tata Motors Foundation works through implementing partners in its operating geographies.",
  },
  ongc: {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale:
      "PSU CSR is disbursed to external implementing agencies, and the geographic focus overlaps PARFI states. Access runs through board/government channels.",
  },
  "maruti suzuki": {
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    rationale:
      "Skilling is delivered through Maruti's own ITI adoption programme tied to its dealer network.",
  },
  "asian paints": {
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    rationale: "Painter training is a trade programme built around its own supply chain.",
  },
  "nestle india": {
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    rationale: "The Moga model trains farmers inside Nestlé's own sourcing network.",
  },
  "jp morgan chase foundation": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "High",
    rationale:
      "Pure workforce-development grant-maker and an existing PARFI funder. Watch the flagged placement-target retention risk.",
  },
  "tata trusts": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "High",
    rationale: "One of India's largest independent grant-makers; existing partner.",
  },
  "gates foundation": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale: "Pure grant-maker; PRAYOGI already validated by them.",
  },
  "mackenzie scott / yield giving": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale: "Unrestricted grant-maker. Entirely application-driven — deadline discipline matters.",
  },
  "360 one foundation": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "High",
    rationale: "Wealth-management philanthropy that funds partners; existing PARFI funder.",
  },
  "ubs india": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "High",
    rationale: "UBS Optimus Foundation is a grant-maker and an existing PARFI partner.",
  },
  genpact: {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale: "Skill BUILD and STEM FOR HER run through partners; access via Arjun Malhotra.",
  },
  "google india": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale:
      "Google.org is a grant-maker, but India grants are large and few, with decisions made globally.",
  },
  "sun pharma": {
    deliveryModel: "Mixed",
    grantLikelihood: "Medium",
    rationale:
      "Funds external health and education partners alongside its own programmes; Pawan Goenka's IIT board roles are the access route.",
  },
  zoho: {
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    rationale:
      "Zoho Schools of Learning is its own vocational institution and the founder's stated preference is to build rather than fund.",
  },
  "siemens india": {
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    rationale:
      "Siemens delivers technical training through its own centres and partner institutes under the Siemens brand.",
  },
  "abb india": {
    deliveryModel: "Mixed",
    grantLikelihood: "Medium",
    rationale: "Runs branded technical training but funds NGO partners for community programmes.",
  },
  flipkart: {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale: "Flipkart Foundation grants to livelihood and entrepreneurship NGOs.",
  },
  biocon: {
    deliveryModel: "Mixed",
    grantLikelihood: "Medium",
    rationale:
      "Biocon Foundation runs its own health programmes but partners for workforce training. Nursing angle is the opening.",
  },
  "deshpande foundation": {
    deliveryModel: "Mixed",
    grantLikelihood: "Medium",
    rationale:
      "Runs the Hubballi Sandbox itself, but also funds and incubates external organisations.",
  },
  "azim premji philanthropic initiatives": {
    deliveryModel: "Mixed",
    grantLikelihood: "Low",
    rationale:
      "Makes external grants but concentrates on government school systems, not vocational training.",
  },
  "rohini nilekani philanthropies": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale: "Independent grant-maker; framing fit is strong even if vocational is not the core theme.",
  },
  "pratiksha trust": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale:
      "Personal philanthropic vehicle of PARFI's executive sponsor — the right place for a personal-gift ask.",
  },
  "rainmatter foundation": {
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    rationale: "Funds grassroots organisations directly and is open to unconventional structures.",
  },
  "biocon foundation": {
    deliveryModel: "Mixed",
    grantLikelihood: "Medium",
    rationale: "Delivers its own health programmes; partners for workforce training.",
  },
};

/** Words that signal a company runs its own training institutes. */
const SELF_IMPLEMENTER_HINTS = [
  "own education system",
  "own centres",
  "academy",
  "academies",
  "our own",
  "in-house",
];

function normalise(name: string) {
  return name
    .toLowerCase()
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function lookupAssessment(
  name: string,
  haystack?: string | null,
): Assessment | null {
  const key = normalise(name);
  const known = KNOWN[key];
  if (known) return known;

  const text = (haystack ?? "").toLowerCase();
  if (SELF_IMPLEMENTER_HINTS.some((hint) => text.includes(hint))) {
    return {
      deliveryModel: "Self-implementer",
      grantLikelihood: "Low",
      rationale:
        "Tracker notes suggest it runs its own training programmes. Companies that deliver in-house rarely fund an outside partner — verify before investing outreach time.",
    };
  }

  return null;
}
