from pathlib import Path

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
FORM = ROOT / "experiments" / "2026-05-get-matched-form-optimization" / "best-form.html"
OUT = ROOT / "reports" / "visual-audit"


def click(page, name: str) -> None:
    page.locator("button").filter(has_text=name).click()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    url = FORM.as_uri()

    with sync_playwright() as p:
        browser = p.chromium.launch()

        for label, width, height in [("desktop", 1440, 1000), ("mobile", 390, 844)]:
            page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
            page.goto(url)
            page.screenshot(path=OUT / f"best-form-{label}.png", full_page=True)
            page.close()

        page = browser.new_page(viewport={"width": 1280, "height": 920}, device_scale_factor=1)
        page.goto(url)
        click(page, "Yes, I found a property")
        click(page, "Bridge a timing gap")
        click(page, "Single Family")
        click(page, "ASAP")
        click(page, "$250K - $500K")
        page.locator("#loan_amount").fill("300000")
        click(page, "Continue")
        expect(page.get_by_text("Are you already working with a realtor?")).not_to_be_visible()
        expect(page.get_by_text("What position will this loan be?")).to_be_visible()
        page.close()

        page = browser.new_page(viewport={"width": 1280, "height": 920}, device_scale_factor=1)
        page.goto(url)
        expect(page.get_by_text("1 / 8")).to_be_visible()
        expect(page.get_by_text("Contact comes after your preview", exact=True)).to_be_visible()
        click(page, "Yes, I found a property")
        click(page, "Buy and hold rental")
        click(page, "Multi-Family: 2-4 Units")
        click(page, "Within 30 days")
        click(page, "$500K - $750K")
        page.locator("#loan_amount").fill("500000")
        click(page, "Continue")
        expect(page.get_by_text("Are you already working with a realtor?")).to_be_visible()
        click(page, "No, I need a realtor")
        expect(page.get_by_text("Would you like us to match you with an investor-friendly realtor?")).to_be_visible()
        click(page, "Yes, match me with an investor-friendly realtor")
        click(page, "Continue")
        click(page, "1st (only mortgage)")
        click(page, "Good (680-719)")
        click(page, "No")
        click(page, "Continue")
        page.locator("#property_zip").fill("48226")
        click(page, "Continue")
        expect(page.get_by_text("Your lender match", exact=True)).to_be_visible()
        expect(page.get_by_text("Your lender match is ready.", exact=True)).to_be_visible()
        page.screenshot(path=OUT / "best-form-preview.png", full_page=True)
        page.locator("#name").fill("Jordan Smith")
        page.locator("#email").fill("jordan@example.com")
        page.locator("#phone").fill("5555550123")
        page.locator("#consent").check()
        click(page, "Send My Matched Options")
        expect(page.get_by_text("Your lender match request is ready.")).to_be_visible()
        page.screenshot(path=OUT / "best-form-complete.png", full_page=True)
        page.close()

        browser.close()

    print("best-form visual and interaction checks passed")


if __name__ == "__main__":
    main()
