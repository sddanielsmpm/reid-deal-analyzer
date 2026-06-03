# reinvestorguide.com

Working directory for optimizing the Real Investor Guide funnel, forms, traffic growth, and affiliate/partner handoffs.

## Directory Structure

```text
src/
  components/   Reusable UI pieces such as CTAs, trust blocks, cards, and form sections.
  forms/        Form flows, validation logic, field schemas, and submit handlers.
  lib/          Shared helpers for tracking, partner routing, API clients, and utilities.
  pages/        Page-level templates or route files.
  styles/       Site styles, tokens, layout rules, and responsive behavior.
public/
  assets/       Downloadable/static assets.
  images/       Optimized images used by pages and landing flows.
  tools/        Public static tools and SaaS prototypes.
experiments/   A/B tests, variant specs, hypotheses, and results.
analytics/     Event taxonomy, tracking plans, dashboards, and QA notes.
partners/      Affiliate partner requirements, routing rules, payout notes, and API docs.
content/       SEO briefs, landing-page copy, offers, FAQs, and editorial drafts.
docs/          Architecture notes, setup docs, decisions, and onboarding material.
reports/       Funnel audits, conversion reports, traffic notes, and weekly summaries.
scripts/       Local automation, audits, migrations, and one-off utilities.
tests/         Unit, integration, analytics, and form-flow tests.
archive/       Deprecated experiments, old copy, screenshots, and retired assets.
```

## Optimization Priorities

Track every meaningful funnel step: page view, CTA click, form start, field error, form submit, partner redirect, and thank-you page view. Favor changes that improve qualified traffic, form completion rate, partner click-through rate, or attribution quality.

## Working Notes

Keep partner-specific logic in `partners/` or `src/lib/partner-*` helpers. Keep form behavior in `src/forms/` so validation, step order, and tracking are easy to test. Store experiment briefs in `experiments/` before implementation and results after rollout.

## Deal Workbench

The Deal Workbench SaaS prototype is available at:

```text
public/tools/deal-workbench/index.html
```

It supports SFR and small multifamily rental intake, live lender-style metrics, cloned scenario comparisons, shareable encoded links, local draft saving, and print-to-PDF report output.

Run the local smoke check with:

```bash
.venv/bin/python scripts/check_deal_workbench.py
```
