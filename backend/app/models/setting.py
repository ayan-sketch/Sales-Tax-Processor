import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Boolean, JSON
from app.db.session import Base


class Setting(Base):
    __tablename__ = "settings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    category = Column(String(50), nullable=True, index=True)  # company, backup, notifications, documents, reports, auth, import
    value_type = Column(String(20), nullable=False, default="string")  # string, number, boolean, select, image, textarea, email, time, multi_select
    options = Column(JSON, nullable=True)  # for select/multi_select: ["opt1", "opt2"]
    is_encrypted = Column(Boolean, default=False, nullable=False)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Setting(id={self.id}, key='{self.key}', category='{self.category}')>"