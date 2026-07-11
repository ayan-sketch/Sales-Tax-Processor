"""
Compliance Engine Service
Identifies missing compliance documents by comparing required filings
against uploaded documents for each client.
"""
from datetime import datetime, date, timedelta
from typing import Optional
from dataclasses import dataclass, field
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.client import Client
from app.models.document import Document, DocumentCategory, FilingStatus


@dataclass
class RequiredFiling:
    category: DocumentCategory
    year: int
    month: int
    deadline: date
    is_required: bool = True


@dataclass
class MissingDocument:
    client_id: str
    client_name: str
    client_ntn: Optional[str]
    required_type: DocumentCategory
    tax_year: int
    tax_month: int
    deadline: str
    days_overdue: int
    is_overdue: bool


@dataclass
class ComplianceMonthStatus:
    month: int
    month_name: str
    documents: list  # list of ComplianceDocumentStatus dicts


@dataclass
class ComplianceDocumentStatus:
    category: str
    status: str  # 'uploaded', 'missing', 'pending', 'not_required'
    document_id: Optional[str]
    filing_status: Optional[str]


# Month names
MONTH_NAMES = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

# Filing deadlines (approximate, Pakistan tax system)
# Sales Tax: 15th of following month
# 236H: 20th of month following quarter end
# 153: 20th of month following quarter end
SALES_TAX_DEADLINE_DAY = 15
QUARTERLY_DEADLINE_DAY = 20


def get_sales_tax_deadline(year: int, month: int) -> date:
    """Get deadline for sales tax return filing."""
    if month == 12:
        return date(year + 1, 1, SALES_TAX_DEADLINE_DAY)
    return date(year, month + 1, SALES_TAX_DEADLINE_DAY)


def get_quarterly_deadline(year: int, quarter_month: int) -> date:
    """Get deadline for quarterly withholding filing."""
    # Quarter months: Jan(1), Apr(4), Jul(7), Oct(10)
    # Deadline is in the 3rd month after quarter end + 20th
    deadline_month = quarter_month + 2
    deadline_year = year
    if deadline_month > 12:
        deadline_month -= 12
        deadline_year += 1
    return date(deadline_year, deadline_month, QUARTERLY_DEADLINE_DAY)


class ComplianceEngine:
    """Engine for determining compliance gaps."""

    def __init__(self, db: Session):
        self.db = db

    def get_required_filings(self, client: Client) -> list[RequiredFiling]:
        """Determine required filings based on client registrations."""
        required = []
        now = datetime.now()
        current_year = now.year
        current_month = now.month

        # Only check the last 2 years + current year
        year_range = range(current_year - 2, current_year + 1)

        for year in year_range:
            for month in range(1, 13):
                # Skip future months in current year
                if year == current_year and month > current_month:
                    break

                # Sales Tax Return: Monthly if registered
                if client.sales_tax_registered:
                    deadline = get_sales_tax_deadline(year, month)
                    required.append(RequiredFiling(
                        category=DocumentCategory.SALES_TAX_RETURN,
                        year=year,
                        month=month,
                        deadline=deadline,
                    ))

                # 236H: Quarterly (Jan, Apr, Jul, Oct)
                if client.withholding_registered and month in (1, 4, 7, 10):
                    deadline = get_quarterly_deadline(year, month)
                    required.append(RequiredFiling(
                        category=DocumentCategory.SECTION_236H,
                        year=year,
                        month=month,
                        deadline=deadline,
                    ))

                # 153: Quarterly (Jan, Apr, Jul, Oct)
                if client.withholding_registered and month in (1, 4, 7, 10):
                    deadline = get_quarterly_deadline(year, month)
                    required.append(RequiredFiling(
                        category=DocumentCategory.SECTION_153,
                        year=year,
                        month=month,
                        deadline=deadline,
                    ))

        return required

    def get_existing_filings(self, client_id: UUID) -> set[tuple]:
        """Get set of (category, year, month) that have been filed."""
        documents = (
            self.db.query(Document)
            .filter(
                Document.client_id == client_id,
                Document.is_deleted == False,
                Document.filing_status.in_([
                    FilingStatus.FILED,
                    FilingStatus.UPLOADED,
                    FilingStatus.PENDING,
                ]),
                Document.doc_category.isnot(None),
                Document.tax_year.isnot(None),
                Document.tax_month.isnot(None),
            )
            .all()
        )
        return {(d.doc_category.value, d.tax_year, d.tax_month) for d in documents}

    def is_filing_complete(
        self,
        required: RequiredFiling,
        existing: set[tuple],
    ) -> tuple[bool, Optional[str]]:
        """
        Check if a required filing is complete.
        Returns (is_complete, status).
        """
        key = (required.category.value, required.year, required.month)
        if key in existing:
            return True, "uploaded"
        return False, "missing"

    def get_missing_documents(
        self,
        client_id: Optional[str] = None,
        status_filter: str = "all",
    ) -> list[MissingDocument]:
        """Get all missing documents across clients."""
        now = date.today()

        # Get clients
        query = self.db.query(Client)
        if client_id:
            query = query.filter(Client.id == client_id)
        clients = query.all()

        missing = []

        for client in clients:
            required = self.get_required_filings(client)
            existing = self.get_existing_filings(client.id)

            for req in required:
                is_complete, filing_status = self.is_filing_complete(req, existing)
                if not is_complete:
                    days_overdue = (now - req.deadline).days
                    is_overdue = days_overdue > 0

                    # Apply status filter
                    if status_filter == "overdue" and not is_overdue:
                        continue
                    if status_filter == "upcoming" and is_overdue:
                        continue

                    missing.append(MissingDocument(
                        client_id=str(client.id),
                        client_name=client.client_name,
                        client_ntn=client.ntn,
                        required_type=req.category,
                        tax_year=req.year,
                        tax_month=req.month,
                        deadline=req.deadline.isoformat(),
                        days_overdue=max(0, days_overdue),
                        is_overdue=is_overdue,
                    ))

        # Sort by deadline descending (most urgent first)
        missing.sort(key=lambda m: m.deadline, reverse=True)
        return missing

    def get_missing_count(self) -> dict:
        """Get counts of missing documents by urgency."""
        missing = self.get_missing_documents()
        now = date.today()

        overdue_count = sum(1 for m in missing if m.is_overdue)
        upcoming_count = sum(
            1 for m in missing
            if not m.is_overdue and (date.fromisoformat(m.deadline) - now).days <= 30
        )

        return {
            "total_missing": len(missing),
            "overdue": overdue_count,
            "upcoming": upcoming_count,
        }

    def get_compliance_status(
        self,
        client_id: str,
        year: int,
    ) -> dict:
        """Get full compliance status for a client/year."""
        client = self.db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise ValueError(f"Client not found: {client_id}")

        required = self.get_required_filings(client)
        existing = self.get_existing_filings(client.id)

        # Group by month
        monthly_data: dict[int, list] = {}
        for req in required:
            if req.year != year:
                continue

            if req.month not in monthly_data:
                monthly_data[req.month] = []

            key = (req.category.value, req.year, req.month)
            is_uploaded = key in existing

            monthly_data[req.month].append({
                "category": req.category.value,
                "status": "uploaded" if is_uploaded else "missing",
                "document_id": None,  # TODO: fetch actual document_id
                "filing_status": "Filed" if is_uploaded else "Not Filed",
            })

        # Build response
        compliance_months = []
        for month_num in range(1, 13):
            docs = monthly_data.get(month_num, [])
            compliance_months.append({
                "month": month_num,
                "month_name": MONTH_NAMES[month_num],
                "documents": docs,
            })

        # Summary
        all_docs = [d for m in compliance_months for d in m["documents"]]
        total_required = len(all_docs)
        uploaded = sum(1 for d in all_docs if d["status"] == "uploaded")
        missing = sum(1 for d in all_docs if d["status"] == "missing")
        percentage = round((uploaded / total_required * 100) if total_required > 0 else 0, 1)

        return {
            "client": {
                "id": str(client.id),
                "name": client.client_name,
                "ntn": client.ntn,
            },
            "year": year,
            "compliance": compliance_months,
            "summary": {
                "total_required": total_required,
                "uploaded": uploaded,
                "missing": missing,
                "pending": 0,
                "compliance_percentage": percentage,
            },
        }

    def get_compliance_summary(self) -> dict:
        """Get aggregate compliance stats across all clients."""
        clients = self.db.query(Client).filter(Client.sales_tax_registered == True).all()
        now = datetime.now()

        total_required = 0
        total_uploaded = 0

        for client in clients:
            required = self.get_required_filings(client)
            existing = self.get_existing_filings(client.id)

            for req in required:
                if req.year == now.year:
                    total_required += 1
                    key = (req.category.value, req.year, req.month)
                    if key in existing:
                        total_uploaded += 1

        return {
            "total_required": total_required,
            "total_uploaded": total_uploaded,
            "total_missing": total_required - total_uploaded,
            "compliance_percentage": round(
                (total_uploaded / total_required * 100) if total_required > 0 else 0,
                1
            ),
        }