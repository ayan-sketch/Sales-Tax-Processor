import uuid
import os
import hashlib
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user_document import UserDocument
from app.models.folder import Folder
from app.models.user import User
from app.api.deps import get_current_active_user
from app.core.config import settings

router = APIRouter()

ALLOWED_EXTENSIONS = {
    '.pdf', '.xlsx', '.xls', '.doc', '.docx',
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
    '.txt', '.csv',
}
MAX_FILE_SIZE = 50 * 1024 * 1024


class UserDocumentResponse(BaseModel):
    id: str
    folder_id: Optional[str] = None
    folder_name: Optional[str] = None
    file_name: str
    original_file_name: str
    file_extension: str
    file_size: int
    file_type: str
    checksum: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class UserDocumentListResponse(BaseModel):
    success: bool
    data: List[dict]
    total: int
    page: int
    limit: int
    total_pages: int


class RenameRequest(BaseModel):
    file_name: str


class MoveRequest(BaseModel):
    folder_id: str


def _get_file_type(ext: str) -> str:
    ext = ext.lower()
    if ext == '.pdf':
        return 'PDF'
    if ext in ('.xlsx', '.xls'):
        return 'Excel'
    if ext in ('.doc', '.docx'):
        return 'Word'
    if ext in ('.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'):
        return 'Image'
    if ext == '.csv':
        return 'CSV'
    if ext == '.txt':
        return 'Text'
    return 'Other'


def _get_mime_type(ext: str) -> str:
    mime_map = {
        '.pdf': 'application/pdf',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.xls': 'application/vnd.ms-excel',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp',
        '.txt': 'text/plain',
        '.csv': 'text/csv',
    }
    return mime_map.get(ext.lower(), 'application/octet-stream')


def _document_to_dict(doc: UserDocument, folder_name: Optional[str] = None) -> dict:
    return {
        "id": doc.id,
        "folder_id": doc.folder_id,
        "folder_name": folder_name or "",
        "file_name": doc.file_name,
        "original_file_name": doc.original_file_name,
        "file_extension": doc.file_extension,
        "file_size": doc.file_size,
        "file_type": doc.file_type,
        "checksum": doc.checksum,
        "created_at": doc.created_at.isoformat() if doc.created_at else "",
        "updated_at": doc.updated_at.isoformat() if doc.updated_at else "",
    }


def _get_user_storage(user_id: str) -> Path:
    base = Path(settings.STORAGE_PATH) / "users" / user_id / "documents"
    base.mkdir(parents=True, exist_ok=True)
    return base


@router.get("/", response_model=UserDocumentListResponse)
def list_documents(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    folder_id: Optional[str] = Query(None),
    file_type: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(UserDocument).filter(
        UserDocument.user_id == current_user.id,
        UserDocument.is_deleted == False,
    )

    if folder_id:
        query = query.filter(UserDocument.folder_id == folder_id)

    if file_type:
        query = query.filter(UserDocument.file_type == file_type)

    if q:
        search = f"%{q}%"
        query = query.filter(
            UserDocument.file_name.ilike(search) |
            UserDocument.original_file_name.ilike(search)
        )

    total = query.count()
    total_pages = max(1, (total + limit - 1) // limit)

    sort_col = getattr(UserDocument, sort_by, UserDocument.created_at)
    if sort_order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    docs = query.offset((page - 1) * limit).limit(limit).all()

    folder_ids = list(set(d.folder_id for d in docs if d.folder_id))
    folder_map = {}
    if folder_ids:
        folders = db.query(Folder).filter(Folder.id.in_(folder_ids)).all()
        folder_map = {f.id: f.name for f in folders}

    data = [_document_to_dict(d, folder_map.get(d.folder_id)) for d in docs]

    return UserDocumentListResponse(
        success=True,
        data=data,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@router.get("/{document_id}", response_model=dict)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    doc = db.query(UserDocument).filter(
        UserDocument.id == document_id,
        UserDocument.user_id == current_user.id,
        UserDocument.is_deleted == False,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    folder_name = None
    if doc.folder_id:
        folder = db.query(Folder).filter(Folder.id == doc.folder_id).first()
        folder_name = folder.name if folder else None

    return _document_to_dict(doc, folder_name)


@router.post("/upload", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    folder_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 50MB limit")

    if folder_id:
        folder = db.query(Folder).filter(
            Folder.id == folder_id,
            Folder.user_id == current_user.id,
        ).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")

    checksum = hashlib.sha256(content).hexdigest()

    file_type = _get_file_type(ext)
    mime_type = _get_mime_type(ext)
    storage_dir = _get_user_storage(current_user.id)
    file_name = f"{uuid.uuid4()}{ext}"
    file_path = str(storage_dir / file_name)

    with open(file_path, "wb") as f:
        f.write(content)

    doc = UserDocument(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        folder_id=folder_id,
        file_name=file.filename,
        original_file_name=file.filename,
        file_extension=ext,
        file_size=len(content),
        file_path=file_path,
        file_type=file_type,
        mime_type=mime_type,
        checksum=checksum,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    folder_name = None
    if doc.folder_id:
        folder = db.query(Folder).filter(Folder.id == doc.folder_id).first()
        folder_name = folder.name if folder else None

    return _document_to_dict(doc, folder_name)


@router.post("/upload/multiple", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_multiple(
    files: List[UploadFile] = File(...),
    folder_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if folder_id:
        folder = db.query(Folder).filter(
            Folder.id == folder_id,
            Folder.user_id == current_user.id,
        ).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")

    results = {"success": [], "errors": []}
    storage_dir = _get_user_storage(current_user.id)

    for upload_file in files:
        try:
            ext = os.path.splitext(upload_file.filename)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                results["errors"].append({"file_name": upload_file.filename, "error": f"File type '{ext}' not allowed"})
                continue

            content = await upload_file.read()
            if len(content) > MAX_FILE_SIZE:
                results["errors"].append({"file_name": upload_file.filename, "error": "File exceeds 50MB limit"})
                continue

            checksum = hashlib.sha256(content).hexdigest()
            file_type = _get_file_type(ext)
            mime_type = _get_mime_type(ext)
            file_name = f"{uuid.uuid4()}{ext}"
            file_path = str(storage_dir / file_name)

            with open(file_path, "wb") as f:
                f.write(content)

            doc = UserDocument(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                folder_id=folder_id,
                file_name=upload_file.filename,
                original_file_name=upload_file.filename,
                file_extension=ext,
                file_size=len(content),
                file_path=file_path,
                file_type=file_type,
                mime_type=mime_type,
                checksum=checksum,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)
            results["success"].append(_document_to_dict(doc))
        except Exception as e:
            results["errors"].append({"file_name": upload_file.filename, "error": str(e)})

    return results


@router.get("/{document_id}/preview")
def preview_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    doc = db.query(UserDocument).filter(
        UserDocument.id == document_id,
        UserDocument.user_id == current_user.id,
        UserDocument.is_deleted == False,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    mime = _get_mime_type(doc.file_extension)
    return FileResponse(
        path=doc.file_path,
        filename=doc.original_file_name,
        media_type=mime,
        headers={"Content-Disposition": f"inline; filename=\"{doc.original_file_name}\""},
    )


@router.get("/{document_id}/download")
def download_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    doc = db.query(UserDocument).filter(
        UserDocument.id == document_id,
        UserDocument.user_id == current_user.id,
        UserDocument.is_deleted == False,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=doc.file_path,
        filename=doc.original_file_name,
        media_type='application/octet-stream',
        headers={"Content-Disposition": f"attachment; filename=\"{doc.original_file_name}\""},
    )


@router.put("/{document_id}/rename", response_model=dict)
def rename_document(
    document_id: str,
    data: RenameRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    doc = db.query(UserDocument).filter(
        UserDocument.id == document_id,
        UserDocument.user_id == current_user.id,
        UserDocument.is_deleted == False,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    new_name = data.file_name.strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="File name cannot be empty")

    doc.file_name = new_name
    doc.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(doc)

    return _document_to_dict(doc)


@router.patch("/{document_id}/move", response_model=dict)
def move_document(
    document_id: str,
    data: MoveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    doc = db.query(UserDocument).filter(
        UserDocument.id == document_id,
        UserDocument.user_id == current_user.id,
        UserDocument.is_deleted == False,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    folder = db.query(Folder).filter(
        Folder.id == data.folder_id,
        Folder.user_id == current_user.id,
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    doc.folder_id = data.folder_id
    doc.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(doc)

    return _document_to_dict(doc, folder.name)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    doc = db.query(UserDocument).filter(
        UserDocument.id == document_id,
        UserDocument.user_id == current_user.id,
        UserDocument.is_deleted == False,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.is_deleted = True
    doc.deleted_at = datetime.utcnow()
    db.commit()
