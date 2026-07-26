"""Base extractor class for all data sources."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Dict, Any
from playwright.async_api import Page


@dataclass
class ExtractResult:
    """Result of data extraction."""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    
    @classmethod
    def success(cls, data: Dict[str, Any]) -> "ExtractResult":
        """Create successful result."""
        return cls(success=True, data=data, error=None)
    
    @classmethod
    def failure(cls, error: str) -> "ExtractResult":
        """Create failed result."""
        return cls(success=False, data=None, error=error)


class BaseExtractor(ABC):
    """Base class for all extractors."""
    
    def __init__(self, name: str):
        """Initialize extractor."""
        self.name = name
    
    @abstractmethod
    async def extract(
        self,
        page: Page,
        part_number: str,
        manufacturer: str
    ) -> ExtractResult:
        """Extract data for a product.
        
        Args:
            page: Playwright page object
            part_number: Product part number
            manufacturer: Manufacturer name
            
        Returns:
            ExtractResult with extracted data or error
        """
        pass
    
    @abstractmethod
    def get_url(self, part_number: str, manufacturer: str) -> str:
        """Get URL for product search.
        
        Args:
            part_number: Product part number
            manufacturer: Manufacturer name
            
        Returns:
            URL string
        """
        pass
