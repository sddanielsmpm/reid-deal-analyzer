from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "reports" / "visual-audit"

TARGETS = [
    {
        "name": "onsite-get-matched",
        "url": "https://reinvestorguide.com/get-matched",
    },
    {
        "name": "third-party-mpm",
        "url": "https://mpm.secure-clix.com/",
    },
    {
        "name": "local-brainstorm",
        "url": (ROOT / "experiments" / "2026-05-get-matched-form-optimization" / "brainstorm.html").as_uri(),
    },
]

VIEWPORTS = [
    ("desktop", 1440, 1000),
    ("mobile", 390, 844),
]


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        for target in TARGETS:
            for label, width, height in VIEWPORTS:
                page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
                page.goto(target["url"], wait_until="domcontentloaded", timeout=45000)
                page.wait_for_timeout(3500)
                page.screenshot(path=OUTPUT_DIR / f"{target['name']}-{label}.png", full_page=True)
                print(f"captured {target['name']} {label}")
                page.close()
        browser.close()


if __name__ == "__main__":
    main()
