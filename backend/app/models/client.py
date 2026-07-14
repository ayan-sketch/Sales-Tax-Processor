import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class Client(Base):
    __tablename__ = "clients"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    client_name = Column(String(255), nullable=False, index=True)
    business_name = Column(String(255), nullable=True)
    cnic = Column(String(20), unique=True, nullable=True, index=True)
    ntn = Column(String(50), unique=True, nullable=True, index=True)
    strn = Column(String(50), unique=True, nullable=True, index=True)
    contact_number = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    client_password = Column(Text, nullable=True)
    sales_tax_registered = Column(Boolean, default=False, nullable=False)
    withholding_registered = Column(Boolean, default=False, nullable=False)
    sales_tax_material_status = Column(String(10), nullable=False, default='NIL')
    withholding_236_applied = Column(Boolean, default=False, nullable=False)
    withholding_236_prepared_by_us = Column(Boolean, default=False, nullable=False)
    withholding_153_applicable = Column(Boolean, default=False, nullable=False)
    withholding_153_prepared_by_us = Column(Boolean, default=False, nullable=False)
    withholding_filing_frequency = Column(String(20), nullable=True)  # 'Monthly' or 'Quarterly'
    kpra_registered = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)

    # New fields for contact person
    contact_person = Column(String(255), nullable=True, index=True)
    contact_person_designation = Column(String(255), nullable=True)
    contact_person_phone = Column(String(50), nullable=True)
    contact_person_email = Column(String(255), nullable=True)
    secondary_phone = Column(String(50), nullable=True)

    # Address breakdown
    city = Column(String(100), nullable=True, index=True)
    province = Column(String(100), nullable=True)

    # Business classification
    business_type = Column(String(255), nullable=True, index=True)
    client_type = Column(String(50), nullable=True, index=True)

    # Tax details
    registration_date = Column(Date, nullable=True)
    tax_period = Column(String(20), nullable=True)
    fbr_office = Column(String(255), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Client(id={self.id}, client_name='{self.client_name}', ntn='{self.ntn}')>"
