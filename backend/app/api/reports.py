from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from app.db.session import get_db
from app.models.client import Client
from app.models.sales_tax import SalesTaxRecord, SalesTaxStatus
from app.models.withholding import WithholdingRecord, WithholdingType
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.report import Report
from app.models.document import Document
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter()

class ComplianceReportRequest(BaseModel):
    client_id: Optional[UUID] = None
    year: int
    month: Optional[int] = None

class SalesTaxReportRequest(BaseModel):
    client_id: Optional[UUID] = None
    year: int
    status: Optional[SalesTaxStatus] = None

class WithholdingReportRequest(BaseModel):
    client_id: Optional[UUID] = None
    section_type: Optional[WithholdingType] = None
    period: Optional[str] = None

class TaskReportRequest(BaseModel):
    client_id: Optional[UUID] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assigned_user: Optional[UUID] = None

class ReportResponse(BaseModel):
    success: bool
    data: dict
    message: str = ""

@router.post("/compliance", response_model=ReportResponse)
def generate_compliance_report(
    request: ComplianceReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Client)
    
    if request.client_id:
        query = query.filter(Client.id == request.client_id)
    
    clients = query.all()
    
    report_data = []
    for client in clients:
        sales_tax = db.query(SalesTaxRecord).filter(
            SalesTaxRecord.client_id == client.id,
            SalesTaxRecord.filing_year == request.year
        )
        if request.month:
            sales_tax = sales_tax.filter(SalesTaxRecord.filing_month == request.month)
        sales_tax = sales_tax.all()
        
        withholding = db.query(WithholdingRecord).filter(
            WithholdingRecord.client_id == client.id
        ).all()
        
        client_data = {
            "client_id": str(client.id),
            "client_name": client.client_name,
            "ntn": client.ntn,
            "sales_tax_registered": client.sales_tax_registered,
            "withholding_registered": client.withholding_registered,
            "sales_tax_records": [
                {
                    "year": r.filing_year,
                    "month": r.filing_month,
                    "status": r.status.value,
                    "filing_date": r.filing_date.isoformat() if r.filing_date else None
                } for r in sales_tax
            ],
            "withholding_records": [
                {
                    "section_type": r.section_type.value,
                    "period": r.period,
                    "challan_number": r.challan_number,
                    "amount": float(r.amount),
                    "payment_date": r.payment_date.isoformat() if r.payment_date else None
                } for r in withholding
            ]
        }
        report_data.append(client_data)
    
    return ReportResponse(
        success=True,
        data={
            "report_type": "compliance",
            "generated_at": datetime.utcnow().isoformat(),
            "clients": report_data
        },
        message="Compliance report generated successfully"
    )

@router.post("/sales-tax", response_model=ReportResponse)
def generate_sales_tax_report(
    request: SalesTaxReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(SalesTaxRecord).join(Client)
    
    if request.client_id:
        query = query.filter(SalesTaxRecord.client_id == request.client_id)
    query = query.filter(SalesTaxRecord.filing_year == request.year)
    if request.status:
        query = query.filter(SalesTaxRecord.status == request.status)
    
    records = query.all()
    
    summary = {"Filed": 0, "Pending": 0, "Not Filed": 0, "Overdue": 0}
    for r in records:
        summary[r.status.value] += 1
    
    return ReportResponse(
        success=True,
        data={
            "report_type": "sales_tax",
            "year": request.year,
            "summary": summary,
            "records": [
                {
                    "client_id": str(r.client_id),
                    "client_name": r.client.client_name,
                    "year": r.filing_year,
                    "month": r.filing_month,
                    "status": r.status.value,
                    "filing_date": r.filing_date.isoformat() if r.filing_date else None,
                    "remarks": r.remarks
                } for r in records
            ]
        },
        message="Sales Tax report generated successfully"
    )

@router.post("/withholding", response_model=ReportResponse)
def generate_withholding_report(
    request: WithholdingReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(WithholdingRecord).join(Client)
    
    if request.client_id:
        query = query.filter(WithholdingRecord.client_id == request.client_id)
    if request.section_type:
        query = query.filter(WithholdingRecord.section_type == request.section_type)
    if request.period:
        query = query.filter(WithholdingRecord.period.ilike(f"%{request.period}%"))
    
    records = query.all()
    
    total_amount = sum(float(r.amount) for r in records)
    by_type = {}
    for r in records:
        t = r.section_type.value
        if t not in by_type:
            by_type[t] = {"count": 0, "total": 0}
        by_type[t]["count"] += 1
        by_type[t]["total"] += float(r.amount)
    
    return ReportResponse(
        success=True,
        data={
            "report_type": "withholding",
            "total_records": len(records),
            "total_amount": total_amount,
            "by_type": by_type,
            "records": [
                {
                    "client_id": str(r.client_id),
                    "client_name": r.client.client_name,
                    "section_type": r.section_type.value,
                    "period": r.period,
                    "challan_number": r.challan_number,
                    "amount": float(r.amount),
                    "payment_date": r.payment_date.isoformat() if r.payment_date else None
                } for r in records
            ]
        },
        message="Withholding report generated successfully"
    )

@router.post("/tasks", response_model=ReportResponse)
def generate_task_report(
    request: TaskReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Task)
    
    if request.client_id:
        query = query.filter(Task.client_id == request.client_id)
    if request.status:
        query = query.filter(Task.status == request.status)
    if request.priority:
        query = query.filter(Task.priority == request.priority)
    if request.assigned_user:
        query = query.filter(Task.assigned_user == request.assigned_user)
    
    tasks = query.all()
    
    summary = {"Pending": 0, "In Progress": 0, "Completed": 0, "Cancelled": 0}
    by_priority = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    
    for t in tasks:
        summary[t.status.value] += 1
        by_priority[t.priority.value] += 1
    
    return ReportResponse(
        success=True,
        data={
            "report_type": "tasks",
            "summary": summary,
            "by_priority": by_priority,
            "tasks": [
                {
                    "id": str(t.id),
                    "title": t.title,
                    "client_id": str(t.client_id) if t.client_id else None,
                    "client_name": t.client.client_name if t.client else None,
                    "priority": t.priority.value,
                    "status": t.status.value,
                    "due_date": t.due_date.isoformat() if t.due_date else None,
                    "assigned_user": str(t.assigned_user) if t.assigned_user else None
                } for t in tasks
            ]
        },
        message="Task report generated successfully"
    )

@router.post("/client-summary", response_model=ReportResponse)
def generate_client_summary(
    client_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    sales_tax = db.query(SalesTaxRecord).filter(SalesTaxRecord.client_id == client_id).all()
    withholding = db.query(WithholdingRecord).filter(WithholdingRecord.client_id == client_id).all()
    tasks = db.query(Task).filter(Task.client_id == client_id).all()
    documents = db.query(Document).filter(Document.client_id == client_id).all()
    
    return ReportResponse(
        success=True,
        data={
            "report_type": "client_summary",
            "client": {
                "id": str(client.id),
                "client_name": client.client_name,
                "business_name": client.business_name,
                "ntn": client.ntn,
                "cnic": client.cnic,
                "strn": client.strn,
                "contact_number": client.contact_number,
                "email": client.email,
                "address": client.address,
                "sales_tax_registered": client.sales_tax_registered,
                "withholding_registered": client.withholding_registered
            },
            "sales_tax_count": len(sales_tax),
            "withholding_count": len(withholding),
            "tasks_count": len(tasks),
            "documents_count": len(documents),
            "sales_tax": [
                {
                    "year": r.filing_year,
                    "month": r.filing_month,
                    "status": r.status.value
                } for r in sales_tax
            ],
            "withholding": [
                {
                    "section_type": r.section_type.value,
                    "period": r.period,
                    "amount": float(r.amount)
                } for r in withholding
            ],
            "tasks": [
                {
                    "title": t.title,
                    "status": t.status.value,
                    "priority": t.priority.value,
                    "due_date": t.due_date.isoformat() if t.due_date else None
                } for t in tasks
            ]
        },
        message="Client summary report generated successfully"
    )
