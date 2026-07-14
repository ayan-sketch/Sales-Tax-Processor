import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Enum as SQLEnum, BigInteger, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class BackupStatus(str, enum.Enum):
    SUCCESS = "Success"
    FAILED = "Failed"

class Backup(Base):
    __tablename__ = "backups"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    backup_name = Column(Text, nullable=False)
    backup_path = Column(Text, nullable=False)
    backup_size = Column(BigInteger, nullable=True)
    backup_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(SQLEnum(BackupStatus), default=BackupStatus.SUCCESS, nullable=False)

    def __repr__(self):
        return f"<Backup(id={self.id}, backup_name='{self.backup_name}', status='{self.status}')>"
