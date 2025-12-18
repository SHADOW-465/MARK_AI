from playwright.sync_api import sync_playwright

def verify_student_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:3000/student/dashboard", timeout=10000)
            page.wait_for_load_state("networkidle")
        except Exception as e:
            print(f"Navigation error: {e}")

        page.screenshot(path="verification/dashboard.png")
        print("Dashboard screenshot taken")

        try:
            page.goto("http://localhost:3000/student/performance", timeout=10000)
            page.wait_for_load_state("networkidle")
        except Exception as e:
             print(f"Navigation error: {e}")

        page.screenshot(path="verification/performance.png")
        print("Performance screenshot taken")

        browser.close()

if __name__ == "__main__":
    verify_student_dashboard()
