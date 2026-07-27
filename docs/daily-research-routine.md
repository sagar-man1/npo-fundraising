# The daily research Routine

The research runs in **Claude Code**, not in this app — so no Anthropic API key is
needed here. A scheduled Routine researches new prospects each morning and writes
them into the **Research Pipeline (auto)** database in Notion. The app then syncs
that database and shows the rows in the Research tab.

```
Claude Routine (daily)  →  Notion: Research Pipeline (auto)  →  app sync  →  Research tab  →  WhatsApp
```

## Create it

The Routine has to be created from the **claude.ai Routines UI**, not from a Claude
Code session. A Routine can only use connectors the session that created it holds,
and a Code session can't pass the Notion connector through — one created here would
run every morning with no Notion access and write nothing.

1. Go to **claude.ai → Settings → Routines** (or the Routines entry in the sidebar).
2. **New Routine**.
3. Attach the **Notion** connector. This is the step that matters — without it the
   Routine cannot write anything.
4. Schedule: daily, at whatever time you want the research to land. Pick something
   before your morning WhatsApp — if the app's `RESEARCH_CRON` is `30 7 * * *` IST,
   have the Routine run at 06:30 IST or earlier so the digest has something to send.
5. Paste the prompt below verbatim.
6. Save, then use **Run now** once to confirm rows appear in Notion.

## The prompt

```text
You are doing daily fundraising prospect research for the PanIIT Alumni Foundation
(PARFI), an Indian non-profit running ITI Skill Gurukuls, ANM/nursing training, and
placement-linked livelihood programmes with a strong women's participation mandate.

Write your findings into this Notion database (use the Notion tools):
Research Pipeline (auto) — https://app.notion.com/p/e4e183d73e454d03a8594029768b33b9

STEP 1 — Read what already exists so you never add a duplicate.
Query the Research Pipeline (auto) database and note every company already listed.
Also check the "CSR Pipeline Tracker" and the "Companies" database inside "IT/ITeS
Companies: Engagement Tracker" (both under the "PanIIT Alumni Foundation (PARFI):
Fundraising Team" page). Treat every company in any of those three as already known
— do not re-add it, and do not add its subsidiary or its foundation.

STEP 2 — Research, applying this screen ruthlessly.
The most important filter: a company that runs its OWN training institutes is a WEAK
prospect no matter how large its CSR budget, because it spends that budget internally
and is a peer to PARFI rather than a funder. Tech Mahindra (SMART Academies), L&T
(CSTI), Bosch (BRIDGE), NIIT Foundation, ICICI (Academy for Skills), Reliance
Foundation, Adani (Saksham) and Bharti (Satya Bharti Schools) are examples of this
trap. Mark such companies "Self-implementer" with "Low" grant odds — and prefer not
to surface them at all.

What you actually want: companies that GRANT money to external NGOs to deliver. The
strongest evidence is a named grant to a named outside organisation. If you cannot
find such evidence, say so plainly in "Evidence It Funds Outsiders" and set Funding
Model to "Unknown" rather than guessing.

Also valuable: an IIT alumni connection in senior leadership, a Bengaluru or Mumbai
head office, and CSR themes covering vocational education, women's empowerment, or
livelihoods.

Rotate your focus by weekday so a week covers ground instead of retreading one
sector: Mon Global Capability Centres · Tue pharma and healthcare · Wed BFSI and
foreign banks · Thu manufacturing, auto and engineering · Fri FMCG and consumer ·
Sat family foundations and UHNI philanthropy · Sun PSUs and infrastructure.

Use web search for current information. Verify claims about budgets, programmes and
people against what you actually find — do not assert from memory.

STEP 3 — Write up to 4 new companies as rows in Research Pipeline (auto).
Quality beats quantity: 2 well-evidenced grant-makers beat 4 speculative entries. If
nothing clears the bar, add nothing — a quiet day is a valid result, not a failure.

Fill these properties: Company, Sector, HQ City, CSR Budget, Funding Model, Grant
Odds, Priority (Tier 1/2/3), Themes, CSR Focus, Evidence It Funds Outsiders, IIT
Connection, Warm Path, Why It Fits, Named Leads, Sources (one URL), Found On (today's
date). Set Review Status to "New".

For "Named Leads", put one person per line as: Name — Title — IIT link if any — how
to reach them. Use only publicly reported names and titles. NEVER invent an email
address or phone number; leave contact details out entirely.

STEP 4 — Report back briefly: which companies you added and why each cleared the
grant-maker bar, or that nothing did.

Be honest about uncertainty in the fields themselves rather than overstating what you
found.
```

## Checking it worked

- **In Notion:** open Research Pipeline (auto). New rows have Review Status "New".
- **In the app:** press **Sync from Notion**, then open the Research tab. Rows from
  the Routine carry a green **New** badge for 36 hours.
- **On WhatsApp:** the morning digest lists anything synced but not yet sent.

## Editing the brief later

Change the prompt in the Routine, not in this repo — the Routine is the thing that
runs. Useful edits: narrowing to a sector you're actively pitching, raising the bar
("only companies with a named grant of ₹1 Cr or more"), or adding companies to the
never-suggest list as you rule them out.
