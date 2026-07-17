import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, BigInteger, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base


class UserDocument(Base):
    __tablename__ = "user_documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    folder_id = Column(String(36), ForeignKey("user_folders.id", ondelete="SET NULL"), nullable=True)

    file_name = Column(String(255), nullable=False)
    original_file_name = Column(String(255), nullable=False)
    file_extension = Column(String(20), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    file_path = Column(Text, nullable=False)
    file_type = Column(String(20), nullable=False)
    mime_type = Column(String(100), nullable=True)
    checksum = Column(String(64), nullable=True)

    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", backref="user_documents")
    folder = relationship("Folder", backref="documents")

    def __repr__(self):
        return f"<UserDocument(id={self.id}, file_name='{self.file_name}', user_id={self.user_id})>"
