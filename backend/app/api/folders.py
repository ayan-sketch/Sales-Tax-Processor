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
    scan_folder_tree_with_clients,
    get_folder_contents_db,
    search_folder_names,
    get_storage_base,
)
from app.models.client import Client

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
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get the complete folder tree structure, merging filesystem folders
    with all active clients from the database."""
    tree = scan_folder_tree_with_clients(db)
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


@router.get("/resolve-client")
def resolve_client_from_path(
    path: str = Query(..., description="Folder path like 'Clients/ClientName/...'"),
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Resolve a folder path to a client ID by extracting the client name."""
    parts = path.strip("/").replace("\\", "/").split("/")
    if not parts or parts[0].lower() != "clients" or len(parts) < 2:
        raise HTTPException(status_code=400, detail="Invalid folder path: must start with Clients/<client_name>")
    client_name = parts[1]

    client = (
        db.query(Client)
        .filter(
            ((Client.business_name == client_name) | (Client.client_name == client_name))
            & (Client.is_active == True)
        )
        .first()
    )
    if not client:
        raise HTTPException(status_code=404, detail=f"Client not found: {client_name}")

    return {"success": True, "client_id": client.id, "client_name": client_name}