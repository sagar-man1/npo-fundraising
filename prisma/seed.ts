import "dotenv/config";
import { prisma } from "../src/lib/db";

/**
 * Net-new prospects that are absent from the Notion trackers, weighted toward
 * companies that fund external NGOs. Named leads are public-record senior
 * figures; every row starts at status "New" and needs verification before use.
 */

type SeedLead = {
  name: string;
  title?: string;
  role?: string;
  iitAffiliation?: string;
  warmPath?: string;
  notes?: string;
};

type SeedCompany = {
  name: string;
  sector: string;
  hqCity?: string;
  csrBudget?: string;
  csrFocus?: string;
  themes: Array<"vocational" | "women" | "livelihood">;
  iitConnect?: string;
  warmPath?: string;
  fitRationale?: string;
  deliveryModel: "Grant-maker" | "Mixed" | "Self-implementer" | "Unknown";
  grantLikelihood: "High" | "Medium" | "Low";
  externalGrantEvidence?: string;
  priority: "Tier 1" | "Tier 2" | "Tier 3";
  status?: string;
  sourceUrls?: string[];
  notes?: string;
  leads: SeedLead[];
};

const companies: SeedCompany[] = [
  {
    name: "Titan Company",
    sector: "Consumer / Retail",
    hqCity: "Bengaluru",
    csrBudget: "₹40–60 Cr",
    csrFocus:
      "Titan Foundation: girls' education (Titan Kanya), women's empowerment, artisan and craft livelihoods, skilling for the watch and jewellery trades.",
    themes: ["women", "livelihood", "vocational"],
    iitConnect: "Bhaskar Bhat (former MD) is IIT Madras and already a PARFI connector",
    warmPath:
      "Bhaskar Bhat directly — he is named as the Tata Sons/TCS route in the existing tracker and led Titan for two decades. The single warmest untapped door in the file.",
    fitRationale:
      "Funds external NGOs rather than running institutes, is Bengaluru-headquartered (matches the Bangalore CSR KRA), and its women's-livelihood focus maps onto PRAYOGI. The Bhaskar Bhat relationship is already live for other asks — Titan itself has never been worked.",
    deliveryModel: "Grant-maker",
    grantLikelihood: "High",
    externalGrantEvidence:
      "Titan Foundation works through NGO implementation partners across its education and livelihood programmes.",
    priority: "Tier 1",
    sourceUrls: ["https://www.titancompany.in/sustainability/csr"],
    notes:
      "Biggest gap in the current Notion research: the tracker uses Bhaskar Bhat as a route to TCS and Tata Sons but never asks Titan, where his relationship is strongest.",
    leads: [
      {
        name: "Bhaskar Bhat",
        title: "Former MD, Titan Company; Director, Tata Sons",
        role: "Alumni connector",
        iitAffiliation: "IIT Madras",
        warmPath: "Already an active PARFI connector in the Notion tracker",
        notes:
          "Ask him to open Titan Foundation directly rather than only using him for the Tata Sons governance route.",
      },
      {
        name: "C. K. Venkataraman",
        title: "Managing Director, Titan Company",
        role: "Decision maker",
        warmPath: "Introduction via Bhaskar Bhat",
      },
    ],
  },
  {
    name: "Goldman Sachs India",
    sector: "BFSI / GCC",
    hqCity: "Bengaluru + Mumbai",
    csrBudget: "₹80–120 Cr (India entities combined)",
    csrFocus:
      "10,000 Women (women entrepreneurs), community grants for education and workforce readiness.",
    themes: ["women", "livelihood"],
    iitConnect: "Large IIT alumni base in the Bengaluru engineering centre",
    warmPath:
      "IIMB NSRCEL runs the 10,000 Women programme in India — an academic-partner introduction is more reliable than cold CSR outreach.",
    fitRationale:
      "A genuine grant-maker: documented external grants to Educate Girls and delivery through academic and NGO partners. Women's economic empowerment is its stated India priority, which maps directly onto PRAYOGI and the ANM pipeline.",
    deliveryModel: "Grant-maker",
    grantLikelihood: "High",
    externalGrantEvidence:
      "USD 75,000 grant to Educate Girls; 10,000 Women delivered via IIMB NSRCEL and other partners.",
    priority: "Tier 1",
    sourceUrls: [
      "https://www.goldmansachs.com/worldwide/india/citizenship/",
      "https://nsrcel.org/10000-women/",
      "https://csrbox.org/Impact/description/India_CSR_news_Educate-Girls-Gets-USD-75,000-Funding-From-Goldman-Sachs_75",
    ],
    leads: [
      {
        name: "Sonjoy Chatterjee",
        title: "Chairman & CEO, Goldman Sachs India",
        role: "Decision maker",
      },
      {
        name: "Goldman Sachs India Citizenship team",
        role: "CSR lead",
        notes:
          "Named CSR contact not yet identified — confirm via the Citizenship page before outreach.",
      },
    ],
  },
  {
    name: "Walmart Foundation / Walmart Global Tech India",
    sector: "Retail / GCC",
    hqCity: "Bengaluru",
    csrBudget: "USD 25M+ committed to India programmes",
    csrFocus:
      "Women's economic empowerment, farmer producer organisations, supplier development, skilling for retail and supply-chain roles.",
    themes: ["women", "livelihood", "vocational"],
    iitConnect: "Walmart Global Tech India leadership is heavily IIT-alumni",
    warmPath:
      "Walmart Foundation grants are application-driven and published — a direct concept note is a legitimate route here, unusually for a corporate.",
    fitRationale:
      "One of the few corporates in India whose entire India CSR model is grant-making to NGOs, at ticket sizes that suit a Gurukul ask. Women's livelihoods is the explicit priority.",
    deliveryModel: "Grant-maker",
    grantLikelihood: "High",
    externalGrantEvidence:
      "Walmart Foundation publishes multi-crore India grants to NGOs for women's livelihood and market access.",
    priority: "Tier 1",
    sourceUrls: ["https://walmart.org/how-we-give/international-giving/india"],
    leads: [
      {
        name: "Walmart Foundation India grants team",
        role: "CSR lead",
        notes: "Grants run on published cycles — check the current call before drafting.",
      },
    ],
  },
  {
    name: "HSBC India",
    sector: "BFSI",
    hqCity: "Mumbai / Bengaluru / Hyderabad",
    csrBudget: "₹80–110 Cr",
    csrFocus:
      "Sustainability and future-skills grants; long history of funding NGO-run employability and women's programmes.",
    themes: ["vocational", "women", "livelihood"],
    warmPath:
      "No IIT route identified yet — approach through the banking CSR circuit or an existing grantee reference.",
    fitRationale:
      "Structurally a grant-maker with no captive training institute, and its India CSR sits with a local team rather than being dictated globally. Employability grants are its most established India theme.",
    deliveryModel: "Grant-maker",
    grantLikelihood: "High",
    externalGrantEvidence:
      "HSBC India funds NGO-delivered skilling and livelihood programmes annually under its CSR policy.",
    priority: "Tier 2",
    sourceUrls: ["https://www.hsbc.co.in/sustainability/"],
    leads: [
      {
        name: "Hitendra Dave",
        title: "CEO, HSBC India",
        role: "Decision maker",
      },
    ],
  },
  {
    name: "Standard Chartered India",
    sector: "BFSI",
    hqCity: "Mumbai",
    csrBudget: "₹60–90 Cr",
    csrFocus:
      "Futuremakers: employability, entrepreneurship and the Goal programme for adolescent girls — all delivered by NGO partners.",
    themes: ["women", "vocational", "livelihood"],
    warmPath: "Banking CSR circuit; Futuremakers runs open partner selection rounds.",
    fitRationale:
      "Futuremakers is a partner-delivered programme by design, and the girls' employability theme lines up with the 50% women mandate PARFI already meets.",
    deliveryModel: "Grant-maker",
    grantLikelihood: "High",
    externalGrantEvidence:
      "Futuremakers operates entirely through selected NGO delivery partners in each market.",
    priority: "Tier 2",
    sourceUrls: ["https://www.sc.com/in/sustainability/"],
    leads: [
      {
        name: "P. D. Singh",
        title: "CEO, India & South Asia, Standard Chartered",
        role: "Decision maker",
      },
    ],
  },
  {
    name: "Honeywell India",
    sector: "Manufacturing / GCC",
    hqCity: "Bengaluru",
    csrBudget: "₹30–45 Cr",
    csrFocus:
      "Honeywell Hometown Solutions: STEM education, vocational skilling, disaster resilience — funded through NGO partners.",
    themes: ["vocational", "livelihood"],
    iitConnect: "Honeywell Technology Solutions India has deep IIT alumni bench strength",
    warmPath: "CII/engineering-sector route; no board-level IIT connection identified yet.",
    fitRationale:
      "Hometown Solutions is explicitly a grant programme with no captive institute, and technical/vocational skilling is a stated pillar. Bengaluru base fits the CSR KRA.",
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    externalGrantEvidence: "Hometown Solutions grants are awarded to implementing NGOs.",
    priority: "Tier 2",
    sourceUrls: ["https://www.honeywell.com/us/en/company/corporate-responsibility"],
    leads: [
      {
        name: "Ashish Gaikwad",
        title: "Managing Director, Honeywell Automation India",
        role: "Decision maker",
      },
    ],
  },
  {
    name: "Schneider Electric India",
    sector: "Energy / Manufacturing",
    hqCity: "Bengaluru / Gurugram",
    csrBudget: "₹35–50 Cr",
    csrFocus:
      "Schneider Electric India Foundation: electrician and solar-technician training, energy access, women in technical trades.",
    themes: ["vocational", "women", "livelihood"],
    warmPath:
      "Engineering-sector route via CII; the electrician trade overlap makes a joint ITI proposition credible.",
    fitRationale:
      "Trains through partner ITIs and NGOs rather than its own institutes, and the electrical trades it cares about are exactly what the ITI Gurukuls teach. One of the cleanest programme-level fits found.",
    deliveryModel: "Mixed",
    grantLikelihood: "Medium",
    externalGrantEvidence:
      "Schneider Electric India Foundation funds partner-run training centres for electrical trades.",
    priority: "Tier 2",
    sourceUrls: ["https://www.se.com/in/en/about-us/sustainability/foundation.jsp"],
    leads: [
      {
        name: "Deepak Sharma",
        title: "Zone President Greater India & MD, Schneider Electric India",
        role: "Decision maker",
      },
    ],
  },
  {
    name: "Cipla",
    sector: "Pharma",
    hqCity: "Mumbai",
    csrBudget: "₹90–110 Cr",
    csrFocus:
      "Cipla Foundation: skilling and livelihood, health access, education — delivered with NGO and government partners.",
    themes: ["vocational", "livelihood"],
    warmPath:
      "Pharma-sector route; the Indian Pharmaceutical Alliance PAGE skilling institute is a shared-agenda opener.",
    fitRationale:
      "Skilling and livelihood is a named Cipla Foundation pillar and the foundation states it partners with trusted NGOs. Healthcare-adjacent trades connect to the ANM/nursing programme.",
    deliveryModel: "Mixed",
    grantLikelihood: "Medium",
    externalGrantEvidence:
      "Cipla Foundation describes partnering with trusted NGOs and government bodies to deliver its programmes.",
    priority: "Tier 2",
    sourceUrls: [
      "https://www.cipla.com/csr/cipla-foundation/skilling.html",
      "https://csrbox.org/csr-foundation/foundation-detail-Cipla-Foundation_94",
    ],
    notes:
      "Caveat: the foundation calls itself Cipla's 'principal implementation agency', so confirm how much genuinely flows to outside partners before investing heavily.",
    leads: [
      {
        name: "Umang Vohra",
        title: "MD & Global CEO, Cipla",
        role: "Decision maker",
      },
      {
        name: "Rumana Hamied",
        title: "Cipla Foundation",
        role: "CSR lead",
      },
    ],
  },
  {
    name: "Lupin",
    sector: "Pharma",
    hqCity: "Mumbai",
    csrBudget: "₹40–60 Cr",
    csrFocus:
      "Lupin Human Welfare & Research Foundation: rural livelihoods, women's SHGs, skill training in Rajasthan, MP and Maharashtra.",
    themes: ["livelihood", "women", "vocational"],
    warmPath: "Pharma-sector route; no IIT connection identified.",
    fitRationale:
      "The foundation explicitly disburses on a grant basis to NGOs, SHGs and panchayats, and its rural-livelihood geography overlaps PARFI states.",
    deliveryModel: "Mixed",
    grantLikelihood: "Medium",
    externalGrantEvidence:
      "Lupin's foundation states it works with NGOs, SHGs, panchayats and banks on a grant basis.",
    priority: "Tier 3",
    sourceUrls: [
      "https://csrbox.org/csr-foundation/foundation-detail-Lupin-Human-Welfare-&-Research-Foundation_64",
    ],
    notes:
      "Runs deep own-delivery operations in its focus districts, so expect a preference for its existing geographies.",
    leads: [
      { name: "Vinita Gupta", title: "CEO, Lupin", role: "Decision maker" },
      { name: "Nilesh Gupta", title: "Managing Director, Lupin", role: "Decision maker" },
    ],
  },
  {
    name: "Hindustan Unilever",
    sector: "FMCG",
    hqCity: "Mumbai",
    csrBudget: "₹180–220 Cr",
    csrFocus:
      "HUL Foundation: Prabhat (community development, skilling, water), Shakti women entrepreneurs.",
    themes: ["women", "livelihood", "vocational"],
    warmPath: "FMCG/CII route; no IIT board connection identified.",
    fitRationale:
      "Prabhat is delivered through NGO implementation partners around HUL factory locations, and women's livelihood is a core theme. Large budget with a partner-first delivery model.",
    deliveryModel: "Mixed",
    grantLikelihood: "Medium",
    externalGrantEvidence: "Prabhat programmes are run with local NGO implementation partners.",
    priority: "Tier 2",
    sourceUrls: ["https://www.hul.co.in/sustainability/"],
    notes:
      "Geographic constraint: HUL concentrates community spend near its own manufacturing sites — check overlap with PARFI states first.",
    leads: [
      { name: "Rohit Jawa", title: "CEO & MD, Hindustan Unilever", role: "Decision maker" },
    ],
  },
  {
    name: "Cummins India",
    sector: "Manufacturing",
    hqCity: "Pune",
    csrBudget: "₹40–55 Cr",
    csrFocus:
      "Technical Education for Communities (TEC): upgrading government ITIs; women in technical trades.",
    themes: ["vocational", "women"],
    warmPath: "Engineering-sector/CII route; Pune manufacturing cluster.",
    fitRationale:
      "TEC works by strengthening existing government ITIs rather than building Cummins-branded institutes — the closest structural match to the PARFI ITI model found outside the current tracker.",
    deliveryModel: "Mixed",
    grantLikelihood: "Medium",
    externalGrantEvidence:
      "TEC is delivered in partnership with government ITIs and NGO partners.",
    priority: "Tier 2",
    sourceUrls: ["https://www.cumminsindia.com/corporate-responsibility"],
    leads: [
      {
        name: "Shveta Arya",
        title: "Managing Director, Cummins India",
        role: "Decision maker",
      },
    ],
  },
  {
    name: "Texas Instruments India",
    sector: "Semiconductor / GCC",
    hqCity: "Bengaluru",
    csrBudget: "₹15–25 Cr",
    csrFocus: "STEM education, engineering scholarships, NGO-delivered digital and technical skilling.",
    themes: ["vocational", "women"],
    iitConnect: "Long-standing IIT research and recruiting relationships",
    warmPath: "IIT industry-partnership offices; Bengaluru semiconductor cluster.",
    fitRationale:
      "Grants to NGOs with no captive institute, and the India semiconductor push is pulling technician-level skilling money into the sector. Modest ticket size.",
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    priority: "Tier 3",
    sourceUrls: ["https://www.ti.com/about-ti/citizenship/overview.html"],
    leads: [
      {
        name: "Santhosh Kumar",
        title: "Managing Director, Texas Instruments India",
        role: "Decision maker",
      },
    ],
  },
  {
    name: "AMD India",
    sector: "Semiconductor / GCC",
    hqCity: "Bengaluru",
    csrBudget: "₹10–20 Cr",
    csrFocus: "STEM access, women in engineering, digital skilling via NGO partners.",
    themes: ["vocational", "women"],
    warmPath: "Bengaluru semiconductor cluster; NASSCOM route via Ashank Desai.",
    fitRationale:
      "Grant-based CSR with no in-house training arm, and a stated women-in-tech priority. Small but a low-friction first ask.",
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    priority: "Tier 3",
    sourceUrls: ["https://www.amd.com/en/corporate/corporate-responsibility.html"],
    leads: [
      {
        name: "Jaya Jagadish",
        title: "Country Head, AMD India",
        role: "Decision maker",
        notes: "Prominent voice on women in semiconductor engineering — theme-aligned opener.",
      },
    ],
  },
  {
    name: "DBS Bank India",
    sector: "BFSI",
    hqCity: "Mumbai",
    csrBudget: "₹25–40 Cr",
    csrFocus: "DBS Foundation grants to social enterprises; livelihood and financial inclusion.",
    themes: ["livelihood", "women"],
    warmPath: "Open DBS Foundation grant programme — application-driven.",
    fitRationale:
      "A pure grant-maker running published funding rounds, which removes the access problem entirely. Ticket sizes are smaller than the large-corporate targets.",
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    externalGrantEvidence: "DBS Foundation runs open grant programmes for social enterprises.",
    priority: "Tier 3",
    sourceUrls: ["https://www.dbs.com/dbsfoundation/default.page"],
    leads: [
      { name: "Rajat Verma", title: "MD & CEO, DBS Bank India", role: "Decision maker" },
    ],
  },
  {
    name: "NTPC",
    sector: "Energy / PSU",
    hqCity: "New Delhi",
    csrBudget: "₹400–500 Cr",
    csrFocus:
      "Girl empowerment mission, ITI and vocational training near plant locations, rural livelihoods.",
    themes: ["vocational", "women", "livelihood"],
    warmPath:
      "PSU CSR requires board or ministry-level access — the hardest door on this list, and the largest budget.",
    fitRationale:
      "PSU CSR is disbursed to external implementing agencies by design, and NTPC's plant geography overlaps PARFI's operating states. Its girl-empowerment mission is a direct thematic match.",
    deliveryModel: "Grant-maker",
    grantLikelihood: "Medium",
    externalGrantEvidence:
      "PSU CSR rules route spend through empanelled external implementing agencies.",
    priority: "Tier 3",
    sourceUrls: ["https://www.ntpc.co.in/csr-community-development"],
    notes: "Long sales cycle. Worth starting only if a board or ministry route can be found.",
    leads: [
      {
        name: "NTPC CSR & Sustainability department",
        role: "CSR lead",
        notes: "Empanelment process — confirm the current cycle before approaching.",
      },
    ],
  },
  {
    name: "Bharti Airtel Foundation",
    sector: "Telecom",
    hqCity: "New Delhi",
    csrBudget: "₹200+ Cr",
    csrFocus: "Satya Bharti Schools, Bharti Airtel Scholarship Programme.",
    themes: ["vocational"],
    warmPath: "No route identified.",
    fitRationale:
      "Logged deliberately as a pass. Large budget, but the foundation runs its own school network and scholarship scheme end to end — the classic self-implementer trap where budget size misleads.",
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    priority: "Tier 3",
    status: "Rejected",
    sourceUrls: ["https://bhartiairtelfoundation.org/"],
    leads: [],
  },
  {
    name: "Piramal Foundation",
    sector: "Pharma / Foundation",
    hqCity: "Mumbai",
    csrBudget: "₹150+ Cr",
    csrFocus: "Piramal Swasthya, Piramal Foundation for Education Leadership, Aspirational Districts.",
    themes: ["livelihood"],
    warmPath: "Philanthropy-sector circuit (Dasra, AIP).",
    fitRationale:
      "Logged as a pass on the same test: Piramal builds and staffs its own delivery organisations rather than granting out. Useful as a sector peer and convening contact, not as a funder.",
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    priority: "Tier 3",
    status: "Rejected",
    sourceUrls: ["https://www.piramalfoundation.org/"],
    leads: [],
  },
  {
    name: "Adani Foundation",
    sector: "Infrastructure / Conglomerate",
    hqCity: "Ahmedabad",
    csrBudget: "₹500+ Cr",
    csrFocus: "Saksham skill development centres, Utthan education, rural livelihoods.",
    themes: ["vocational", "livelihood"],
    warmPath: "No route identified.",
    fitRationale:
      "Logged as a pass. One of India's largest CSR pools, but Saksham centres are Adani-run and spend concentrates around its own port and plant sites.",
    deliveryModel: "Self-implementer",
    grantLikelihood: "Low",
    priority: "Tier 3",
    status: "Rejected",
    sourceUrls: ["https://www.adanifoundation.org/"],
    leads: [],
  },
];

async function main() {
  for (const entry of companies) {
    const { leads, themes, sourceUrls, status, ...rest } = entry;

    const data = {
      ...rest,
      themes: JSON.stringify(themes),
      sourceUrls: sourceUrls ? JSON.stringify(sourceUrls) : null,
      status: status ?? "New",
    };

    const company = await prisma.researchCompany.upsert({
      where: { name: entry.name },
      create: data,
      update: data,
    });

    await prisma.researchLead.deleteMany({ where: { companyId: company.id } });
    for (const lead of leads) {
      await prisma.researchLead.create({ data: { ...lead, companyId: company.id } });
    }
  }

  const [companyCount, leadCount] = await Promise.all([
    prisma.researchCompany.count(),
    prisma.researchLead.count(),
  ]);
  console.log(`Seeded ${companyCount} research companies and ${leadCount} named leads.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
