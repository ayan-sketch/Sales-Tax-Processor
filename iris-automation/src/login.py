import sys
from playwright.sync_api import Page

from src.config import settings
from src.browser import save_session


def wait_for_login(page: Page):
    """Navigate to IRIS login and wait for user to log in manually."""
    page.goto(settings.IRIS_LOGIN_URL)
    print("=" * 60)
    print("  IRIS MANUAL LOGIN REQUIRED")
    print("  =========================")
    print(f"  Browser opened. Please log in to IRIS manually.")
    print(f"  The script will detect login and continue automatically.")
    print(f"  Timeout: {settings.LOGIN_TIMEOUT_MINUTES} minutes")
    print("=" * 60)

    timeout_ms = settings.LOGIN_TIMEOUT_MINUTES * 60 * 1000
    try:
        page.wait_for_selector(
            settings.LOGIN_SUCCESS_INDICATOR,
            timeout=timeout_ms,
        )
        print(" Login detected! Saving session...")
        save_session(page.context)
        print(" Session saved. Continuing automation...")
    except Exception:
        print(" Login timeout. Please try again.")
        sys.exit(1)


def ensure_logged_in(page: Page):
    """Restore session or trigger manual login."""
    if page.url and "dashboard" in page.url:
        return
    page.goto(settings.IRIS_DASHBOARD_URL)
    if "login" in page.url.lower() or "auth" in page.url.lower():
        wait_for_login(page)
