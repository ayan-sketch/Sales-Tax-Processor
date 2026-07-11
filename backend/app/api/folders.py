"""
Folder API Endpoints
Provides folder tree navigation, contents, and search.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.folder_service import (
    scan_folder_tree,
    get_folder_contents_db,
    search_folder_names,
    get_storage_base,
)

router = APIRouter()


class FolderTreeResponse(BaseModel):
    success: bool
    data: list


class FolderContentsResponse(BaseModel):
    success: bool
    data: list
    folder_path: str
    total: int
    page: int
    limit: int


@router.get("/tree")
def get_folder_tree(
    current_user: User = Depends(get_current_active_user),
):
    """Get the complete folder tree structure under storage/Clients/."""
    tree = scan_folder_tree()
    return {"success": True, "data": tree}


@router.get("/contents")
def get_folder_contents(
    path: str = Query(..., description="Folder path relative to storage base"),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get documents within a specific folder path."""
    documents, total = get_folder_contents_db(db, path, page, limit)

    from app.api.documents import document_to_response
    return {
        "success": True,
        "data": [document_to_response(d, db) for d in documents],
        "folder_path": path,
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/search")
def search_folders(
    q: str = Query(..., description="Search query"),
    current_user: User = Depends(get_current_active_user),
):
    """Search folder names matching a query string."""
    results = search_folder_names(q)
    return {"success": True, "data": results}