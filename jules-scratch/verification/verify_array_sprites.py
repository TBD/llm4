from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"file://{os.getcwd()}/index.html")
        page.click("#startButton")
        page.screenshot(path="jules-scratch/verification/verification_array_sprites.png")
        browser.close()

if __name__ == "__main__":
    run()
