"""
IRIS page element selectors.
These may change when FBR updates the IRIS portal.
Update this file to match the current portal structure.
"""

# ── Dashboard / Menu ─────────────────────────────────────────────
DASHBOARD = ".dashboard-container"
NAV_RETURNS = "a:has-text('Return'), a:has-text('Returns'), button:has-text('Return')"
NAV_NITR = "a:has-text('NITR'), a:has-text('Income Tax Return'), button:has-text('Income Tax')"

# ── Return Listing Page ──────────────────────────────────────────
BTN_FILE_RETURN = "button:has-text('File Return'), a:has-text('File Return'), button:has-text('New Return')"
BTN_CONTINUE = "button:has-text('Continue'), button:has-text('Next')"
BTN_SUBMIT = "button:has-text('Submit'), button:has-text('Submit Return')"
BTN_CONFIRM = "button:has-text('Yes'), button:has-text('Confirm'), button:has-text('OK')"

# ── Tax Year Selection ────────────────────────────────────────────
TAX_YEAR_DROPDOWN = "select[formcontrolname='taxYear'], select:has(option)"
TAX_YEAR_OPTION = "option[value='{year}']"

# ── Form Sections (Individual Return) ────────────────────────────
SECTION_PERSONAL_INFO = "//h3[contains(text(),'Personal')]"
SECTION_INCOME_SALARY = "//h3[contains(text(),'Salary')]"
SECTION_INCOME_BUSINESS = "//h3[contains(text(),'Business')]"
SECTION_INCOME_PROPERTY = "//h3[contains(text(),'Property')]"
SECTION_INCOME_CAPITAL_GAINS = "//h3[contains(text(),'Capital')]"
SECTION_INCOME_OTHER = "//h3[contains(text(),'Other Sources')]"
SECTION_DEDUCTIONS = "//h3[contains(text(),'Deduction')]"
SECTION_TAX_CREDITS = "//h3[contains(text(),'Tax Credit')]"
SECTION_WEALTH_STATEMENT = "//h3[contains(text(),'Wealth')]"
SECTION_SUMMARY = "//h3[contains(text(),'Summary')]"

# ── Generic form field patterns ──────────────────────────────────
def input_by_label(label: str) -> str:
    return f"//label[contains(text(),'{label}')]/following::input[1]"

def input_by_formcontrol(name: str) -> str:
    return f"input[formcontrolname='{name}']"

def select_by_formcontrol(name: str) -> str:
    return f"select[formcontrolname='{name}']"

def tab_by_name(name: str) -> str:
    return f"//a[contains(text(),'{name}')], //button[contains(text(),'{name}')]"
