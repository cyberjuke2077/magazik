"""Browser session manager with human-like behavior."""

import asyncio
import random
from typing import Optional, Dict
from datetime import datetime, timedelta
from playwright.async_api import Browser, BrowserContext, Page
from cloakbrowser import launch_async
# from playwright_stealth import stealth_async  # Disabled - not compatible with Python 3.13

from .config import CollectorConfig, DelayConfig
from .extractors.base import BaseExtractor, ExtractResult
from .extractors.chipdip import ChipDipExtractor
from .extractors.google import GoogleExtractor
from .extractors.nexar import NexarExtractor
from .utils import get_random_user_agent, human_like_scroll, random_mouse_movement, get_random_delay


class BrowserSession:
    """Manages a single browser session with human-like behavior."""
    
    def __init__(self, session_id: int, config: CollectorConfig):
        """Initialize browser session."""
        self.session_id = session_id
        self.config = config
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        
        # Session state
        self.start_time = datetime.now()
        self.requests_count = 0
        self.last_break = datetime.now()
        
        # Extractors
        self.extractors = {
            "nexar": NexarExtractor(),
            "chipdip": ChipDipExtractor("chipdip"),
            "google": GoogleExtractor("google"),
        }
    
    async def start(self):
        """Start browser session."""
        # Launch CloakBrowser with stealth features
        self.browser = await launch_async(
            headless=True
        )
        
        # Create context with random user agent
        self.context = await self.browser.new_context(
            user_agent=get_random_user_agent(),
            viewport={'width': 1920, 'height': 1080},
            locale='ru-RU',
            timezone_id='Europe/Moscow',
        )
        
        # Create page (stealth disabled - not compatible with Python 3.13)
        self.page = await self.context.new_page()
    
    async def close(self):
        """Close browser session."""
        if self.page:
            await self.page.close()
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
    
    async def extract_product_data(
        self,
        part_number: str,
        manufacturer: str
    ) -> Dict:
        """Extract product data using cascading search."""
        result = {
            "part_number": part_number,
            "manufacturer": manufacturer,
            "data": None,
            "source": None,
            "error": None
        }
        
        # Try each source in priority order
        for source_config in sorted(self.config.sources, key=lambda x: x.priority):
            if not source_config.enabled:
                continue
            
            extractor = self.extractors.get(source_config.name)
            if not extractor:
                continue
            
            # Extract data
            extract_result = await self._extract_with_delays(
                extractor,
                part_number,
                manufacturer,
                source_config.name
            )
            
            if extract_result.success:
                result["data"] = extract_result.data
                result["source"] = source_config.name
                return result
            else:
                result["error"] = extract_result.error
        
        return result
    
    async def _extract_with_delays(
        self,
        extractor: BaseExtractor,
        part_number: str,
        manufacturer: str,
        source_name: str
    ) -> ExtractResult:
        """Extract data with human-like delays and behavior."""
        # Get delay config for this source
        delay_range = getattr(self.config.delays, source_name, (10, 20))
        
        # Nexar doesn't need browser page (HTTP API)
        if source_name == "nexar":
            result = await extractor.extract(None, part_number, manufacturer)
        else:
            # Human-like behavior before request
            await random_mouse_movement(self.page)
            
            # Extract data
            result = await extractor.extract(self.page, part_number, manufacturer)
            
            # Human-like behavior after request
            if result.success:
                await human_like_scroll(self.page)
        
        # Delay before next request
        delay = get_random_delay(delay_range[0], delay_range[1])
        await asyncio.sleep(delay)
        
        self.requests_count += 1
        
        # Check if need break
        await self._check_break()
        
        return result
    
    async def _check_break(self):
        """Check if session needs a break."""
        elapsed = (datetime.now() - self.last_break).total_seconds()
        
        if elapsed >= self.config.sessions.work_duration:
            print(f"Session {self.session_id}: Taking break for {self.config.sessions.break_duration}s")
            await asyncio.sleep(self.config.sessions.break_duration)
            self.last_break = datetime.now()
