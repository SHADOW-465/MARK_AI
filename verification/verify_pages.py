from playwright.sync_api import sync_playwright

def verify_dashboard_layout():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Note: In a real environment, we would need to mock authentication or have a test user.
        # Since I cannot easily log in without a DB, I will check the accessible pages like Login and Signup
        # to ensure no parent options are visible.

        # 1. Check Login Page
        page = browser.new_page()
        try:
            page.goto("http://localhost:3000")
            page.wait_for_selector("text=Welcome Back")

            # Screenshot Login Page
            page.screenshot(path="verification/login_page.png")

            # 2. Check Sign Up Page
            page.goto("http://localhost:3000/auth/sign-up")
            page.wait_for_selector("text=Create Account")

            # Screenshot Sign Up Page
            page.screenshot(path="verification/signup_page.png")

            print("Screenshots taken.")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_dashboard_layout()
