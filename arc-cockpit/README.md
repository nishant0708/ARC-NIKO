# ARC Cockpit

CRM management analytics cockpit for ARC: five screens (Executive, Client Managers, Pipeline Health, CM360 with Win/Loss, Exceptions) on a GraphQL API.

- **web/**: React 18 + TypeScript + Vite, shadcn/ui (Radix primitives, Radix Icons), Tailwind CSS v4, Apollo Client, shadcn charts (Recharts), React Router.
- **server/**: a mock GraphQL server (GraphQL Yoga, TypeScript) loaded with the PILOT export of 22 Sep 2026. It mirrors the API the Airgen ERP will provide, so the web app does not change when we switch.

## Run it

Requires Node 20.12 or newer.

```bash
npm install            # installs both workspaces
npm run dev:server     # http://localhost:4000/graphql
npm run dev:web        # http://localhost:5173  (in a second terminal)
```

Other scripts: `npm test` (reconciliation tests), `npm run typecheck`, `npm run build`, `npm run codegen` (regenerates typed GraphQL documents after a schema change).

## Live data from the Airgen ERP

The server reads from one of two sources, set in `server/.env` (copy `server/.env.example`):

- `DATA_SOURCE=airgen`: live records from your Airgen ERP over MCP, using `AGENTIC_ERP_URL` and `AGENTIC_ERP_TOKEN`. Refreshed every `ERP_REFRESH_MINUTES` (default 15). If a refresh fails, the last good data stays and the cockpit shows a note.
- `DATA_SOURCE=file`: the PILOT export files in `server/data` (used by the tests).

The key stays on the server; the browser never sees it. Use a **read-only** ERP key for the cockpit.

Which ERP tables are read, and how their fields map to the cockpit, is in `server/data/erp-mapping.json`. The cockpit reads the ARC "niko" tables, and only these:

| Cockpit | ERP table | Notes |
|---|---|---|
| Opportunities | `arcOpportunity` (find_many_arc_opportunities) | `opportunityId` is the CRM GUID (join key), `name` the ARC opportunity ID; `cmId` and `accountId` are resolved to names through the two tables below |
| GP targets | `arcGpTarget` (find_many_arc_gp_targets) | one row per manager, quarter and metric; rows with `targetSource = Sample` turn on the "sample goals" badge |
| Client managers | `arcClientManager` (find_many_arc_client_managers) | the manager directory; INACTIVE managers are kept but marked inactive |
| Accounts | `arcAccount` (find_many_arc_accounts) | account name and vertical |

Only these four ARC niko tables are read. There is no fallback to any other table (`_og`, `crm_*` or the standard objects): if one of the four is missing, cannot be read or has no records, the server stops at start-up with an error naming the table. If a scheduled refresh fails later, the cockpit keeps the last good load and shows the error under "Data loading notes". The connector asks for every field (`select: ['*']`) in pages of 100.

If the server reports something it could not map (in the terminal and under "Data loading notes" in the cockpit), run:

```bash
npm run erp:discover --workspace server
```

It writes `server/erp-discovery.json` with the field lists and three full sample records of every ARC niko table. Status values must exist in `server/data/status-rules.json` (matching ignores case and underscores, so `ON_HOLD` matches `On Hold`); unknown statuses are excluded from every KPI and listed as a note.

## Adding shadcn components

`web/components.json` tells the shadcn CLI where things go in this MVC layout, so components land in the right folder with the right imports:

| Alias | Folder |
|---|---|
| `ui` | `web/src/views/ui` |
| `components` | `web/src/views/components` |
| `hooks` | `web/src/controllers` |
| `utils` | `web/src/lib/utils` |

Style is new-york on Tailwind v4 (`src/index.css`), zinc base colour, CSS variables, and `iconLibrary: radix`, so added components use Radix Icons, not lucide. To add one:

```bash
cd web
npm run ui:add -- tooltip      # same as: npx shadcn@latest add tooltip
```

Check new files for `lucide-react` imports before committing; replace any with `@radix-ui/react-icons`.

## Structure (MVC)

```
server/
  data/                     PILOT opportunities, quarterly goal rows, manager directory, status and exception rules
  src/models/               data access and every KPI rule (measures.ts), periods, filters, exceptions, scope checks
  src/models/erp/           Airgen ERP connector: MCP client and field mapping
  src/scripts/              erp:discover
  src/controllers/          GraphQL resolvers, one per screen, plus drill-through and options
  src/views/schema.graphql  the API contract
  test/                     reconciliation tests against the reference figures
web/src/
  models/                   Apollo client, GraphQL operations, generated types (gql/), display formatting
  controllers/              hooks: URL filters, theme, drill-through, one data hook per screen
  views/ui/                 shadcn components (lucide replaced by Radix Icons)
  views/components/         KPI card, scope line, charts, donut, drill sheet, notices
  views/layout/             app shell, global filter bar
  views/screens/            the five screens
```

## Rules the code enforces

- **Calculations live on the server.** The web app formats numbers; it never calculates a KPI. Each figure arrives with its scope (period, record count, governing date, exclusions, as-of).
- **Join on CRM GUID only.** Business IDs repeat (three collisions in the Q1 export).
- **Attribute to the business client manager** (`emitac_clientmanager`), never the record owner. Names not in the manager directory are flagged as unmapped.
- **Separate date roles:** achieved GP by actual close, open forecast by estimated close, targets by goal fiscal period.
- **Quarterly goals are explicit rows.** The full year sums them; nothing is divided into months.
- **Missing data is shown as missing:** undated deals are disclosed separately, missing probabilities are flagged and never defaulted, loss reason and competitor show "Not recorded", stage at loss shows "Not producible".
- **Overdue is calculated** from estimated close against the as-of date, not read from a stored flag.
- **Win rate** = won ÷ (won + lost); cancelled and disqualified deals are outside the denominator (pending ARC sign-off). The treatment lives in `server/data/status-rules.json`.
- **Filters live in the URL**, so they survive navigation and reload and can be shared as a link. The theme follows the system setting until changed, then is remembered.

## Data notes

- Opportunities, Q3 goals and the as-of date come from the PILOT exports.
- **Q1, Q2 and Q4 goals are sample values** (0.85, 0.95 and 1.1 × each manager's real Q3 goal), stored as explicit rows and labelled "Sample goal for demo" in `server/data/goals.json`. Replace them with real goals.
- The manager directory (`server/data/client-managers.json`) holds the 14 managers that have a Q3 Actual GP goal. Five other names on opportunities are reported as unmapped.

## Data notes for the live source

- Targets come from the ERP GP target table. Quarters without a goal row show "Not recorded"; nothing is divided or invented. A row whose owner, quarter, year or target is missing is skipped and listed in the data notes.
- Loss reason comes from `lostReason` when the ERP has one; otherwise it shows "Not recorded".
- If the ERP has no client manager table, the directory is the owners of "Actual GP" targets. Any other name on an opportunity is flagged as unmapped.
- The as-of date is the load date unless `ERP_AS_OF` is set.

Reference figures the build must reproduce (tested in `server/test/reconciliation.test.ts`): 563 opportunities, achieved GP AED 14,425,155, open forecast AED 24,333,837, Q3 target AED 10,436,648, Q3 achieved GP AED 6,869,748.
