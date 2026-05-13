"""Octopart data extractor."""

from typing import Optional, List, Dict, Any
from playwright.async_api import Page
from .base import BaseExtractor, ExtractResult


class OctopartExtractor(BaseExtractor):
    """Extract data from Octopart.com."""
    
    def __init__(self, name: str = "octopart"):
        """Initialize Octopart extractor."""
        super().__init__(name)
        self.base_url = "https://octopart.com"
    
    def get_url(self, part_number: str, manufacturer: Optional[str] = None) -> str:
        """Get Octopart search URL."""
        return f"{self.base_url}/search?q={part_number}"
    
    async def extract(
        self,
        page: Page,
        part_number: str,
        manufacturer: str
    ) -> ExtractResult:
        """Extract product data from Octopart."""
        try:
            url = self.get_url(part_number, manufacturer)
            await page.goto(url, wait_until="domcontentloaded", timeout=60000)
            
            # Wait for search results
            try:
                await page.wait_for_selector(".search-results, .no-results", timeout=30000)
            except:
                return ExtractResult.failure(f"Timeout waiting for search results")
            
            # Check if no results
            no_results = await page.query_selector(".no-results")
            if no_results:
                return ExtractResult.failure(f"Product {part_number} not found on Octopart")
            
            # Extract product data
            data = await self._extract_product_data(page, part_number, manufacturer)
            
            if data:
                return ExtractResult.success(data)
            else:
                return ExtractResult.failure("Failed to extract product data")
            
        except Exception as e:
            return ExtractResult.failure(f"Octopart extraction error: {str(e)}")
    
    async def _extract_product_data(
        self,
        page: Page,
        part_number: str,
        manufacturer: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Extract product data from page."""
        try:
            # Extract product name
            name_elem = await page.query_selector(".part-title, h1.part-name")
            name = await name_elem.inner_text() if name_elem else part_number
            
            # Extract description
            desc_elem = await page.query_selector(".part-description, .description")
            description = await desc_elem.inner_text() if desc_elem else ""
            
            # Extract manufacturer
            mfr_elem = await page.query_selector(".manufacturer-name, .mfr-name")
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
                "source": "octopart"
            }
            
        except Exception as e:
            print(f"Error extracting product data: {e}")
            return None
    
    async def _extract_specifications(self, page: Page) -> Dict[str, str]:
        """Extract product specifications."""
        specs = {}
        
        try:
            # Try table format
            spec_rows = await page.query_selector_all(".specs-table tr, .specifications tr")
            for row in spec_rows:
                key_elem = await row.query_selector(".spec-key, td:first-child, th")
                val_elem = await row.query_selector(".spec-value, td:last-child")
                if key_elem and val_elem:
                    key = await key_elem.inner_text()
                    val = await val_elem.inner_text()
                    specs[key.strip()] = val.strip()
            
            # Try list format
            if not specs:
                spec_items = await page.query_selector_all(".spec-item, .specification")
                for item in spec_items:
                    text = await item.inner_text()
                    if ":" in text:
                        key, value = text.split(":", 1)
                        specs[key.strip()] = value.strip()
        
        except Exception as e:
            print(f"Error extracting specifications: {e}")
        
        return specs
    
    async def _extract_datasheets(self, page: Page) -> List[str]:
        """Extract datasheet links."""
        datasheets = []
        
        try:
            datasheet_links = await page.query_selector_all("a[href*='datasheet'], a[href$='.pdf']")
            for link in datasheet_links[:3]:  # Max 3 datasheets
                href = await link.get_attribute("href")
                if href and href.startswith("http"):
                    datasheets.append(href)
        
        except Exception as e:
            print(f"Error extracting datasheets: {e}")
        
        return datasheets
    
    async def _extract_images(self, page: Page) -> List[str]:
        """Extract product images."""
        images = []
        
        try:
            img_elems = await page.query_selector_all(".product-image img, .part-image img")
            for img in img_elems[:5]:  # Max 5 images
                src = await img.get_attribute("src")
                if src and src.startswith("http") and not src.endswith(".svg"):
                    images.append(src)
        
        except Exception as e:
            print(f"Error extracting images: {e}")
        
        return images
