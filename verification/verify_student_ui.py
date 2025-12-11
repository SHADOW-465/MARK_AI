from playwright.sync_api import sync_playwright

def verify_student_login_and_dashboard(page):
    print("Navigating to login page...")
    page.goto("http://localhost:3000/auth/login")

    # Wait for the login page to load
    page.wait_for_selector("text=Welcome Back")

    print("Verifying toggle exists...")
    # Verify the toggle buttons exist
    student_tab = page.locator("button", has_text="Student")
    if not student_tab.is_visible():
        raise Exception("Student tab not found")

    print("Clicking Student tab...")
    student_tab.click()

    # Take screenshot of login with Student selected
    page.screenshot(path="verification/student_login.png")
    print("Login screenshot taken.")

    # Note: We cannot actually log in because we don't have a valid user in the DB
    # that is linked to a student (since we couldn't run the migration or insert data).
    # However, we can verify the Student Dashboard layout by navigating to it directly if the middleware permits,
    # OR we can verify the UI elements on the login page changed color (purple theme).

    # Let's try to verify the color change (The button should have purple gradient)
    login_button = page.locator("button[type='submit']")
    # We can't easily check CSS gradient in playwright without evaluating JS,
    # but the screenshot will show it.

    print("Verifying Student Signup page...")
    page.goto("http://localhost:3000/auth/student-signup")
    page.wait_for_selector("text=Student Registration")
    page.screenshot(path="verification/student_signup.png")
    print("Signup screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_student_login_and_dashboard(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
