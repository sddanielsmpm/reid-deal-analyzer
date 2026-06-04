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

## Estimate Data Layer

The prototype includes a client-side local estimate assist that applies ZIP/state rent, tax, insurance, management, repairs, utility, and capex assumptions. It also embeds the Steadily partner instant-estimate widget for landlord insurance and applies the returned premium to the insurance assumption when available.

For production, move this into a backend estimate service. The browser should submit a normalized property address and high-level property details, then the backend should return assumptions, source metadata, confidence, and fallback reasons.

Recommended source stack:

- Rent estimates and rent comps: RentCast rent estimate/comps, ATTOM Rental AVM, or a similar rental AVM provider.
- Rent fallback: HUD Fair Market Rent or Small Area FMR data by bedroom/ZIP/county when true comps are unavailable.
- Property taxes: ATTOM assessment/tax value data, county assessor integrations where available, then effective tax-rate fallback by jurisdiction.
- Insurance: Steadily Partner API or Steadily widget result for landlord insurance.
- Management, repairs, utilities, and capex: REIG assumption tables by market, property type, unit count, age, condition, and strategy.

The estimate service should store:

- `source`: provider or model name for each assumption.
- `confidence`: high, medium, low.
- `range_low` and `range_high`: especially for rent, taxes, insurance, repairs, and capex.
- `as_of_date`: when the estimate was fetched or calculated.
- `raw_provider_id`: provider record ID, parcel ID, or quote ID when available.

Do not expose provider API keys in the public app. Cache provider responses by normalized address and provider terms, and refresh stale estimate snapshots on demand rather than changing saved lender reports automatically.

## API Shape

Recommended routes:

```text
POST   /api/estimate-assumptions
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
