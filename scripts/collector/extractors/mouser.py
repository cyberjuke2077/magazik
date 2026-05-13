"""Mouser Electronics data extractor."""

import logging
from typing import Optional, List, Dict, Any
from playwright.async_api import Page, TimeoutError as PlaywrightTimeout
from .base import BaseExtractor, ExtractResult

logger = logging.getLogger(__name__)


class MouserExtractor(BaseExtractor):
    """Extract data from Mouser.com."""
    
    def __init__(self, name: str = "mouser"):
        """Initialize Mouser extractor."""
        super().__init__(name)
        self.base_url = "https://www.mouser.com"
    
    def get_url(self, part_number: str, manufacturer: str) -> str:
        """Get Mouser product URL."""
        return f"{self.base_url}/ProductDetail/{part_number}"
    
    async def extract(
        self,
        page: Page,
        part_number: str,
        manufacturer: str
    ) -> ExtractResult:
        """Extract product data from Mouser."""
        try:
            url = self.get_url(part_number, manufacturer)
            await page.goto(url, wait_until="domcontentloaded", timeout=60000)
            
            # Wait for product details or no results
            try:
                await page.wait_for_selector(".pdp-product-name, .no-results", timeout=30000)
            except PlaywrightTimeout:
                return ExtractResult.failure(f"Timeout waiting for product details")
            
            # Check if no results
            no_results = await page.query_selector(".no-results")
            if no_results:
                return ExtractResult.failure(f"Product {part_number} not found on Mouser")
            
            # Extract product data
            data = await self._extract_product_data(page, part_number, manufacturer)
            
            if data:
                return ExtractResult.success(data)
            else:
                return ExtractResult.failure("Failed to extract product data")
            
        except Exception as e:
            return ExtractResult.failure(f"Mouser extraction error: {str(e)}")
    
    async def _extract_product_data(
        self,
        page: Page,
        part_number: str,
        manufacturer: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Extract product data from page."""
        try:
            # Extract product name
            name_elem = await page.query_selector(".pdp-product-name, .product-title")
            name = await name_elem.inner_text() if name_elem else part_number
            
            # Extract description
            desc_elem = await page.query_selector(".product-description, .pdp-description")
            description = await desc_elem.inner_text() if desc_elem else ""
            
            # Extract manufacturer
            mfr_elem = await page.query_selector(".manufacturer-name, .pdp-manufacturer")
            mfr = await mfr_elem.inner_text() if mfr_elem else manufacturer or ""
            
            # Extract specifications
            specs = await self._extract_specifications(page)
            
            # Extract datasheets
            datasheets = await self._extract_datasheets(page)
            
            # Extract images
            images = await self._extract_images(page)
            
            return {
                "name": name.strip(),
                "description": description.strip(),
                "manufacturer": mfr.strip(),
                "specifications": specs,
                "datasheets": datasheets,
                "images": images,
                "source": "mouser"
            }
            
        except Exception as e:
            logger.error(f"Error extracting product data: {e}")
            return None
    
    async def _extract_specifications(self, page: Page) -> Dict[str, str]:
        """Extract product specifications."""
        specs = {}
        
        try:
            # Try specifications table format
            spec_rows = await page.query_selector_all(".specs-table tr, .product-attributes tr")
            for row in spec_rows:
                key_elem = await row.query_selector("td:first-child, th")
                val_elem = await row.query_selector("td:last-child")
                if key_elem and val_elem:
                    key = await key_elem.inner_text()
                    val = await val_elem.inner_text()
                    specs[key.strip()] = val.strip()
            
            # Try alternative format
            if not specs:
                spec_items = await page.query_selector_all(".spec-item, .attribute-row")
                for item in spec_items:
                    text = await item.inner_text()
                    if ":" in text:
                        key, value = text.split(":", 1)
                        specs[key.strip()] = value.strip()
        
        except Exception as e:
            logger.error(f"Error extracting specifications: {e}")
        
        return specs
    
    async def _extract_datasheets(self, page: Page) -> List[str]:
        """Extract datasheet links."""
        datasheets = []
        
        try:
            datasheet_links = await page.query_selector_all("a[href*='datasheet']")
            for link in datasheet_links[:3]:  # Max 3 datasheets
                href = await link.get_attribute("href")
                if href:
                    # Handle relative URLs
                    if href.startswith("http"):
                        datasheets.append(href)
                    elif href.startswith("/"):
                        datasheets.append(f"{self.base_url}{href}")
        
        except Exception as e:
            logger.error(f"Error extracting datasheets: {e}")
        
        return datasheets
    
    async def _extract_images(self, page: Page) -> List[str]:
        """Extract product images."""
        images = []
        
        try:
            img_elems = await page.query_selector_all(".product-image img, .pdp-image img")
            for img in img_elems[:5]:  # Max 5 images
                src = await img.get_attribute("src")
                if src and src.startswith("http") and not src.endswith(".svg"):
                    images.append(src)
        
        except Exception as e:
            logger.error(f"Error extracting images: {e}")
        
        return images
