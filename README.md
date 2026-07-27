# PARFI Fundraising Leads

A working dashboard for the PanIIT Alumni Foundation fundraising team. Two tabs:

- **Current leads** — a live mirror of the Notion trackers (CSR Pipeline Tracker and
  the IT/ITeS Companies tracker), pulled through the Notion API.
- **Research** — net-new companies and named people to approach, kept in a local
  database so the team can edit, triage and promote them into Notion.

Every morning a scheduled job researches fresh prospects and sends them to WhatsApp.
It runs as its own always-on service, so it does not depend on anyone's laptop being
awake — see [Running it every morning](#running-it-every-morning).

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

---

## Running it every morning

Three pieces: a **research agent** that finds prospects, a **WhatsApp sender** that
delivers them, and a **scheduler** that fires the pair daily.

### 1. Research agent

Set `ANTHROPIC_API_KEY` in `.env`. Each run searches the web, applies the
grant-maker screen above, drops anything already in the pipeline, and writes what
survives into the Research tab flagged **New**.

The brief rotates by weekday (GCCs, pharma, BFSI, manufacturing, FMCG, family
foundations, PSUs) so a week of runs covers ground instead of retreading one sector.
It is told to return fewer prospects rather than pad with speculative ones, so a
morning with nothing new is a valid result, not a failure.

Try it before scheduling anything:

```bash
npm run research:now              # research only, no message
npm run research:now -- --notify  # research and send the WhatsApp message
```

### 2. WhatsApp

Messages are sent by driving the **real WhatsApp Web UI** in a browser, so there is
no WhatsApp Business account and no Meta-approved template. Log in once:

```bash
npm run whatsapp:login   # opens a browser; scan the QR code with your phone
```

The session is saved in `.whatsapp-profile/` (gitignored) and reused every morning.
Set `WHATSAPP_CONTACT` to the contact name **exactly** as it appears in your WhatsApp
chat list — the driver searches for that string.

Two interchangeable drivers, chosen with `WHATSAPP_DRIVER`:

| Driver | What it does | When to use it |
| --- | --- | --- |
| `playwright` (default) | Clicks the search box, opens the chat, types, sends | Daily use — deterministic and costs nothing per run |
| `computer-use` | Claude looks at screenshots and drives the mouse and keyboard | Fallback if a WhatsApp redesign breaks the selectors |

The computer-use driver is a genuine fallback rather than the default because it
costs tokens on every run and is slower and less predictable — not what you want
for something that has to fire unattended at 7:30 every morning.

### 3. Scheduler on the Mac mini

The scheduler is a long-lived process, installed as a launchd **user agent** (not a
system daemon — WhatsApp Web needs a real logged-in GUI session).

```bash
git clone <this repo> ~/parfi-fundraising && cd ~/parfi-fundraising
npm install
cp .env.example .env      # fill in ANTHROPIC_API_KEY, NOTION_*, WHATSAPP_CONTACT
npm run db:migrate
npm run seed
npm run whatsapp:login    # scan the QR code once
./deploy/install-macos.sh
```

Then stop the machine sleeping through a run:

```bash
sudo pmset -a sleep 0 disablesleep 1
```

Set the time with `RESEARCH_CRON` (default `30 7 * * *`) and `RESEARCH_TZ` (default
`Asia/Kolkata`).

**Runbook**

| Task | Command |
| --- | --- |
| Status | `launchctl print gui/$UID/com.parfi.fundraising.scheduler \| head -20` |
| Logs | `tail -f ~/parfi-fundraising/logs/scheduler.log` |
| Stop | `launchctl bootout gui/$UID/com.parfi.fundraising.scheduler` |
| Start | `launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.parfi.fundraising.scheduler.plist` |
| Update | `git pull && npm install && npm run db:migrate && ./deploy/install-macos.sh` |
| Force a run now | `npm run research:now -- --notify` |

The dashboard itself is separate from the scheduler. To keep it up too, run
`npm run build && npm run start` (add a second launchd agent if you want it to
survive reboots).

**If the morning message doesn't arrive:** check `logs/scheduler.error.log` first.
The usual causes are an expired WhatsApp Web session (re-run `npm run whatsapp:login`)
or a `WHATSAPP_CONTACT` that no longer matches the chat name. A research failure and
a delivery failure are recorded separately — prospects found are always saved even
when the message fails, so nothing is lost and you can resend.

### Triggering from elsewhere

`POST /api/jobs/daily-research` runs the same job. Set `CRON_SECRET` and send it as
the `x-cron-secret` header; the endpoint bypasses `APP_PASSWORD` so an external
scheduler can reach it.

```bash
curl -X POST http://localhost:3000/api/jobs/daily-research \
  -H "Content-Type: application/json" -H "x-cron-secret: $CRON_SECRET" \
  -d '{"notify": true}'
```

## Adding to the research tab

Use **Add company** in the UI, or edit `prisma/seed.ts` and re-run `npm run seed`
(the seed upserts by company name, so it is safe to run repeatedly).

When adding a company, the field that matters most is **evidence it funds external
NGOs** — a named grant to an outside organisation. Without that, assume the company
is a self-implementer and rank it accordingly.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind · Prisma 7 + SQLite · Notion API
`2025-09-03` via `@notionhq/client` v5 · Claude Opus 5 with server-side web search ·
Playwright · node-cron.

Notes for anyone extending this:

- Prisma 7 needs a driver adapter; the client is built in `src/lib/db.ts`.
- The Notion API moved rows from databases onto *data sources*, so a database ID has
  to be exchanged for its data source ID before querying. `src/lib/notion.ts` handles
  that.
- Next.js 16 renamed middleware to `proxy.ts`.
