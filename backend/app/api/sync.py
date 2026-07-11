"""
Desktop Sync API Endpoints
Provides REST API for desktop synchronization features.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from pydantic import BaseModel

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.desktop_sync import get_desktop_sync_service


router = APIRouter()


# Request/Response Models
class SyncConfigUpdate(BaseModel):
    desktop_base_path: Optional[str] = None
    sync_enabled: Optional[bool] = None
    sync_direction: Optional[str] = None
    auto_sync: Optional[bool] = None
    sync_on_startup: Optional[bool] = None


class SyncConfigResponse(BaseModel):
    id: str
    desktop_base_path: str
    sync_enabled: bool
    sync_direction: str
    auto_sync: bool
    sync_on_startup: bool
    last_sync_at: Optional[str] = None


class SyncStatusResponse(BaseModel):
    sync_enabled: bool
    desktop_path: str
    last_sync_at: Optional[str] = None
    total_documents: int
    synced_documents: int
    pending_sync: int
    sync_direction: str


class SyncTriggerResponse(BaseModel):
    success: bool
    synced: int
    failed: int
    total_documents: int
    errors: list
    message: Optional[str] = None


class SyncDocumentResponse(BaseModel):
    success: bool
    message: str


# API Endpoints

@router.get("/config", response_model=Dict[str, Any])
def get_sync_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get current desktop sync configuration.
    """
    sync_service = get_desktop_sync_service(db)
    config = sync_service.get_sync_config()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sync configuration not found"
        )
    
    return {
        "success": True,
        "data": config
    }


@router.post("/config", response_model=Dict[str, Any])
def update_sync_config(
    config_update: SyncConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update desktop sync configuration.
    """
    # Only admin users can update sync config
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update sync configuration"
        )
    
    sync_service = get_desktop_sync_service(db)
    
    # Get current config and merge updates
    current_config = sync_service.get_sync_config() or {}
    
    update_dict = config_update.dict(exclude_unset=True)
    merged_config = {**current_config, **update_dict}
    
    # Validate sync_direction
    if "sync_direction" in merged_config:
        valid_directions = ["software_to_desktop", "desktop_to_software", "bidirectional"]
        if merged_config["sync_direction"] not in valid_directions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid sync_direction. Must be one of: {', '.join(valid_directions)}"
            )
    
    success = sync_service.update_sync_config(merged_config)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update sync configuration"
        )
    
    return {
        "success": True,
        "message": "Sync configuration updated successfully",
        "data": sync_service.get_sync_config()
    }


@router.get("/status", response_model=Dict[str, Any])
def get_sync_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get current sync status and statistics.
    """
    sync_service = get_desktop_sync_service(db)
    status_data = sync_service.get_sync_status()
    
    return {
        "success": True,
        "data": status_data
    }


@router.post("/trigger", response_model=Dict[str, Any])
def trigger_sync(
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Manually trigger a full desktop synchronization.
    
    - **limit**: Optional limit on number of documents to sync (for testing)
    """
    sync_service = get_desktop_sync_service(db)
    result = sync_service.sync_all_documents(limit=limit)
    
    if not result.get("success", False):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Sync failed")
        )
    
    return {
        "success": True,
        "data": result
    }


@router.post("/document/{document_id}", response_model=Dict[str, Any])
def sync_single_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Sync a single document to Desktop.
    """
    sync_service = get_desktop_sync_service(db)
    success, message = sync_service.sync_document_to_desktop(document_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message
        )
    
    return {
        "success": True,
        "message": message
    }


@router.get("/document/{document_id}/path", response_model=Dict[str, Any])
def get_document_desktop_path(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get the Desktop path for a specific document.
    """
    from app.models.document import Document
    from app.models.client import Client
    
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # If already synced, return existing path
    if document.desktop_path:
        return {
            "success": True,
            "desktop_path": document.desktop_path,
            "synced": document.desktop_synced,
            "synced_at": document.desktop_synced_at.isoformat() if document.desktop_synced_at else None
        }
    
    # Calculate potential desktop path
    client = db.query(Client).filter(Client.id == document.client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    sync_service = get_desktop_sync_service(db)
    desktop_path = sync_service.get_desktop_path_for_document(document, client.client_name)
    
    return {
        "success": True,
        "desktop_path": str(desktop_path),
        "synced": False,
        "message": "Path calculated (not yet synced)"
    }


@router.delete("/document/{document_id}", response_model=Dict[str, Any])
def remove_document_from_desktop(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Remove a document from Desktop (when deleted from software).
    """
    sync_service = get_desktop_sync_service(db)
    success, message = sync_service.remove_from_desktop(document_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message
        )
    
    return {
        "success": True,
        "message": message
    }