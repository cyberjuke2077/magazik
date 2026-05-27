import asyncio
from cloakbrowser import launch_async
from collector.extractors.digikey import DigiKeyExtractor

async def test():
    browser = await launch_async(headless=True)
    page = await browser.new_page()
    
    extractor = DigiKeyExtractor()
    result = await extractor.extract(page, "LM358", "Texas Instruments")
    
    print(f"Success: {result.success}")
    print(f"Data: {result.data}")
    print(f"Error: {result.error}")
    
    await browser.close()

asyncio.run(test())
