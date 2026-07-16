from playwright.sync_api import sync_playwright, Browser, BrowserContext, Page

from src.config import settings


def launch() -> tuple[Browser, BrowserContext, Page]:
    p = sync_playwright().start()
    browser = p.chromium.launch(headless=settings.HEADLESS, slow_mo=settings.SLOW_MO)

    context = browser.new_context(
        viewport={"width": settings.VIEWPORT_WIDTH, "height": settings.VIEWPORT_HEIGHT},
        storage_state=settings.STORAGE_STATE if _session_exists() else None,
    )
    page = context.new_page()
    return browser, context, page


def save_session(context: BrowserContext):
    context.storage_state(path=settings.STORAGE_STATE)


def _session_exists() -> bool:
    import os
    return os.path.exists(settings.STORAGE_STATE)


def close(browser: Browser, context: BrowserContext):
    context.close()
    browser.close()
