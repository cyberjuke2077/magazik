# Collector Usage Guide

## Installation

1. Install dependencies:
```bash
cd scripts/collector
pip install -r requirements.txt
playwright install chromium
```

2. Initialize database:
```bash
python scripts/init_collector_db.py /path/to/excel/files
```

## Running

### Start collector:
```bash
python -m scripts.collector.main config.yaml
```

### Monitor progress:
- TUI shows real-time progress
- Press Ctrl+C to stop gracefully

## Configuration

Edit `config.yaml` to adjust:
- Number of parallel sessions
- Delays between requests
- Data sources priority
- Database paths

## Troubleshooting

### Slow performance
- Reduce `sessions.count`
- Increase delays

### Getting blocked
- Increase delays
- Enable `night_break`
- Reduce `sessions.count`

### Database errors
- Check PostgreSQL connection
- Verify Prisma schema
