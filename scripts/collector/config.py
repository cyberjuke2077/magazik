"""Configuration management for the collector."""

import yaml
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass


@dataclass
class SessionConfig:
    """Configuration for browser sessions."""
    count: int = 10
    work_duration: int = 7200  # 2 hours
    break_duration: int = 600  # 10 minutes
    night_break: bool = False


@dataclass
class DelayConfig:
    """Delay configuration for different sources."""
    nexar: Tuple[int, int] = (2, 5)
    chipdip: Tuple[int, int] = (15, 30)
    google: Tuple[int, int] = (5, 10)
    manufacturer: Tuple[int, int] = (10, 20)
    distributor: Tuple[int, int] = (10, 15)


@dataclass
class RetryConfig:
    """Retry configuration."""
    max_attempts: int = 3
    backoff: Optional[List[int]] = None

    def __post_init__(self):
        if self.backoff is None:
            self.backoff = [60, 300, 900]


@dataclass
class SourceConfig:
    """Data source configuration."""
    name: str
    enabled: bool
    priority: int


@dataclass
class DatabaseConfig:
    """Database configuration."""
    sqlite: str = './data/progress.db'
    postgresql: str = ''


@dataclass
class LoggingConfig:
    """Logging configuration."""
    level: str = 'INFO'
    file: str = './logs/collector-{date}.log'
    rotation: str = 'daily'
    retention: int = 30


@dataclass
class CollectorConfig:
    """Main collector configuration."""
    sessions: SessionConfig
    delays: DelayConfig
    retry: RetryConfig
    sources: List[SourceConfig]
    database: DatabaseConfig
    logging: LoggingConfig

    @classmethod
    def from_yaml(cls, path: str) -> 'CollectorConfig':
        """Load configuration from YAML file."""
        with open(path, 'r') as f:
            data = yaml.safe_load(f)

        return cls(
            sessions=SessionConfig(**data.get('sessions', {})),
            delays=DelayConfig(**data.get('delays', {})),
            retry=RetryConfig(**data.get('retry', {})),
            sources=[SourceConfig(**s) for s in data.get('sources', [])],
            database=DatabaseConfig(**data.get('database', {})),
            logging=LoggingConfig(**data.get('logging', {}))
        )

    @classmethod
    def default(cls) -> 'CollectorConfig':
        """Create default configuration."""
        return cls(
            sessions=SessionConfig(),
            delays=DelayConfig(),
            retry=RetryConfig(),
            sources=[
                SourceConfig(name='chipdip', enabled=True, priority=1),
                SourceConfig(name='google', enabled=True, priority=2),
                SourceConfig(name='manufacturer', enabled=True, priority=3),
                SourceConfig(name='distributor', enabled=True, priority=4),
            ],
            database=DatabaseConfig(),
            logging=LoggingConfig()
        )
