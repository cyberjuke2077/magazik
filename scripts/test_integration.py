#!/usr/bin/env python3
"""Integration test for CloakBrowser and new extractors."""

import asyncio
import sys
sys.path.insert(0, '/Users/lux/Desktop/projects/electromagaz')

from scripts.collector.session import BrowserSession
from scripts.collector.config import CollectorConfig


async def test_single_product():
    """Test extraction of a single product through all sources."""
    
    # Test product: TI chip (should be found on multiple sources)
    test_part_number = "LM358"
    test_manufacturer = "Texas Instruments"
    
    print(f"\n{'='*60}")
    print(f"Testing product: {test_part_number} ({test_manufacturer})")
    print(f"{'='*60}\n")
    
    # Load config
    config = CollectorConfig.default()
    
    # Create session
    session = BrowserSession(session_id=1, config=config)
    
    try:
        # Start browser
        print("🚀 Starting CloakBrowser...")
        await session.start()
        print("✅ CloakBrowser started successfully\n")
        
        # Test cascading extraction (tries all sources automatically)
        print(f"📡 Testing cascading extraction through all sources...")
        
        try:
            result = await session.extract_product_data(
                part_number=test_part_number,
                manufacturer=test_manufacturer
            )
            
            if result.get('data'):
                print(f"   ✅ Success!")
                print(f"   Source: {result.get('source', 'N/A')}")
                data = result['data']
                print(f"   Name: {data.get('name', 'N/A')[:60]}...")
                print(f"   Specs: {len(data.get('specifications', {}))} items")
                print(f"   Datasheets: {len(data.get('datasheets', []))} files")
                print(f"   Images: {len(data.get('images', []))} images")
                results = {"cascading": f"✅ SUCCESS via {result.get('source')}"}
            else:
                print(f"   ❌ Failed: No data extracted from any source")
                results = {"cascading": "❌ FAILED: No data from any source"}
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)[:100]}")
            import traceback
            traceback.print_exc()
            results = {"cascading": f"❌ EXCEPTION: {str(e)[:50]}"}
        
        print()
        
        # Summary
        print(f"\n{'='*60}")
        print("SUMMARY")
        print(f"{'='*60}")
        for source, status in results.items():
            print(f"{source:15} {status}")
        
        success_count = sum(1 for s in results.values() if s.startswith("✅"))
        print(f"\n✅ {success_count}/{len(results)} test successful")
        
    finally:
        # Cleanup
        print("\n🧹 Closing browser...")
        await session.close()
        print("✅ Browser closed\n")


if __name__ == "__main__":
    asyncio.run(test_single_product())
