"""Utility functions for the collector."""

import random
import asyncio
from typing import Tuple
from fake_useragent import UserAgent


def get_random_delay(min_sec: int, max_sec: int) -> int:
    """Get random delay in seconds."""
    return random.randint(min_sec, max_sec)


def get_random_user_agent() -> str:
    """Get random realistic User-Agent."""
    ua = UserAgent()
    return ua.random


async def human_like_scroll(page):
    """Simulate human-like scrolling behavior."""
    try:
        # Get page height
        height = await page.evaluate("document.body.scrollHeight")
        
        # Scroll in random increments
        current = 0
        while current < height:
            increment = random.randint(100, 500)
            current += increment
            await page.evaluate(f"window.scrollTo(0, {current})")
            await asyncio.sleep(random.uniform(0.1, 0.5))
    except Exception as e:
        print(f"Scroll error: {e}")


async def random_mouse_movement(page):
    """Simulate random mouse movements."""
    try:
        for _ in range(random.randint(2, 5)):
            x = random.randint(100, 800)
            y = random.randint(100, 600)
            await page.mouse.move(x, y)
            await asyncio.sleep(random.uniform(0.1, 0.3))
    except Exception as e:
        print(f"Mouse movement error: {e}")
