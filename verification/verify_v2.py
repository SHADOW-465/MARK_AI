from playwright.sync_api import sync_playwright

def verify_new_ui(page):
    print("Navigating to student signup page...")
    # Using 3000 as per recent log
    page.goto("http://localhost:3000/auth/student-signup")

    # Wait for the page to load
    page.wait_for_selector("text=Student Registration")

    # Check if the new Class input exists
    print("Verifying Class input field...")
    class_input = page.locator("input#class")
    if not class_input.is_visible():
        raise Exception("Class input not found on Signup page")

    print("Taking screenshot of Signup Page...")
    page.screenshot(path="verification/student_signup_v2.png")

    # Check Logic Login Toggle
    print("Navigating to login page...")
    page.goto("http://localhost:3000/auth/login")
    page.wait_for_selector("text=Welcome Back")

    print("Verifying Student Tab...")
    student_tab = page.locator("button", has_text="Student")
    if not student_tab.is_visible():
        raise Exception("Student tab not found on Login page")

    # Click it to see visual change
    student_tab.click()
    page.screenshot(path="verification/login_toggle_v2.png")
    print("Screenshots taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_new_ui(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
