#!/bin/bash
# scripts/run_collector.sh

set -e

echo "Starting Product Data Collector..."

# Check if database exists
if [ ! -f "./data/progress.db" ]; then
    echo "Error: Database not initialized"
    echo "Run: python scripts/init_collector_db.py /path/to/excel/files"
    exit 1
fi

# Check if config exists
if [ ! -f "config.yaml" ]; then
    echo "Error: config.yaml not found"
    exit 1
fi

# Start collector
python -m scripts.collector.main config.yaml
