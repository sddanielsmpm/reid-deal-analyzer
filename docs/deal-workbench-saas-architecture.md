# Deal Workbench SaaS Architecture

## Product Surface

The first public SaaS surface is a structured rental deal workbench for SFR and small multifamily investors. Users enter property, income, expense, leverage, and strategy assumptions once, then compare cloned scenarios and export a lender-style report.

The static prototype lives at:

```text
public/tools/deal-workbench/index.html
```

## Multi-Tenant Model

Core entities:

- `Tenant`: workspace/account boundary for one investor, brokerage, lender desk, or advisory team.
- `User`: authenticated identity attached to one or more tenants.
- `Subscription`: plan, deal limits, PDF/export limits, and billing status for a tenant.
- `Deal`: canonical intake record owned by a tenant.
- `Scenario`: cloned structure for one deal with adjusted price, leverage, rate, rent, or expense assumptions.
- `ShareLink`: signed read-only or editable token with optional expiration.
- `ReportExport`: generated PDF artifact with source deal version and scenario set.

Every database query for deal, scenario, share-link, and report data should be scoped by `tenant_id`. Public share routes should resolve through signed tokens rather than raw tenant/deal IDs.

## Free Tier

Initial gating:

- Login required before saving a deal.
- Free plan allows a small number of saved deals per tenant.
- Unlimited local draft edits before save.
- PDF exports and share links can be limited by plan after launch.

The current prototype shows the free-plan workspace shell and uses browser local storage for draft persistence.

## Calculation Engine

The current calculation engine is client-side and deterministic:

```text
public/tools/deal-workbench/assets/deal-calculations.js
```

For production, keep the same input/output contract and run the engine server-side when saving, sharing, or exporting. Store calculated snapshots with each deal version so lender PDFs can be reproduced later.

Primary metrics:

- DSCR
- LTV
- LTC
- Cap rate
- Monthly and annual cash flow
- Cash-on-cash return
- Break-even occupancy

## API Shape

Recommended routes:

```text
POST   /api/tenants/:tenant_id/deals
GET    /api/tenants/:tenant_id/deals
GET    /api/tenants/:tenant_id/deals/:deal_id
PATCH  /api/tenants/:tenant_id/deals/:deal_id
POST   /api/tenants/:tenant_id/deals/:deal_id/scenarios
PATCH  /api/tenants/:tenant_id/scenarios/:scenario_id
POST   /api/tenants/:tenant_id/deals/:deal_id/share-links
POST   /api/tenants/:tenant_id/deals/:deal_id/report-exports
GET    /share/:token
```

## PDF Generation

Use server-side HTML-to-PDF rendering for production exports. The client should submit a deal version and selected scenarios, then the backend renders the same lender report template with tenant branding, immutable source assumptions, and export metadata.

The prototype uses `window.print()` with print CSS as the one-click PDF path.

## Security Notes

- Require authentication for saved deals and exports.
- Scope all tenant data at the database and application layers.
- Use signed, random share tokens with explicit permissions and expiration.
- Avoid putting sensitive borrower data in share-link query strings.
- Log report exports and share-link access for tenant auditability.
