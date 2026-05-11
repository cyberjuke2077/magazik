#!/usr/bin/env python3
"""
Test CloudScraper against ChipDip DDoS-Guard protection
Tests 3 configurations to see if any can bypass the protection
"""

import sys

try:
    import cloudscraper
except ImportError:
    print("❌ CloudScraper not installed. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "cloudscraper"])
    import cloudscraper

def test_chipdip():
    """Test CloudScraper with different configurations"""
    
    test_url = "https://www.chipdip.ru/product/stm32f103c8t6"
    captcha_api_key = "f92be355bb8d6a36c9793a0b4494bfe0"
    
    print("=" * 60)
    print("Testing CloudScraper against ChipDip DDoS-Guard")
    print("=" * 60)
    print(f"Target URL: {test_url}")
    print()
    
    # Test 1: Basic CloudScraper
    print("Test 1: Basic CloudScraper")
    print("-" * 60)
    try:
        scraper1 = cloudscraper.create_scraper(
            browser='chrome',
            debug=False
        )
        response1 = scraper1.get(test_url, timeout=30)
        
        print(f"Status Code: {response1.status_code}")
        print(f"Response Length: {len(response1.text)} bytes")
        
        # Check for captcha/block indicators
        text_lower = response1.text.lower()
        if "captcha" in text_lower or "доступ ограничен" in text_lower or response1.status_code == 403:
            print("❌ BLOCKED - Captcha or access denied detected")
        elif "stm32f103c8t6" in text_lower or "product" in text_lower:
            print("✅ SUCCESS - Product page loaded!")
        else:
            print("⚠️  UNKNOWN - Response received but unclear if blocked")
            print(f"First 200 chars: {response1.text[:200]}")
    except Exception as e:
        print(f"❌ ERROR: {e}")
    
    print()
    
    # Test 2: High Security with 2captcha
    print("Test 2: High Security CloudScraper + 2captcha")
    print("-" * 60)
    try:
        scraper2 = cloudscraper.create_high_security_scraper(
            captcha_api_key=captcha_api_key,
            debug=False
        )
        response2 = scraper2.get(test_url, timeout=60)
        
        print(f"Status Code: {response2.status_code}")
        print(f"Response Length: {len(response2.text)} bytes")
        
        text_lower = response2.text.lower()
        if "captcha" in text_lower or "доступ ограничен" in text_lower or response2.status_code == 403:
            print("❌ BLOCKED - Captcha or access denied detected")
        elif "stm32f103c8t6" in text_lower or "product" in text_lower:
            print("✅ SUCCESS - Product page loaded!")
        else:
            print("⚠️  UNKNOWN - Response received but unclear if blocked")
            print(f"First 200 chars: {response2.text[:200]}")
    except Exception as e:
        print(f"❌ ERROR: {e}")
    
    print()
    
    # Test 3: Full Stealth Mode
    print("Test 3: Full Stealth Mode (All Features)")
    print("-" * 60)
    try:
        scraper3 = cloudscraper.create_scraper(
            browser='chrome',
            debug=False,
            
            # Advanced TLS fingerprinting
            enable_tls_fingerprinting=True,
            enable_tls_rotation=True,
            
            # Anti-detection systems
            enable_anti_detection=True,
            
            # Enhanced fingerprint spoofing
            enable_enhanced_spoofing=True,
            spoofing_consistency_level='medium',
            
            # Intelligent challenge detection
            enable_intelligent_challenges=True,
            
            # Adaptive timing
            enable_adaptive_timing=True,
            behavior_profile='casual',
            
            # Machine learning optimization
            enable_ml_optimization=True,
            
            # Enhanced error handling
            enable_enhanced_error_handling=True,
            
            # Stealth mode
            enable_stealth=True,
            stealth_options={
                'min_delay': 1.0,
                'max_delay': 4.0,
                'human_like_delays': True,
                'randomize_headers': True,
                'browser_quirks': True,
                'simulate_viewport': True,
                'behavioral_patterns': True
            }
        )
        response3 = scraper3.get(test_url, timeout=60)
        
        print(f"Status Code: {response3.status_code}")
        print(f"Response Length: {len(response3.text)} bytes")
        
        text_lower = response3.text.lower()
        if "captcha" in text_lower or "доступ ограничен" in text_lower or response3.status_code == 403:
            print("❌ BLOCKED - Captcha or access denied detected")
        elif "stm32f103c8t6" in text_lower or "product" in text_lower:
            print("✅ SUCCESS - Product page loaded!")
        else:
            print("⚠️  UNKNOWN - Response received but unclear if blocked")
            print(f"First 200 chars: {response3.text[:200]}")
            
        # Get enhanced statistics if available
        try:
            stats = scraper3.get_enhanced_statistics()
            print(f"\nEnhanced Statistics:")
            for system, status in stats.items():
                print(f"  {system}: {status}")
        except:
            pass
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
    
    print()
    print("=" * 60)
    print("Test Complete")
    print("=" * 60)

if __name__ == "__main__":
    test_chipdip()
