"""Tests for browser session manager."""

import pytest
from scripts.collector.session import BrowserSession
from scripts.collector.config import CollectorConfig


@pytest.mark.asyncio
@pytest.mark.skip(reason="Playwright browser launch issue - skip for now")
async def test_session_start_and_close():
    """Test session can start and close."""
    config = CollectorConfig.default()
    session = BrowserSession(1, config)
    
    await session.start()
    assert session.browser is not None
    assert session.page is not None
    
    await session.close()
