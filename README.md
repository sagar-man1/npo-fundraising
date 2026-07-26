# PARFI Fundraising Leads

A working dashboard for the PanIIT Alumni Foundation fundraising team. Two tabs:

- **Current leads** — a live mirror of the Notion trackers (CSR Pipeline Tracker and
  the IT/ITeS Companies tracker), pulled through the Notion API.
- **Research** — net-new companies and named people to approach, kept in a local
  database so the team can edit, triage and promote them into Notion.

## The one idea the ranking is built on

A large CSR budget is worthless to PARFI if the company spends it on itself.

Companies that run their own training institutes — Tech Mahindra's SMART Academies,
L&T's CSTI, Bosch's BRIDGE, Dr. Reddy's LABS, NIIT Foundation, ICICI's Academy for
Skills — absorb their skilling budget internally. They are peers and potential
delivery partners, not funders. Every company in both tabs therefore carries:

| Field | Meaning |
| --- | --- |
| **Funding model** | `Grant-maker` · `Mixed` · `Self-implementer` · `Unknown` |
| **Grant odds** | `High` · `Medium` · `Low` — chance of funding an outside partner |

The Research tab defaults to showing grant-makers only. On the Current leads tab,
rows synced from Notion inherit a starting assessment automatically (see
`src/lib/deliveryModels.ts`), which anyone can override in the UI. Overrides are
stored locally — Notion stays the system of record for stage, owner and next action.

## Setup

```bash
npm install
cp .env.example .env      # then fill in the values below
npm run db:migrate        # create the SQLite database
npm run seed              # load the researched companies and leads
npm run dev               # http://localhost:3000
```

The Research tab works immediately after seeding. Current leads stays empty until
Notion is connected.

### Connecting Notion

1. Create an internal integration at <https://www.notion.so/my-integrations> and copy
   the token (starts with `ntn_`) into `NOTION_TOKEN`.
2. Open each database in Notion → **⋯ → Connections → Connect to** → your integration.
   Do this for the **CSR Pipeline Tracker** and the **Companies** database inside the
   *IT/ITeS Companies: Engagement Tracker* page. Without this step the API returns a
   404 even though the token is valid.
3. Copy each database ID out of its URL into `NOTION_PIPELINE_DB_ID` and
   `NOTION_COMPANIES_DB_ID`. In
   `notion.so/workspace/<32-character-id>?v=…` the ID is that 32-character string.
4. Restart `npm run dev` and press **Sync from Notion**.

Sync is pull-only and safe to re-run: rows are matched on their Notion page ID,
updated in place, and rows deleted in Notion are dropped from the local mirror.

The one write path is the **Push to Notion pipeline** button on a research company,
which creates a new row in the CSR Pipeline Tracker. Nothing is written to Notion
unless someone clicks it.

### Optional password

Set `APP_PASSWORD` to put the whole app behind a shared password. Leave it empty and
auth is skipped entirely, which is what you want for local use.

## Adding to the research tab

Use **Add company** in the UI, or edit `prisma/seed.ts` and re-run `npm run seed`
(the seed upserts by company name, so it is safe to run repeatedly).

When adding a company, the field that matters most is **evidence it funds external
NGOs** — a named grant to an outside organisation. Without that, assume the company
is a self-implementer and rank it accordingly.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind · Prisma 7 + SQLite · Notion API
`2025-09-03` via `@notionhq/client` v5.

Notes for anyone extending this:

- Prisma 7 needs a driver adapter; the client is built in `src/lib/db.ts`.
- The Notion API moved rows from databases onto *data sources*, so a database ID has
  to be exchanged for its data source ID before querying. `src/lib/notion.ts` handles
  that.
- Next.js 16 renamed middleware to `proxy.ts`.
