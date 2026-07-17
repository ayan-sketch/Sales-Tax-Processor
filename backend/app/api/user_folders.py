import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.folder import Folder
from app.models.user import User
from app.api.deps import get_current_active_user

router = APIRouter()


class FolderResponse(BaseModel):
    id: str
    name: str
    parent_id: Optional[str] = None
    children: List["FolderResponse"] = []
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None


class FolderUpdate(BaseModel):
    name: str


def _build_folder_tree(folders: List[Folder], parent_id: Optional[str] = None) -> List[dict]:
    tree = []
    for f in folders:
        if f.parent_id == parent_id:
            node = {
                "id": f.id,
                "name": f.name,
                "parent_id": f.parent_id,
                "created_at": f.created_at.isoformat() if f.created_at else "",
                "updated_at": f.updated_at.isoformat() if f.updated_at else "",
                "children": _build_folder_tree(folders, f.id),
            }
            tree.append(node)
    return tree


@router.get("/", response_model=List[dict])
def get_folder_tree(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    folders = db.query(Folder).filter(
        Folder.user_id == current_user.id,
    ).order_by(Folder.name).all()
    return _build_folder_tree(folders)


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_folder(
    data: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Folder name cannot be empty")

    if data.parent_id:
        parent = db.query(Folder).filter(
            Folder.id == data.parent_id,
            Folder.user_id == current_user.id,
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")

    folder = Folder(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=name,
        parent_id=data.parent_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)

    return {
        "id": folder.id,
        "name": folder.name,
        "parent_id": folder.parent_id,
        "created_at": folder.created_at.isoformat() if folder.created_at else "",
        "updated_at": folder.updated_at.isoformat() if folder.updated_at else "",
    }


@router.put("/{folder_id}", response_model=dict)
def update_folder(
    folder_id: str,
    data: FolderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.user_id == current_user.id,
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Folder name cannot be empty")

    folder.name = name
    folder.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(folder)

    return {
        "id": folder.id,
        "name": folder.name,
        "parent_id": folder.parent_id,
        "created_at": folder.created_at.isoformat() if folder.created_at else "",
        "updated_at": folder.updated_at.isoformat() if folder.updated_at else "",
    }


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    folder_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.user_id == current_user.id,
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    # Recursively delete child folders and their documents (cascade handles DB)
    db.delete(folder)
    db.commit()
