import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Text, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_name = Column(Text, nullable=False)
    report_type = Column(String(100), nullable=False)
    generated_by = Column(Text, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    owner_id = Column(Text, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    file_path = Column(Text, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    generator = relationship("User", backref="generated_reports")

    def __repr__(self):
        return f"<Report(id={self.id}, report_name='{self.report_name}', type='{self.report_type}')>"
