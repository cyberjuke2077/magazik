"""Google search extractor for product data."""

import asyncio
from typing import Optional, Dict, Any
from urllib.parse import quote_plus
from playwright.async_api import Page, TimeoutError as PlaywrightTimeout

from .base import BaseExtractor, ExtractResult


class GoogleExtractor(BaseExtractor):
    """Extract product data from Google search results."""
    
    def __init__(self, name: str = "google"):
        """Initialize Google extractor."""
        super().__init__(name)
    
    def get_url(self, part_number: str, manufacturer: str) -> str:
        """Generate Google search URL for product."""
        query = f"{part_number} {manufacturer} datasheet specifications"
        return f"https://www.google.com/search?q={quote_plus(query)}"
    
    async def extract(
        self,
        page: Page,
        part_number: str,
        manufacturer: str,
        package: Optional[str] = None
    ) -> ExtractResult:
        """
        Extract product data from Google search results.
        
        Strategy:
        1. Search for "{part_number} {manufacturer} datasheet"
        2. Look for results from manufacturer sites, distributors, or datasheets
        3. Extract basic info from search snippets
        4. Follow top result for detailed data
        """
        try:
            url = self.get_url(part_number, manufacturer)
            
            # Navigate to Google search
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            
            # Wait for search results
            try:
                await page.wait_for_selector("div#search", timeout=10000)
            except PlaywrightTimeout:
                return ExtractResult.failure("Google search results not loaded")
            
            # Extract data from search results
            data = await self._extract_from_results(page, part_number, manufacturer)
            
            if data:
                return ExtractResult.success(data)
            else:
                return ExtractResult.failure("No relevant data found in Google results")
                
        except PlaywrightTimeout as e:
            return ExtractResult.failure(f"Timeout: {str(e)}")
        except Exception as e:
            return ExtractResult.failure(f"Google extraction error: {str(e)}")
    
    async def _extract_from_results(
        self,
        page: Page,
        part_number: str,
        manufacturer: str
    ) -> Optional[Dict[str, Any]]:
        """Extract product data from Google search results."""
        data = {
            "name": f"{part_number} - {manufacturer}",
            "description": "",
            "specifications": {},
            "datasheets": [],
            "images": []
        }
        
        # Look for search result snippets
        snippets = await page.query_selector_all("div.g")
        
        for snippet in snippets[:5]:  # Check first 5 results
            try:
                # Extract title
                title_elem = await snippet.query_selector("h3")
                if title_elem:
                    title = await title_elem.inner_text()
                    if not data["description"] and len(title) > len(part_number):
                        data["name"] = title.strip()
                
                # Extract description from snippet
                desc_elem = await snippet.query_selector("div[data-sncf='1']")
                if not desc_elem:
                    desc_elem = await snippet.query_selector("div.VwiC3b")
                
                if desc_elem:
                    desc = await desc_elem.inner_text()
                    if desc and len(desc) > len(data["description"]):
                        data["description"] = desc.strip()
                
                # Extract datasheet links
                link_elem = await snippet.query_selector("a")
                if link_elem:
                    href = await link_elem.get_attribute("href")
                    if href and (".pdf" in href.lower() or "datasheet" in href.lower()):
                        data["datasheets"].append({
                            "url": href,
                            "title": f"{part_number} Datasheet"
                        })
                        
            except Exception:
                continue
        
        # Return data if we found something useful
        if data["description"] or data["datasheets"]:
            return data
        
        return None
