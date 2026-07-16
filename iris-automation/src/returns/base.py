from abc import ABC, abstractmethod
from playwright.sync_api import Page


class BaseReturnFiler(ABC):
    """Base class for all IRIS return types."""

    def __init__(self, page: Page, data: dict):
        self.page = page
        self.data = data

    @abstractmethod
    def fill(self):
        """Fill all form sections for this return type."""
        ...

    @abstractmethod
    def validate(self) -> list[str]:
        """Validate data completeness. Return list of missing fields."""
        ...

    def log_step(self, msg: str):
        print(f"  {msg}")
