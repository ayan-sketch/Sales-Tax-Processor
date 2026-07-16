from playwright.sync_api import Page

from src.returns.base import BaseReturnFiler
from src.navigator import fill_input, fill_select, click_continue, click_submit
from src import selectors as sel


class IndividualReturnFiler(BaseReturnFiler):
    """Fill an Individual Income Tax Return on IRIS."""

    REQUIRED_FIELDS = [
        "ntn", "name", "tax_year",
        "salary_income", "business_income",
        "taxable_income", "tax_payable",
    ]

    def validate(self) -> list[str]:
        missing = []
        for field in self.REQUIRED_FIELDS:
            if not self.data.get(field):
                missing.append(field)
        return missing

    def fill(self):
        errors = self.validate()
        if errors:
            print(f"  Missing required fields: {', '.join(errors)}")
            return

        # ── Step 1: Personal Information ──
        self.log_step("Filling personal information...")
        fill_input(self.page, sel.input_by_formcontrol("name"), self.data.get("name"))
        fill_input(self.page, sel.input_by_formcontrol("ntn"), self.data.get("ntn"))
        fill_input(self.page, sel.input_by_formcontrol("cnic"), self.data.get("cnic"))
        fill_input(self.page, sel.input_by_formcontrol("email"), self.data.get("email"))
        fill_input(self.page, sel.input_by_formcontrol("phone"), self.data.get("phone"))
        fill_input(self.page, sel.input_by_formcontrol("address"), self.data.get("address"))
        click_continue(self.page)

        # ── Step 2: Income from Salary ──
        self.log_step("Filling salary income...")
        fill_input(self.page, sel.input_by_formcontrol("salaryAmount"), self.data.get("salary_income"))
        fill_input(self.page, sel.input_by_formcontrol("salaryTaxDeducted"), self.data.get("salary_tax_deducted"))
        click_continue(self.page)

        # ── Step 3: Income from Business ──
        self.log_step("Filling business income...")
        fill_input(self.page, sel.input_by_formcontrol("businessAmount"), self.data.get("business_income"))
        fill_input(self.page, sel.input_by_formcontrol("businessCost"), self.data.get("business_cost"))
        fill_input(self.page, sel.input_by_formcontrol("businessTaxDeducted"), self.data.get("business_tax_deducted"))
        click_continue(self.page)

        # ── Step 4: Income from Property ──
        self.log_step("Filling property income...")
        fill_input(self.page, sel.input_by_formcontrol("propertyAmount"), self.data.get("property_income"))
        fill_input(self.page, sel.input_by_formcontrol("propertyTaxDeducted"), self.data.get("property_tax_deducted"))
        click_continue(self.page)

        # ── Step 5: Income from Capital Gains ──
        self.log_step("Filling capital gains...")
        fill_input(self.page, sel.input_by_formcontrol("capitalGainsAmount"), self.data.get("capital_gains"))
        fill_input(self.page, sel.input_by_formcontrol("capitalGainsTax"), self.data.get("capital_gains_tax"))
        click_continue(self.page)

        # ── Step 6: Other Income ──
        self.log_step("Filling other income...")
        fill_input(self.page, sel.input_by_formcontrol("otherIncomeAmount"), self.data.get("other_income"))
        fill_input(self.page, sel.input_by_formcontrol("otherIncomeTax"), self.data.get("other_income_tax"))
        click_continue(self.page)

        # ── Step 7: Deductions ──
        self.log_step("Filling deductions...")
        fill_input(self.page, sel.input_by_formcontrol("donations"), self.data.get("donations"))
        fill_input(self.page, sel.input_by_formcontrol("investment"), self.data.get("investment_deduction"))
        fill_input(self.page, sel.input_by_formcontrol("educationExpense"), self.data.get("education_expense"))
        fill_input(self.page, sel.input_by_formcontrol("medicalExpense"), self.data.get("medical_expense"))
        click_continue(self.page)

        # ── Step 8: Tax Credits ──
        self.log_step("Filling tax credits...")
        fill_input(self.page, sel.input_by_formcontrol("taxCreditAmount"), self.data.get("tax_credits"))
        click_continue(self.page)

        # ── Step 9: Wealth Statement ──
        self.log_step("Filling wealth statement...")
        fill_input(self.page, sel.input_by_formcontrol("immovableProperty"), self.data.get("wealth_property"))
        fill_input(self.page, sel.input_by_formcontrol("movableAssets"), self.data.get("wealth_movable"))
        fill_input(self.page, sel.input_by_formcontrol("cashBank"), self.data.get("wealth_cash"))
        fill_input(self.page, sel.input_by_formcontrol("investments"), self.data.get("wealth_investments"))
        fill_input(self.page, sel.input_by_formcontrol("liabilities"), self.data.get("wealth_liabilities"))
        click_continue(self.page)

        # ── Step 10: Summary & Submit ──
        self.log_step("Submitting return...")
        click_submit(self.page)
        self.log_step("Return filed successfully!")
