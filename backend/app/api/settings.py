from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import os
from app.db.session import get_db
from app.models.setting import Setting
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter()

# --------------- Pydantic Models ---------------

class SettingCreate(BaseModel):
    key: str
    value: Optional[str] = None
    description: Optional[str] = None
    is_public: bool = False

class SettingUpdate(BaseModel):
    value: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

class SettingResponse(BaseModel):
    id: str
    key: str
    value: Optional[str]
    description: Optional[str]
    is_public: bool

    class Config:
        from_attributes = True

class StoragePathRequest(BaseModel):
    path: str

class StoragePathResponse(BaseModel):
    success: bool
    current_path: str
    exists: bool
    message: str


# --------------- Storage Path Endpoints (specific routes FIRST) ---------------

@router.get("/storage/path", response_model=StoragePathResponse)
def get_storage_path(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get the current withholding storage path."""
    row = db.query(Setting).filter(Setting.key == "withholding_storage_path").first()
    current_path = row.value if row else ""
    return StoragePathResponse(
        success=True,
        current_path=current_path or "",
        exists=os.path.isdir(current_path) if current_path else False,
        message="Storage path configured" if current_path else "Using default storage path",
    )


@router.put("/storage/path", response_model=StoragePathResponse)
def update_storage_path(
    data: StoragePathRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Set the base storage path for withholding documents.
    Client folders will be created under: {path}/Clients/{ClientName}/Withholding/
    """
    path = data.path.strip()
    if not path:
        raise HTTPException(status_code=400, detail="Storage path cannot be empty")

    abs_path = os.path.abspath(path)

    try:
        os.makedirs(abs_path, exist_ok=True)
    except OSError as e:
        raise HTTPException(status_code=400, detail=f"Cannot create directory: {str(e)}")

    row = db.query(Setting).filter(Setting.key == "withholding_storage_path").first()
    if row:
        row.value = abs_path
    else:
        row = Setting(
            key="withholding_storage_path",
            value=abs_path,
            category="storage",
            value_type="string",
            description="Base storage path for withholding challan/statement documents",
        )
        db.add(row)

    db.commit()

    return StoragePathResponse(
        success=True,
        current_path=abs_path,
        exists=True,
        message=f"Storage path updated to: {abs_path}",
    )


# --------------- Generic CRUD Settings (must come AFTER specific routes) ---------------

@router.get("", response_model=list[SettingResponse])
@router.get("/", response_model=list[SettingResponse])
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    settings = db.query(Setting).all()
    return settings

@router.get("/{key}", response_model=SettingResponse)
def get_setting(
    key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    setting = db.query(Setting).filter(Setting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting

@router.post("/", response_model=SettingResponse, status_code=status.HTTP_201_CREATED)
def create_setting(
    setting_data: SettingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    existing = db.query(Setting).filter(Setting.key == setting_data.key).first()
    if existing:
        raise HTTPException(status_code=409, detail="Setting key already exists")

    setting = Setting(**setting_data.model_dump())
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting

@router.put("/{key}", response_model=SettingResponse)
def update_setting(
    key: str,
    setting_data: SettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    setting = db.query(Setting).filter(Setting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    update_data = setting_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(setting, field, value)

    db.commit()
    db.refresh(setting)
    return setting

@router.delete("/{key}")
def delete_setting(
    key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    setting = db.query(Setting).filter(Setting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    db.delete(setting)
    db.commit()
    return {"success": True, "message": "Setting deleted successfully"}