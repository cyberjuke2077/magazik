#!/bin/bash

# Monitor parser progress in real-time

LOG_FILE="parser-super.log"
STORAGE_DIR="storage/datasets/default"

echo "🔍 Parser Monitor"
echo "================="
echo ""

# Check if parser is running
PARSER_PID=$(ps aux | grep "parse-super-human.ts" | grep -v grep | awk '{print $2}')
if [ -z "$PARSER_PID" ]; then
  echo "❌ Parser is not running"
else
  echo "✅ Parser is running (PID: $PARSER_PID)"
fi

echo ""

# Check catalog collection progress
CATALOG_PROGRESS=$(tail -100 "$LOG_FILE" 2>/dev/null | grep "Found.*products on this page" | tail -1)
if [ ! -z "$CATALOG_PROGRESS" ]; then
  echo "📦 Catalog Collection:"
  echo "   $CATALOG_PROGRESS"
fi

# Check if Stage 2 started
STAGE2=$(tail -100 "$LOG_FILE" 2>/dev/null | grep "Stage 2:" | tail -1)
if [ ! -z "$STAGE2" ]; then
  echo ""
  echo "🚀 $STAGE2"
fi

# Check parsing progress
PROGRESS=$(tail -100 "$LOG_FILE" 2>/dev/null | grep "Progress:" | tail -1)
if [ ! -z "$PROGRESS" ]; then
  echo "   $PROGRESS"
fi

# Count parsed products
PARSED_COUNT=$(ls -1 "$STORAGE_DIR"/*.json 2>/dev/null | wc -l | tr -d ' ')
echo ""
echo "📊 Products parsed: $PARSED_COUNT"

# Check for captchas
CAPTCHA_COUNT=$(grep -c "Captcha detected" "$LOG_FILE" 2>/dev/null)
echo "🚫 Captchas encountered: $CAPTCHA_COUNT"

# Check for errors
ERROR_COUNT=$(tail -100 "$LOG_FILE" 2>/dev/null | grep -c "Failed to parse")
echo "❌ Recent errors: $ERROR_COUNT"

# Show last 5 parsed products
echo ""
echo "📝 Last 5 parsed products:"
tail -100 "$LOG_FILE" 2>/dev/null | grep "✅ Parsed:" | tail -5 | sed 's/^/   /'

echo ""
echo "================="
echo "💡 Commands:"
echo "   tail -f $LOG_FILE          # Watch logs in real-time"
echo "   pkill -f parse-super-human # Stop parser"
echo "   bash scripts/monitor-parser.sh # Run this monitor again"
