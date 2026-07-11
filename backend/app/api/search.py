from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from app.db.session import get_db
from app.models.client import Client
from app.models.sales_tax import SalesTaxRecord
from app.models.withholding import WithholdingRecord
from app.models.document import Document
from app.models.task import Task
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter()

class SearchResult(BaseModel):
    clients: List[dict] = []
    documents: List[dict] = []
    withholding: List[dict] = []
    tasks: List[dict] = []
    sales_tax: List[dict] = []

@router.get("/", response_model=SearchResult)
def global_search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    search_term = f"%{q}%"
    
    # Search clients
    clients = db.query(Client).filter(
        (Client.client_name.ilike(search_term)) |
        (Client.ntn.ilike(search_term)) |
        (Client.cnic.ilike(search_term)) |
        (Client.strn.ilike(search_term)) |
        (Client.business_name.ilike(search_term))
    ).limit(10).all()
    
    # Search documents
    documents = db.query(Document).filter(
        (Document.original_file_name.ilike(search_term)) |
        (Document.file_name.ilike(search_term))
    ).limit(10).all()
    
    # Search withholding
    withholding = db.query(WithholdingRecord).filter(
        (WithholdingRecord.challan_number.ilike(search_term)) |
        (WithholdingRecord.period.ilike(search_term))
    ).limit(10).all()
    
    # Search tasks
    tasks = db.query(Task).filter(
        (Task.title.ilike(search_term)) |
        (Task.description.ilike(search_term))
    ).limit(10).all()
    
    # Search sales tax
    sales_tax = db.query(SalesTaxRecord).join(Client).filter(
        (Client.client_name.ilike(search_term)) |
        (Client.ntn.ilike(search_term))
    ).limit(10).all()
    
    return SearchResult(
        clients=[{
            "id": str(c.id),
            "client_name": c.client_name,
            "ntn": c.ntn,
            "cnic": c.cnic,
            "strn": c.strn
        } for c in clients],
        documents=[{
            "id": str(d.id),
            "file_name": d.file_name,
            "original_file_name": d.original_file_name,
            "client_id": str(d.client_id),
            "file_type": d.file_type.value
        } for d in documents],
        withholding=[{
            "id": str(w.id),
            "client_id": str(w.client_id),
            "section_type": w.section_type.value,
            "period": w.period,
            "challan_number": w.challan_number,
            "amount": float(w.amount)
        } for w in withholding],
        tasks=[{
            "id": str(t.id),
            "title": t.title,
            "client_id": str(t.client_id) if t.client_id else None,
            "status": t.status.value,
            "priority": t.priority.value
        } for t in tasks],
        sales_tax=[{
            "id": str(s.id),
            "client_id": str(s.client_id),
            "year": s.filing_year,
            "month": s.filing_month,
            "status": s.status.value
        } for s in sales_tax]
    )