"""
Compliance API Endpoints
Provides compliance status, missing documents, and summary data.
"""
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional
import logging

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/missing-documents")
def get_missing_documents(
    client_id: Optional[str] = Query(None),
    status: str = Query("all", description="all, overdue, upcoming"),
    category: Optional[str] = Query(None),
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get all missing compliance documents."""
    try:
        from app.services.compliance_engine import ComplianceEngine
        engine = ComplianceEngine(db)
        missing = engine.get_missing_documents(
            client_id=client_id,
            status_filter=status,
        )
    except Exception as e:
        logger.warning("Compliance engine error: %s", e)
        return {"success": True, "data": [], "total": 0}

    # Filter by category if specified
    if category:
        missing = [m for m in missing if m.required_type.value == category]

    return {
        "success": True,
        "data": [
            {
                "client_id": m.client_id,
                "client_name": m.client_name,
                "client_ntn": m.client_ntn,
                "required_type": m.required_type.value,
                "tax_year": m.tax_year,
                "tax_month": m.tax_month,
                "deadline": m.deadline,
                "days_overdue": m.days_overdue,
                "is_overdue": m.is_overdue,
            }
            for m in missing
        ],
        "total": len(missing),
    }


@router.get("/missing-count")
def get_missing_count(
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get counts of missing documents by urgency."""
    try:
        from app.services.compliance_engine import ComplianceEngine
        engine = ComplianceEngine(db)
        counts = engine.get_missing_count()
        return {"success": True, "data": counts}
    except Exception as e:
        logger.warning("Compliance engine error: %s", e)
        return {"success": True, "data": {"total_missing": 0, "overdue": 0, "upcoming": 0}}


@router.get("/status")
def get_compliance_status(
    client_id: str = Query(...),
    year: int = Query(...),
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get compliance status for a specific client and year."""
    try:
        from app.services.compliance_engine import ComplianceEngine
        engine = ComplianceEngine(db)
        status = engine.get_compliance_status(client_id, year)
        return {"success": True, "data": status}
    except Exception as e:
        logger.warning("Compliance engine error: %s", e)
        return {"success": True, "data": None, "error": str(e)}


@router.get("/summary")
def get_compliance_summary(
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get aggregate compliance summary across all clients."""
    try:
        from app.services.compliance_engine import ComplianceEngine
        engine = ComplianceEngine(db)
        summary = engine.get_compliance_summary()
        return {"success": True, "data": summary}
    except Exception as e:
        logger.warning("Compliance engine error: %s", e)
        return {"success": True, "data": {"total_required": 0, "total_uploaded": 0, "total_missing": 0, "compliance_percentage": 0}}
