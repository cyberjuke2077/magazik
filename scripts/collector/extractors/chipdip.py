"""ChipDip data extractor."""

from typing import Optional, List, Dict
from playwright.async_api import Page
from .base import BaseExtractor, ExtractResult


class ChipDipExtractor(BaseExtractor):
    """Extract data from ChipDip.ru."""
    
    def __init__(self, name: str = "chipdip"):
        """Initialize ChipDip extractor."""
        super().__init__(name)
        self.base_url = "https://www.chipdip.ru"
    
    def get_url(self, part_number: str, manufacturer: str) -> str:
        """Get ChipDip search URL."""
        return f"{self.base_url}/search?searchtext={part_number}"
    
    async def extract(
        self,
        page: Page,
        part_number: str,
        manufacturer: str
    ) -> ExtractResult:
        """Extract product data from ChipDip."""
        try:
            url = self.get_url(part_number, manufacturer)
            # Use domcontentloaded for faster initial load
            await page.goto(url, wait_until="domcontentloaded", timeout=60000)
            
            # Wait longer for search results table to appear
            try:
                await page.wait_for_selector("table.itemlist", timeout=45000)
            except:
                # No results found
                return ExtractResult.failure("Product not found on ChipDip")
            
            # Check if no results message exists
            no_results = await page.query_selector(".no-results")
            if no_results:
                return ExtractResult.failure("Product not found on ChipDip")
            
            # Extract product data
            data = await self._extract_product_data(page, part_number)
            
            if data:
                return ExtractResult.success(data)
            else:
                return ExtractResult.failure("Failed to extract product data")
                
        except Exception as e:
            return ExtractResult.failure(f"ChipDip extraction error: {str(e)}")
    
    async def _extract_product_data(self, page: Page, part_number: str) -> Optional[Dict]:
        """Extract product data from page."""
        try:
            # Find product link in itemlist table
            product_link = await page.query_selector(f"table.itemlist a.link[href*='{part_number.lower()}']")
            if not product_link:
                # Try first product in results table
                product_link = await page.query_selector("table.itemlist tr.with-hover a.link")
            
            if not product_link:
                return None
            
            # Go to product page
            await product_link.click()
            await page.wait_for_load_state("domcontentloaded")
            
            # Extract name
            name_elem = await page.query_selector("h1.product-name, h1")
            name = await name_elem.inner_text() if name_elem else ""
            
            # Extract description
            desc_elem = await page.query_selector(".product-description, .description")
            description = await desc_elem.inner_text() if desc_elem else ""
            
            # Extract specifications
            specs = await self._extract_specifications(page)
            
            # Extract price
            price_elem = await page.query_selector(".price-value, .price")
            price = await price_elem.inner_text() if price_elem else None
            
            # Extract availability
            stock_elem = await page.query_selector(".stock-status, .availability")
            stock = await stock_elem.inner_text() if stock_elem else None
            
            # Extract images
            images = await self._extract_images(page)
            
            # Extract datasheet links
            datasheets = await self._extract_datasheets(page)
            
            return {
                "name": name.strip(),
                "description": description.strip(),
                "specifications": specs,
                "price": price.strip() if price else None,
                "stock": stock.strip() if stock else None,
                "images": images,
                "datasheets": datasheets,
                "source": "chipdip"
            }
            
        except Exception as e:
            print(f"Error extracting product data: {e}")
            return None
    
    async def _extract_specifications(self, page: Page) -> Dict[str, str]:
        """Extract product specifications."""
        specs = {}
        
        try:
            # Try table format
            rows = await page.query_selector_all(".specifications tr, .specs-table tr")
            for row in rows:
                cells = await row.query_selector_all("td, th")
                if len(cells) >= 2:
                    key = await cells[0].inner_text()
                    value = await cells[1].inner_text()
                    specs[key.strip()] = value.strip()
            
            # Try list format
            if not specs:
                items = await page.query_selector_all(".spec-item, .specification")
                for item in items:
                    text = await item.inner_text()
                    if ":" in text:
                        key, value = text.split(":", 1)
                        specs[key.strip()] = value.strip()
        
        except Exception as e:
            print(f"Error extracting specifications: {e}")
        
        return specs
    
    async def _extract_images(self, page: Page) -> List[str]:
        """Extract product images."""
        images = []
        
        try:
            img_elements = await page.query_selector_all(".product-image img, .gallery img")
            for img in img_elements:
                src = await img.get_attribute("src")
                if src and not src.endswith(".svg"):
                    # Convert to absolute URL
                    if src.startswith("//"):
                        src = "https:" + src
                    elif src.startswith("/"):
                        src = self.base_url + src
                    images.append(src)
        
        except Exception as e:
            print(f"Error extracting images: {e}")
        
        return images
    
    async def _extract_datasheets(self, page: Page) -> List[str]:
        """Extract datasheet links."""
        datasheets = []
        
        try:
            links = await page.query_selector_all("a[href*='datasheet'], a[href$='.pdf']")
            for link in links:
                href = await link.get_attribute("href")
                if href:
                    # Convert to absolute URL
                    if href.startswith("//"):
                        href = "https:" + href
                    elif href.startswith("/"):
                        href = self.base_url + href
                    datasheets.append(href)
        
        except Exception as e:
            print(f"Error extracting datasheets: {e}")
        
        return datasheets
