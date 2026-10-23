# ARC Cockpit

CRM management analytics cockpit for ARC: five screens (Executive, Client Managers, Pipeline Health, CM360 with Win/Loss, Exceptions) on a GraphQL API.

- **web/**: React 18 + TypeScript + Vite, shadcn/ui (Radix primitives, Radix Icons), Tailwind CSS v4, Apollo Client, shadcn charts (Recharts), React Router.
- **server/**: a mock GraphQL server (GraphQL Yoga, TypeScript) loaded with the PILOT export of 22 Sep 2026. It mirrors the API the Airgen ERP will provide, so the web app does not change when we switch.

## Run it

Requires Node 20 or newer.

```bash
npm install            # installs both workspaces
npm run dev:server     # http://localhost:4000/graphql
npm run dev:web        # http://localhost:5173  (in a second terminal)
```

Other scripts: `npm test` (reconciliation tests), `npm run typecheck`, `npm run build`, `npm run codegen` (regenerates typed GraphQL documents after a schema change).

## Structure (MVC)

```
server/
  data/                     PILOT opportunities, quarterly goal rows, manager directory, status and exception rules
  src/models/               data access and every KPI rule (measures.ts), periods, filters, exceptions, scope checks
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

## Switching to Airgen

1. Set `VITE_GRAPHQL_URL` in `web/.env` to the Airgen ERP GraphQL endpoint (see `.env.example`).
2. Point `schema` in `web/codegen.ts` at that endpoint and run `npm run codegen`; fix any query that no longer matches.
3. The mock server can then be retired, or kept for local development and tests.

Reference figures the build must reproduce (tested in `server/test/reconciliation.test.ts`): 563 opportunities, achieved GP AED 14,425,155, open forecast AED 24,333,837, Q3 target AED 10,436,648, Q3 achieved GP AED 6,869,748.
