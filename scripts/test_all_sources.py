import asyncio
from cloakbrowser import launch_async

async def test():
    browser = await launch_async(headless=True)
    
    sources = [
        ("Octopart", "https://octopart.com/search?q=LM358"),
        ("Digi-Key", "https://www.digikey.com/en/products/result?keywords=LM358"),
        ("Mouser", "https://www.mouser.com/ProductDetail/LM358"),
        ("Google", "https://www.google.com/search?q=LM358+datasheet")
    ]
    
    for name, url in sources:
        page = await browser.new_page()
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=20000)
            await asyncio.sleep(2)
            title = await page.title()
            print(f"{name}: {title[:80]}")
        except Exception as e:
            print(f"{name}: ERROR - {str(e)[:80]}")
        finally:
            await page.close()
    
    await browser.close()

asyncio.run(test())
