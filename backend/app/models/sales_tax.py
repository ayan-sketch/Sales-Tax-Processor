import uuid
import enum
from datetime import datetime, date
from sqlalchemy import Column, Integer, Date, DateTime, Text, ForeignKey, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base

class SalesTaxStatus(str, enum.Enum):
    FILED = "Filed"
    PENDING = "Pending"
    NOT_FILED = "Not Filed"
    OVERDUE = "Overdue"

class SalesTaxRecord(Base):
    __tablename__ = "sales_tax_records"

    id = Column(Text, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = Column(Text, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    filing_year = Column(Integer, nullable=False)
    filing_month = Column(Integer, nullable=False)
    status = Column(SQLEnum(SalesTaxStatus), default=SalesTaxStatus.NOT_FILED, nullable=False)
    filing_date = Column(Date, nullable=True)
    remarks = Column(Text, nullable=True)
    document_id = Column(Text, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    client = relationship("Client", backref="sales_tax_records")
    document = relationship("Document", backref="sales_tax_records")

    # Constraints
    __table_args__ = (
        UniqueConstraint('client_id', 'filing_year', 'filing_month', name='uq_client_year_month'),
    )

    def __repr__(self):
        return f"<SalesTaxRecord(id={self.id}, client_id={self.client_id}, year={self.filing_year}, month={self.filing_month}, status='{self.status}')>"