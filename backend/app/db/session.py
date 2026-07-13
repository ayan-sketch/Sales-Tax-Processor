from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")
_is_postgres = settings.DATABASE_URL.startswith("postgresql")

# All primary/foreign key ID columns are stored as VARCHAR(36), but many API
# endpoints parse path/form params as `uuid.UUID`. Without this adapter psycopg2
# renders those values with a `::uuid` cast, which PostgreSQL rejects when
# compared against a varchar column ("operator does not exist: character varying = uuid").
# Registering a global adapter makes every uuid.UUID bind as a plain quoted string,
# so it transparently matches the VARCHAR columns across all queries and inserts.
if _is_postgres:
    import uuid as _uuid
    try:
        from psycopg2.extensions import register_adapter, AsIs

        def _adapt_uuid(value):
            return AsIs(f"'{value}'")

        register_adapter(_uuid.UUID, _adapt_uuid)
    except Exception:
        pass

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    # Keep connections alive and recycle stale ones (important for Neon serverless)
    pool_pre_ping=True,
    pool_recycle=300,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
