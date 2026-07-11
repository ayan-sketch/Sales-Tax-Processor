from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import auth, clients, sales_tax, withholding, documents, tasks, reports, search, settings, notifications, dashboard, backup, folders, compliance, sync
from app.core.config import settings as app_settings
from app.db.session import engine, Base
from app.db.migrate import run_migrations
from app.models import user, client, sales_tax as sales_tax_model, withholding as withholding_model, document, task, report, backup as backup_model, setting, notification as notification_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_migrations()
    # Seed default admin user if users table is empty
    from app.db.session import SessionLocal
    from app.models.user import User
    from app.core.security import get_password_hash
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            admin = User(
                id="00000000-0000-0000-0000-000000000001",
                full_name="Zain Khan",
                username="zainkhan",
                password_hash=get_password_hash("zk@123"),
                email="zain@example.com",
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print("Created default admin user: zainkhan / zk@123")
    finally:
        db.close()
    yield


app = FastAPI(
    title="Tax Compliance Management System",
    description="API for Tax Compliance Management System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(clients.router, prefix="/api/v1/clients", tags=["clients"])
app.include_router(sales_tax.router, prefix="/api/v1/sales-tax", tags=["sales-tax"])
app.include_router(withholding.router, prefix="/api/v1/withholding", tags=["withholding"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(folders.router, prefix="/api/v1/folders", tags=["folders"])
app.include_router(compliance.router, prefix="/api/v1/compliance", tags=["compliance"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["tasks"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["reports"])
app.include_router(search.router, prefix="/api/v1/search", tags=["search"])
app.include_router(settings.router, prefix="/api/v1/settings", tags=["settings"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(dashboard.router, prefix="/api/v1", tags=["dashboard"])
app.include_router(backup.router, prefix="/api/v1/backups", tags=["backups"])
app.include_router(sync.router, prefix="/api/v1/sync", tags=["sync"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Tax Compliance Management System"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)