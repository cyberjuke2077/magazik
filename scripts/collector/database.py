"""SQLite database for progress tracking."""

import sqlite3
from pathlib import Path
from typing import Optional, Dict
from enum import Enum


class ProductStatus(Enum):
    """Product processing status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ProgressDB:
    """SQLite database for tracking collection progress."""
    
    def __init__(self, db_path: str):
        """Initialize database connection."""
        self.db_path = db_path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(db_path, check_same_thread=False, timeout=30.0)
        self.conn.row_factory = sqlite3.Row
        self._init_schema()
    
    def _init_schema(self):
        """Create database schema."""
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS product_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                part_number TEXT NOT NULL,
                manufacturer TEXT NOT NULL,
                package TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                session_id INTEGER,
                attempts INTEGER DEFAULT 0,
                last_error TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_status ON product_queue(status)
        """)
        
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_session ON product_queue(session_id)
        """)
        
        self.conn.commit()
    
    def add_product(self, part_number: str, manufacturer: str, package: Optional[str] = None):
        """Add product to queue."""
        self.conn.execute("""
            INSERT INTO product_queue (part_number, manufacturer, package)
            VALUES (?, ?, ?)
        """, (part_number, manufacturer, package))
        self.conn.commit()
    
    def get_next_product(self, session_id: int) -> Optional[Dict]:
        """Get next pending product for processing."""
        cursor = self.conn.execute("""
            UPDATE product_queue
            SET status = 'processing', session_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = (
                SELECT id FROM product_queue
                WHERE status = 'pending'
                ORDER BY id
                LIMIT 1
            )
            RETURNING *
        """, (session_id,))
        
        row = cursor.fetchone()
        self.conn.commit()
        
        if row:
            return dict(row)
        return None
    
    def mark_completed(self, product_id: int):
        """Mark product as completed."""
        try:
            self.conn.execute("""
                UPDATE product_queue
                SET status = 'completed', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (product_id,))
            self.conn.commit()
        except sqlite3.ProgrammingError:
            # Reconnect if connection was closed
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False, timeout=30.0)
            self.conn.row_factory = sqlite3.Row
            self.conn.execute("""
                UPDATE product_queue
                SET status = 'completed', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (product_id,))
            self.conn.commit()
    
    def mark_failed(self, product_id: int, error: str):
        """Mark product as failed."""
        try:
            self.conn.execute("""
                UPDATE product_queue
                SET status = 'failed', attempts = attempts + 1, 
                    last_error = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (error, product_id))
            self.conn.commit()
        except sqlite3.ProgrammingError:
            # Reconnect if connection was closed
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False, timeout=30.0)
            self.conn.row_factory = sqlite3.Row
            self.conn.execute("""
                UPDATE product_queue
                SET status = 'failed', attempts = attempts + 1, 
                    last_error = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (error, product_id))
            self.conn.commit()
    
    def get_stats(self) -> Dict:
        """Get collection statistics."""
        cursor = self.conn.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM product_queue
        """)
        
        row = cursor.fetchone()
        return dict(row)
    
    def close(self):
        """Close database connection."""
        self.conn.close()
