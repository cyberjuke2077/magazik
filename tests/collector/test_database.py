"""Tests for SQLite progress tracking database."""

import pytest
import sqlite3
from pathlib import Path
from scripts.collector.database import ProgressDB


def test_init_creates_database(tmp_path):
    """Test that database initialization creates tables."""
    db_path = tmp_path / "test.db"
    db = ProgressDB(str(db_path))
    
    # Check that database file exists
    assert db_path.exists()
    
    # Check that table exists
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='product_queue'")
    result = cursor.fetchone()
    conn.close()
    
    assert result is not None
    assert result[0] == 'product_queue'


def test_add_product(tmp_path):
    """Test adding product to queue."""
    db_path = tmp_path / "test.db"
    db = ProgressDB(str(db_path))
    
    db.add_product("AOZ1284PI", "AOS", "TSSOP-8")
    
    stats = db.get_stats()
    assert stats['total'] == 1
    assert stats['pending'] == 1
