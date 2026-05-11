"""Main orchestrator for the collector."""

import asyncio
import signal
import sys
from pathlib import Path
from typing import List
from datetime import datetime

from .config import CollectorConfig
from .database import ProgressDB
from .session import BrowserSession
from .tui import CollectorTUI
from .storage import ProductStorage


class Collector:
    """Main collector orchestrator."""
    
    def __init__(self, config: CollectorConfig):
        """Initialize collector."""
        self.config = config
        self.db = ProgressDB(config.database.sqlite)
        self.storage = ProductStorage()
        self.tui = CollectorTUI()
        self.sessions: List[BrowserSession] = []
        self.running = False
        self.start_time = None
    
    async def start(self):
        """Start collection process."""
        self.running = True
        self.start_time = datetime.now()
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        # Connect to PostgreSQL
        await self.storage.connect()
        self.tui.add_log("Connected to PostgreSQL")
        
        # Initialize sessions
        for i in range(self.config.sessions.count):
            session = BrowserSession(i + 1, self.config)
            await session.start()
            self.sessions.append(session)
            self.tui.add_log(f"Session {i + 1} started")
        
        # Start processing
        tasks = [
            self._process_session(session)
            for session in self.sessions
        ]
        
        # Add stats updater
        tasks.append(self._update_stats())
        
        # Run all tasks
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _process_session(self, session: BrowserSession):
        """Process products in a session."""
        while self.running:
            # Get next product
            product = self.db.get_next_product(session.session_id)
            
            if not product:
                self.tui.add_log(f"Session {session.session_id}: No more products")
                await asyncio.sleep(5)
                continue
            
            part_number = product["part_number"]
            manufacturer = product["manufacturer"]
            
            self.tui.update_session(
                session.session_id,
                "processing",
                f"{part_number} ({manufacturer})"
            )
            
            try:
                # Extract data
                result = await session.extract_product_data(part_number, manufacturer)
                
                if result["data"]:
                    # Save to PostgreSQL via Prisma
                    product_id = await self.storage.save_product(
                        part_number=part_number,
                        manufacturer_name=manufacturer,
                        data=result["data"]
                    )
                    
                    if product_id:
                        self.db.mark_completed(product["id"])
                        self.tui.add_log(
                            f"✅ {part_number} - Saved to DB (source: {result['source']})",
                            "SUCCESS"
                        )
                    else:
                        self.db.mark_failed(product["id"], "Failed to save to PostgreSQL")
                        self.tui.add_log(
                            f"⚠️ {part_number} - Extracted but failed to save",
                            "WARNING"
                        )
                else:
                    self.db.mark_failed(product["id"], result["error"])
                    self.tui.add_log(
                        f"❌ {part_number} - {result['error']}",
                        "ERROR"
                    )
            
            except Exception as e:
                self.db.mark_failed(product["id"], str(e))
                self.tui.add_log(
                    f"❌ {part_number} - Exception: {str(e)}",
                    "ERROR"
                )
    
    async def _update_stats(self):
        """Update statistics periodically."""
        while self.running:
            stats = self.db.get_stats()
            
            # Calculate speed
            if self.start_time:
                elapsed_hours = (datetime.now() - self.start_time).total_seconds() / 3600
                if elapsed_hours > 0:
                    stats["speed"] = stats["completed"] / elapsed_hours
            
            self.tui.update_stats(stats)
            
            # Render TUI
            self.tui.console.clear()
            self.tui.console.print(self.tui.render())
            
            await asyncio.sleep(2)
    
    async def stop(self):
        """Stop collection process."""
        self.running = False
        self.tui.add_log("Stopping collector...")
        
        # Close all sessions
        for session in self.sessions:
            await session.close()
            self.tui.add_log(f"Session {session.session_id} closed")
        
        # Disconnect from PostgreSQL
        await self.storage.disconnect()
        self.tui.add_log("Disconnected from PostgreSQL")
        
        # Close database
        self.db.close()
        self.tui.add_log("Database closed")
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals."""
        print("\nReceived shutdown signal, stopping...")
        asyncio.create_task(self.stop())


async def main():
    """Main entry point."""
    # Load config
    config_path = sys.argv[1] if len(sys.argv) > 1 else None
    
    if config_path and Path(config_path).exists():
        config = CollectorConfig.from_yaml(config_path)
    else:
        config = CollectorConfig.default()
    
    # Create and start collector
    collector = Collector(config)
    
    try:
        await collector.start()
    except KeyboardInterrupt:
        await collector.stop()
    except Exception as e:
        print(f"Fatal error: {e}")
        await collector.stop()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
