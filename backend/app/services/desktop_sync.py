"""
Desktop Synchronization Service
Handles synchronization of documents between software storage and Desktop folder.
"""
import os
import shutil
from pathlib import Path
from typing import Optional, Dict, List, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.document import Document
from app.models.client import Client
from app.core.config import settings
from app.services.folder_service import get_storage_base, ensure_client_folder_structure


class DesktopSyncService:
    """Service for synchronizing documents to Desktop folders."""
    
    def __init__(self, db: Session):
        self.db = db
        
    def get_sync_config(self) -> Optional[Dict]:
        """Get desktop sync configuration from database."""
        from app.models.setting import Setting
        
        try:
            config_query = self.db.execute(
                "SELECT * FROM sync_config WHERE id = 'default'"
            )
            config = config_query.fetchone()
            
            if config:
                return {
                    "id": config[0],
                    "desktop_base_path": config[1],
                    "sync_enabled": bool(config[2]),
                    "sync_direction": config[3],
                    "auto_sync": bool(config[4]),
                    "sync_on_startup": bool(config[5]),
                    "last_sync_at": config[6],
                    "created_at": config[7],
                    "updated_at": config[8],
                }
            
            # Return default config if not found
            return {
                "desktop_base_path": "Desktop/SaleTaxSoftware",
                "sync_enabled": True,
                "sync_direction": "software_to_desktop",
                "auto_sync": True,
                "sync_on_startup": True,
            }
        except Exception as e:
            print(f"Error getting sync config: {e}")
            return None
    
    def update_sync_config(self, config: Dict) -> bool:
        """Update desktop sync configuration."""
        try:
            self.db.execute(
                """
                INSERT INTO sync_config (id, desktop_base_path, sync_enabled, sync_direction, auto_sync, sync_on_startup, updated_at)
                VALUES ('default', :desktop_base_path, :sync_enabled, :sync_direction, :auto_sync, :sync_on_startup, :updated_at)
                ON CONFLICT(id) DO UPDATE SET
                    desktop_base_path = :desktop_base_path,
                    sync_enabled = :sync_enabled,
                    sync_direction = :sync_direction,
                    auto_sync = :auto_sync,
                    sync_on_startup = :sync_on_startup,
                    updated_at = :updated_at
                """,
                {
                    "desktop_base_path": config.get("desktop_base_path", "Desktop/SaleTaxSoftware"),
                    "sync_enabled": config.get("sync_enabled", True),
                    "sync_direction": config.get("sync_direction", "software_to_desktop"),
                    "auto_sync": config.get("auto_sync", True),
                    "sync_on_startup": config.get("sync_on_startup", True),
                    "updated_at": datetime.utcnow(),
                }
            )
            self.db.commit()
            return True
        except Exception as e:
            print(f"Error updating sync config: {e}")
            self.db.rollback()
            return False
    
    def get_desktop_base_path(self) -> Path:
        """Get the base Desktop path for synchronization."""
        config = self.get_sync_config()
        if not config:
            # Fallback to default
            desktop_path = Path.home() / "Desktop" / "SaleTaxSoftware"
        else:
            desktop_base = config.get("desktop_base_path", "Desktop/SaleTaxSoftware")
            if desktop_base.startswith("Desktop/"):
                desktop_path = Path.home() / desktop_base
            else:
                desktop_path = Path(desktop_base)
        
        # Ensure base path exists
        desktop_path.mkdir(parents=True, exist_ok=True)
        return desktop_path
    
    def get_desktop_clients_path(self) -> Path:
        """Get the Clients folder path on Desktop."""
        clients_path = self.get_desktop_base_path() / "Clients"
        clients_path.mkdir(parents=True, exist_ok=True)
        return clients_path
    
    def ensure_desktop_folder_structure(self, client_name: str, year: Optional[int] = None) -> Dict[str, Path]:
        """
        Create the full folder structure for a client on Desktop.
        Mirrors the structure in software storage.
        
        Returns a dict mapping category name to folder Path.
        """
        current_year = year or datetime.now().year
        base = self.get_desktop_clients_path() / client_name / str(current_year)
        
        categories = {
            "Sales_Tax": base / "Sales_Tax",
            "236H": base / "Withholding" / "236H",
            "153": base / "Withholding" / "153",
            "KPRA": base / "KPRA",
            "Income_Tax": base / "Income_Tax",
            "Notices": base / "Notices",
            "Working_Files": base / "Working_Files",
        }
        
        for path in categories.values():
            path.mkdir(parents=True, exist_ok=True)
        
        return categories
    
    def get_desktop_path_for_document(self, document: Document, client_name: str) -> Path:
        """
        Calculate the Desktop path for a given document.
        """
        # Extract year and category from document
        year = document.tax_year or datetime.now().year
        
        # Determine category folder
        category_map = {
            "Sales Tax Return": "Sales_Tax",
            "236H": "Withholding/236H",
            "153": "Withholding/153",
            "KPRA": "KPRA",
            "Income Tax Return": "Income_Tax",
            "Working File": "Working_Files",
            "Notice": "Notices",
            "Other": "Working_Files",
        }
        
        doc_category = document.doc_category or "Other"
        folder_path = category_map.get(doc_category, "Working_Files")
        
        desktop_folder = self.get_desktop_clients_path() / client_name / str(year) / folder_path
        desktop_folder.mkdir(parents=True, exist_ok=True)
        
        return desktop_folder / document.original_file_name
    
    def sync_document_to_desktop(self, document_id: str) -> Tuple[bool, str]:
        """
        Sync a single document to Desktop.
        
        Returns (success, message/error)
        """
        config = self.get_sync_config()
        if not config or not config.get("sync_enabled", True):
            return False, "Desktop sync is disabled"
        
        sync_direction = config.get("sync_direction", "software_to_desktop")
        if sync_direction == "desktop_to_software":
            return False, "Sync direction is Desktop→Software only"
        
        try:
            # Get document from database
            document = self.db.query(Document).filter(Document.id == document_id).first()
            if not document:
                return False, f"Document {document_id} not found"
            
            if document.is_deleted:
                return False, "Document is marked as deleted"
            
            # Get client name
            client = self.db.query(Client).filter(Client.id == document.client_id).first()
            if not client:
                return False, f"Client not found for document {document_id}"
            
            client_name = client.client_name
            
            # Get source and destination paths
            source_path = Path(document.file_path)
            if not source_path.exists():
                return False, f"Source file not found: {document.file_path}"
            
            dest_path = self.get_desktop_path_for_document(document, client_name)
            
            # Copy file to Desktop
            shutil.copy2(str(source_path), str(dest_path))
            
            # Update document record
            document.desktop_synced = True
            document.desktop_path = str(dest_path)
            document.desktop_synced_at = datetime.utcnow()
            self.db.commit()
            
            return True, f"Synced to {dest_path}"
            
        except Exception as e:
            self.db.rollback()
            return False, f"Sync failed: {str(e)}"
    
    def sync_all_documents(self, limit: Optional[int] = None) -> Dict[str, any]:
        """
        Sync all unsynced documents to Desktop.
        
        Returns summary of sync operation.
        """
        config = self.get_sync_config()
        if not config or not config.get("sync_enabled", True):
            return {"success": False, "message": "Desktop sync is disabled"}
        
        try:
            # Get all documents that haven't been synced or need resyncing
            query = self.db.query(Document).filter(
                and_(
                    Document.is_deleted == False,
                    Document.desktop_synced == False
                )
            )
            
            if limit:
                query = query.limit(limit)
            
            documents = query.all()
            
            success_count = 0
            error_count = 0
            errors = []
            
            for doc in documents:
                success, message = self.sync_document_to_desktop(doc.id)
                if success:
                    success_count += 1
                else:
                    error_count += 1
                    errors.append(f"{doc.original_file_name}: {message}")
            
            # Update last sync time
            self.db.execute(
                "UPDATE sync_config SET last_sync_at = :time WHERE id = 'default'",
                {"time": datetime.utcnow()}
            )
            self.db.commit()
            
            return {
                "success": True,
                "synced": success_count,
                "failed": error_count,
                "errors": errors[:10],  # Limit error messages
                "total_documents": len(documents),
            }
            
        except Exception as e:
            self.db.rollback()
            return {
                "success": False,
                "message": f"Bulk sync failed: {str(e)}",
                "synced": 0,
                "failed": 0,
            }
    
    def remove_from_desktop(self, document_id: str) -> Tuple[bool, str]:
        """
        Remove a document from Desktop when deleted from software.
        """
        try:
            document = self.db.query(Document).filter(Document.id == document_id).first()
            if not document or not document.desktop_path:
                return True, "No desktop file to remove"
            
            desktop_path = Path(document.desktop_path)
            if desktop_path.exists():
                desktop_path.unlink()
                return True, "Removed from Desktop"
            else:
                return True, "Desktop file already removed"
                
        except Exception as e:
            return False, f"Failed to remove from Desktop: {str(e)}"
    
    def get_sync_status(self) -> Dict[str, any]:
        """Get current sync status and statistics."""
        try:
            config = self.get_sync_config()
            
            # Count documents
            total_docs = self.db.query(Document).filter(Document.is_deleted == False).count()
            synced_docs = self.db.query(Document).filter(
                and_(
                    Document.is_deleted == False,
                    Document.desktop_synced == True
                )
            ).count()
            pending_docs = total_docs - synced_docs
            
            return {
                "sync_enabled": config.get("sync_enabled", False) if config else False,
                "desktop_path": str(self.get_desktop_base_path()),
                "last_sync_at": config.get("last_sync_at") if config else None,
                "total_documents": total_docs,
                "synced_documents": synced_docs,
                "pending_sync": pending_docs,
                "sync_direction": config.get("sync_direction", "software_to_desktop") if config else "software_to_desktop",
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


def get_desktop_sync_service(db: Session) -> DesktopSyncService:
    """Factory function to get DesktopSyncService instance."""
    return DesktopSyncService(db)