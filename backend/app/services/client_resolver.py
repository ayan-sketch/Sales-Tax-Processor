"""
Client matching and auto-creation service for withholding imports.
Matches by NTN first, then falls back to fuzzy name matching.
"""
import re
from typing import Optional, Tuple
from sqlalchemy.orm import Session

from app.models.client import Client


def normalize_ntn(raw: Optional[str]) -> Optional[str]:
    """Normalize NTN to 7-1 format or return None."""
    if not raw:
        return None
    digits = re.sub(r"[^\d]", "", raw)
    if len(digits) == 8:
        return f"{digits[:7]}-{digits[7]}"
    if len(digits) == 7:
        return f"{digits}"
    return None


def normalize_name(name: str) -> str:
    """Normalize client name for fuzzy matching."""
    return re.sub(r"\s+", " ", name.strip().upper())


def name_similarity(n1: str, n2: str) -> float:
    """Simple name similarity score (0-1) based on word overlap."""
    words1 = set(normalize_name(n1).split())
    words2 = set(normalize_name(n2).split())
    if not words1 or not words2:
        return 0.0
    intersection = words1 & words2
    union = words1 | words2
    return len(intersection) / len(union)


def resolve_client(
    db: Session,
    owner_id: str,
    ntn: Optional[str],
    client_name: Optional[str],
    cnic: Optional[str] = None,
    auto_create: bool = True,
) -> Tuple[Optional[Client], bool, bool]:
    """
    Find or create a client for withholding import.
    
    Args:
        db: Database session
        ntn: Normalized NTN (or raw)
        client_name: Client name from extract
        cnic: Optional CNIC number
        auto_create: Whether to create a new client when no match exists
        
    Returns:
        (Client or None, created, would_create) tuple.
        created is True if a new client was created.
        would_create is True when no existing client was found and auto_create=False.
    """
    normalized_ntn = normalize_ntn(ntn)
    owned_clients = db.query(Client).filter(Client.owner_id == owner_id)

    # Strategy 1: Match by NTN
    if normalized_ntn:
        client = owned_clients.filter(Client.ntn == normalized_ntn).first()
        if client:
            return client, False, False

    # Strategy 2: Match by CNIC if no NTN match
    if cnic and not normalized_ntn:
        client = owned_clients.filter(Client.cnic == cnic).first()
        if client:
            return client, False, False
    
    # Strategy 3: Match by name (if no NTN or NTN didn't match)
    if client_name:
        norm_input = normalize_name(client_name)
        
        # Try exact name match
        client = owned_clients.filter(
            Client.client_name.ilike(client_name.strip())
        ).first()
        if client:
            return client, False, False
        
        # Try normalized match (case-insensitive)
        clients = owned_clients.all()
        best_match = None
        best_score = 0.0
        
        for c in clients:
            score = name_similarity(c.client_name, norm_input)
            if score > best_score and score >= 0.5:
                best_score = score
                best_match = c
        
        if best_match:
            return best_match, False, False
    
    if not auto_create:
        return None, False, True
    
    # Strategy 4: Auto-create client
    name = client_name or (f"Client_{normalized_ntn}" if normalized_ntn else "Unknown Client")
    new_client = Client(
        owner_id=owner_id,
        client_name=name.strip(),
        ntn=normalized_ntn,
        cnic=cnic,
        withholding_registered=True,
        is_active=True,
    )
    db.add(new_client)
    db.flush()  # Get the ID without committing
    
    # Refresh to load the id
    db.refresh(new_client)
    
    # Also update withholding_registered on the new client
    new_client.withholding_registered = True
    
    return new_client, True, False


def bulk_resolve_clients(
    db: Session,
    owner_id: str,
    extracts: list,
) -> list:
    """
    Resolve multiple client extracts in batch.
    Each extract should have .ntn and .client_name attributes.
    
    Returns list of (extract, client, created) tuples.
    """
    results = []
    for extract in extracts:
        client, created, _ = resolve_client(
            db=db,
            owner_id=owner_id,
            ntn=extract.ntn if hasattr(extract, 'ntn') else None,
            client_name=extract.client_name if hasattr(extract, 'client_name') else None,
        )
        results.append((extract, client, created))
    return results
