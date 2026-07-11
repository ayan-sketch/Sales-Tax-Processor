import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.client import Client
from app.models.sales_tax import SalesTaxRecord, SalesTaxStatus
from app.models.withholding import WithholdingRecord
from app.models.task import Task, TaskStatus
from app.models.document import Document
from app.models.notification import Notification
from app.api.deps import get_current_user
from pydantic import BaseModel

router = APIRouter()

class DashboardStats(BaseModel):
    total_clients: int
    total_sales_tax: int
    total_withholding: int
    pending_tasks: int
    overdue_sales_tax: int
    filings_this_month: int
    total_documents: int

class RecentActivity(BaseModel):
    id: str
    type: str
    title: str
    description: str
    client_name: str | None
    created_at: str
    link: str | None

class DashboardResponse(BaseModel):
    stats: DashboardStats
    recent_activity: list[RecentActivity]

@router.get("/dashboard/stats", response_model=DashboardResponse)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    now = datetime.utcnow()
    first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_clients = db.query(func.count(Client.id)).scalar() or 0
    total_sales_tax = db.query(func.count(SalesTaxRecord.id)).scalar() or 0
    total_withholding = db.query(func.count(WithholdingRecord.id)).scalar() or 0
    pending_tasks = db.query(func.count(Task.id)).filter(
        Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS])
    ).scalar() or 0
    overdue_sales_tax = db.query(func.count(SalesTaxRecord.id)).filter(
        SalesTaxRecord.status == SalesTaxStatus.OVERDUE
    ).scalar() or 0
    filings_this_month = db.query(func.count(SalesTaxRecord.id)).filter(
        SalesTaxRecord.filing_date >= first_of_month.date()
    ).scalar() or 0
    total_documents = db.query(func.count(Document.id)).scalar() or 0

    # Recent activity - combine recent records from multiple types
    recent_clients = (
        db.query(Client)
        .order_by(Client.created_at.desc())
        .limit(5)
        .all()
    )
    recent_sales_tax = (
        db.query(SalesTaxRecord)
        .order_by(SalesTaxRecord.created_at.desc())
        .limit(5)
        .all()
    )
    recent_withholding = (
        db.query(WithholdingRecord)
        .order_by(WithholdingRecord.created_at.desc())
        .limit(5)
        .all()
    )
    recent_tasks = (
        db.query(Task)
        .order_by(Task.created_at.desc())
        .limit(5)
        .all()
    )
    recent_docs = (
        db.query(Document)
        .order_by(Document.upload_date.desc())
        .limit(5)
        .all()
    )
    recent_notifications = (
        db.query(Notification)
        .order_by(Notification.created_at.desc())
        .limit(5)
        .all()
    )

    activity: list[RecentActivity] = []

    for c in recent_clients:
        activity.append(RecentActivity(
            id=str(c.id), type="client", title=f"Client Added: {c.client_name}",
            description=f"NTN: {c.ntn or 'N/A'}", client_name=c.client_name,
            created_at=c.created_at.isoformat(), link=f"/clients/{c.id}"
        ))

    for st in recent_sales_tax:
        activity.append(RecentActivity(
            id=str(st.id), type="sales_tax", title=f"Sales Tax - Year {st.filing_year}/Month {st.filing_month}",
            description=f"Status: {st.status.value}", client_name=st.client.client_name if st.client else None,
            created_at=st.created_at.isoformat(), link=f"/sales-tax"
        ))

    for w in recent_withholding:
        activity.append(RecentActivity(
            id=str(w.id), type="withholding", title=f"Withholding {w.section_type.value}",
            description=f"Amount: {w.amount}", client_name=w.client.client_name if w.client else None,
            created_at=w.created_at.isoformat(), link=f"/withholding"
        ))

    for t in recent_tasks:
        activity.append(RecentActivity(
            id=str(t.id), type="task", title=f"Task: {t.title}",
            description=f"Status: {t.status.value}, Priority: {t.priority.value}",
            client_name=t.client.client_name if t.client else None,
            created_at=t.created_at.isoformat(), link=f"/tasks"
        ))

    for d in recent_docs:
        activity.append(RecentActivity(
            id=str(d.id), type="document", title=f"Document: {d.original_file_name}",
            description=f"Type: {d.file_type.value}", client_name=d.client.client_name if d.client else None,
            created_at=d.upload_date.isoformat(), link=f"/documents"
        ))

    for n in recent_notifications:
        activity.append(RecentActivity(
            id=str(n.id), type="notification", title=n.title,
            description=n.message, client_name=None,
            created_at=n.created_at.isoformat(), link=n.link
        ))

    # Sort by created_at descending and take top 15
    activity.sort(key=lambda a: a.created_at, reverse=True)
    activity = activity[:15]

    return DashboardResponse(
        stats=DashboardStats(
            total_clients=total_clients,
            total_sales_tax=total_sales_tax,
            total_withholding=total_withholding,
            pending_tasks=pending_tasks,
            overdue_sales_tax=overdue_sales_tax,
            filings_this_month=filings_this_month,
            total_documents=total_documents
        ),
        recent_activity=activity
    )