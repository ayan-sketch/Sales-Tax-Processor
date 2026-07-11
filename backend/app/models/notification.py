import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.session import Base


class NotificationType(str, enum.Enum):
    DUE_RETURN = "Due Return"
    TASK_REMINDER = "Task Reminder"
    OVERDUE_ALERT = "Overdue Alert"
    SYSTEM_MESSAGE = "System Message"
    BACKUP_COMPLETE = "Backup Complete"


class NotificationPriority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Text, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Text, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    notification_type = Column(SQLEnum(NotificationType), nullable=False, index=True)
    priority = Column(SQLEnum(NotificationPriority), default=NotificationPriority.MEDIUM, nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    link = Column(String(500), nullable=True)
    client_id = Column(Text, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True)
    task_id = Column(Text, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", backref="notifications")
    client = relationship("Client", backref="notifications")
    task = relationship("Task", backref="notifications")

    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, type='{self.notification_type}', title='{self.title}')>"