#!/bin/bash
echo "=== Parser Status ==="
echo "Process: $(ps aux | grep 'parse-with-2captcha' | grep -v grep | wc -l) running"
echo ""
echo "Latest progress:"
tail -50 /Users/lux/Desktop/projects/electromagaz/parser-2captcha.log | grep "Progress:" | tail -1
echo ""
echo "Captchas solved:"
tail -100 /Users/lux/Desktop/projects/electromagaz/parser-2captcha.log | grep "🔐" | tail -1
echo ""
echo "Recent products:"
tail -50 /Users/lux/Desktop/projects/electromagaz/parser-2captcha.log | grep "✅ Parsed" | tail -3
echo ""
echo "Errors:"
tail -50 /Users/lux/Desktop/projects/electromagaz/parser-2captcha.log | grep "❌" | tail -3
