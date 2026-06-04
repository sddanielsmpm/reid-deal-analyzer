from pathlib import Path

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "public" / "tools" / "deal-workbench" / "index.html"
OUT = ROOT / "reports" / "visual-audit"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    url = PAGE.as_uri()

    with sync_playwright() as p:
        browser = p.chromium.launch()

        for label, width, height in [("desktop", 1440, 1100), ("mobile", 390, 920)]:
            page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
            page.goto(url)
            expect(page.get_by_text("Rental deal intake")).to_be_visible()
            expect(page.get_by_text("Lender-ready report")).to_be_visible()
            page.screenshot(path=OUT / f"deal-workbench-{label}.png", full_page=True)
            page.close()

        page = browser.new_page(viewport={"width": 1280, "height": 960}, device_scale_factor=1)
        page.goto(url)

        expect(page.get_by_text("Market-based assumptions")).to_be_visible()
        estimates = page.evaluate("() => window.DealWorkbench.estimateBase().fields")
        assert estimates["grossMonthlyRent"] > 0
        assert estimates["propertyTaxesAnnual"] > 0
        assert estimates["insuranceAnnual"] > 0

        page.get_by_role("button", name="Apply Estimates").click()
        assert int(page.locator("[data-field='grossMonthlyRent']").input_value()) == estimates["grossMonthlyRent"]

        engine = page.evaluate(
            """() => {
                const result = window.DealCalculations.calculateDeal({
                    purchasePrice: 300000,
                    currentValue: 300000,
                    grossMonthlyRent: 3600,
                    otherMonthlyIncome: 0,
                    vacancyRate: 5,
                    propertyTaxesAnnual: 3600,
                    insuranceAnnual: 1800,
                    managementRate: 8,
                    repairsMonthly: 250,
                    utilitiesMonthly: 0,
                    hoaMonthly: 0,
                    capexMonthly: 200,
                    rehabBudget: 10000,
                    closingCosts: 7000,
                    downPaymentPct: 25,
                    interestRate: 7,
                    loanTermYears: 30,
                    lenderPointsPct: 1
                });
                return result.metrics;
            }"""
        )
        assert round(engine["ltv"], 1) == 75.0
        assert engine["dscr"] > 1
        assert engine["monthlyCashFlow"] > 0

        page.locator("[data-field='purchasePrice']").fill("300000")
        page.locator("[data-field='grossMonthlyRent']").fill("3800")
        page.get_by_role("button", name="Lower Rate").click()
        expect(page.locator("[data-testid='scenario-card']")).to_have_count(2)
        expect(page.get_by_role("rowheader", name="Lower Rate")).to_be_visible()

        page.get_by_role("button", name="Copy Link").click()
        expect(page.locator("[data-share-output]")).to_be_visible()
        assert "deal=" in page.locator("[data-share-output]").input_value()

        expect(page.get_by_text("Scenario comparison")).to_be_visible()
        page.screenshot(path=OUT / "deal-workbench-interaction.png", full_page=True)
        page.close()

        browser.close()

    print("deal-workbench visual and interaction checks passed")


if __name__ == "__main__":
    main()
