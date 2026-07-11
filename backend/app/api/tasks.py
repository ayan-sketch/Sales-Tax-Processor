from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from app.db.session import get_db
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.client import Client
from app.models.user import User
from app.api.deps import get_current_active_user

router = APIRouter()

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    client_id: Optional[UUID] = None
    assigned_user: Optional[UUID] = None
    due_date: Optional[date] = None
    priority: TaskPriority = TaskPriority.MEDIUM

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    client_id: Optional[UUID] = None
    assigned_user: Optional[UUID] = None
    due_date: Optional[date] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None

class TaskResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    client_id: Optional[UUID]
    assigned_user: Optional[UUID]
    due_date: Optional[date]
    priority: TaskPriority
    status: TaskStatus
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True

class TaskListResponse(BaseModel):
    success: bool
    data: List[TaskResponse]
    total: int
    page: int
    limit: int

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if task_data.client_id:
        client = db.query(Client).filter(Client.id == task_data.client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
    
    if task_data.assigned_user:
        user = db.query(User).filter(User.id == task_data.assigned_user).first()
        if not user:
            raise HTTPException(status_code=404, detail="Assigned user not found")
    
    task = Task(**task_data.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.get("/", response_model=TaskListResponse)
def get_tasks(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    status: Optional[TaskStatus] = Query(None),
    priority: Optional[TaskPriority] = Query(None),
    assigned_user: Optional[UUID] = Query(None),
    client_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Task)
    
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if assigned_user:
        query = query.filter(Task.assigned_user == assigned_user)
    if client_id:
        query = query.filter(Task.client_id == client_id)
    
    total = query.count()
    tasks = query.order_by(Task.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    
    return TaskListResponse(
        success=True,
        data=tasks,
        total=total,
        page=page,
        limit=limit
    )

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: UUID,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_data.model_dump(exclude_unset=True)
    
    if "assigned_user" in update_data and update_data["assigned_user"]:
        user = db.query(User).filter(User.id == update_data["assigned_user"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="Assigned user not found")
    
    if "client_id" in update_data and update_data["client_id"]:
        client = db.query(Client).filter(Client.id == update_data["client_id"]).first()
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
    
    for field, value in update_data.items():
        setattr(task, field, value)
    
    if "status" in update_data and update_data["status"] == TaskStatus.COMPLETED:
        task.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(task)
    return task

@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: UUID,
    status: TaskStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.status = status
    if status == TaskStatus.COMPLETED:
        task.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}")
def delete_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    return {"success": True, "message": "Task deleted successfully"}