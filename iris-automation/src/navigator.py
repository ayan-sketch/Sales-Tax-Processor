from playwright.sync_api import Page

from src import selectors as sel
from src.config import settings


def go_to_return_page(page: Page):
    """Navigate to the NITR return filing section."""
    page.goto(settings.IRIS_RETURN_URL)
    page.wait_for_load_state("networkidle")


def click_new_return(page: Page):
    """Click the 'File Return' button to start a new return."""
    btn = page.locator(sel.BTN_FILE_RETURN).first
    if btn.is_visible():
        btn.click()
        page.wait_for_load_state("networkidle")
        return True
    return False


def select_tax_year(page: Page, year: str):
    """Select tax year from dropdown."""
    dd = page.locator(sel.TAX_YEAR_DROPDOWN).first
    if dd.is_visible():
        dd.select_option(value=year)
        page.wait_for_timeout(500)


def click_continue(page: Page):
    btn = page.locator(sel.BTN_CONTINUE).first
    if btn.is_visible():
        btn.click()
        page.wait_for_load_state("networkidle")


def click_submit(page: Page):
    btn = page.locator(sel.BTN_SUBMIT).first
    if btn.is_visible():
        btn.click()
        page.wait_for_timeout(1000)
        confirm = page.locator(sel.BTN_CONFIRM).first
        if confirm.is_visible():
            confirm.click()
            page.wait_for_load_state("networkidle")


def fill_input(page: Page, selector: str, value: str):
    if not value:
        return
    el = page.locator(selector).first
    if el.is_visible():
        el.click()
        el.fill(value)


def fill_select(page: Page, selector: str, value: str):
    if not value:
        return
    el = page.locator(selector).first
    if el.is_visible():
        el.select_option(value=value)
