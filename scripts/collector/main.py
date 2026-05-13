"""Main orchestrator for the collector."""

import asyncio
import signal
import sys
import os
import logging
from pathlib import Path
from typing import List
from datetime import datetime
from dotenv import load_dotenv

from .config import CollectorConfig
from .database import ProgressDB
from .session import BrowserSession
from .tui import CollectorTUI
from .storage import ProductStorage

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('collector.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


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
        logger.info("Starting collector...")
        self.running = True
        self.start_time = datetime.now()
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        logger.info("Signal handlers registered")
        
        # Connect to PostgreSQL
        logger.info("Connecting to PostgreSQL...")
        await self.storage.connect()
        logger.info("Connected to PostgreSQL")
        self.tui.add_log("Connected to PostgreSQL")
        
        # Initialize sessions
        logger.info(f"Initializing {self.config.sessions.count} sessions...")
        for i in range(self.config.sessions.count):
            logger.info(f"Starting session {i + 1}...")
            session = BrowserSession(i + 1, self.config)
            await session.start()
            self.sessions.append(session)
            logger.info(f"Session {i + 1} started successfully")
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
        logger.info(f"Session {session.session_id} started processing")
        
        while self.running:
            try:
                # Get next product
                product = self.db.get_next_product(session.session_id)
                
                if not product:
                    logger.info(f"Session {session.session_id}: No more products")
                    self.tui.add_log(f"Session {session.session_id}: No more products")
                    await asyncio.sleep(5)
                    continue
                
                part_number = product["part_number"]
                manufacturer = product["manufacturer"]
                
                logger.info(f"Session {session.session_id}: Processing {part_number} ({manufacturer})")
                
                self.tui.update_session(
                    session.session_id,
                    "processing",
                    f"{part_number} ({manufacturer})"
                )
                
                try:
                    # Extract data
                    logger.info(f"Session {session.session_id}: Extracting data for {part_number}")
                    result = await session.extract_product_data(part_number, manufacturer)
                    logger.info(f"Session {session.session_id}: Extraction result: {result.get('source', 'unknown')}, data: {bool(result.get('data'))}")
                    
                    if result["data"]:
                        # Save to PostgreSQL via Prisma
                        logger.info(f"Session {session.session_id}: Saving {part_number} to PostgreSQL")
                        product_id = await self.storage.save_product(
                            part_number=part_number,
                            manufacturer_name=manufacturer,
                            data=result["data"]
                        )
                        
                        if product_id:
                            self.db.mark_completed(product["id"])
                            logger.info(f"Session {session.session_id}: ✅ {part_number} saved successfully")
                            self.tui.add_log(
                                f"✅ {part_number} - Saved to DB (source: {result['source']})",
                                "SUCCESS"
                            )
                        else:
                            self.db.mark_failed(product["id"], "Failed to save to PostgreSQL")
                            logger.warning(f"Session {session.session_id}: Failed to save {part_number} to PostgreSQL")
                            self.tui.add_log(
                                f"⚠️ {part_number} - Extracted but failed to save",
                                "WARNING"
                            )
                    else:
                        self.db.mark_failed(product["id"], result["error"])
                        logger.error(f"Session {session.session_id}: ❌ {part_number} - {result['error']}")
                        self.tui.add_log(
                            f"❌ {part_number} - {result['error']}",
                            "ERROR"
                        )
                
                except Exception as e:
                    self.db.mark_failed(product["id"], str(e))
                    logger.exception(f"Session {session.session_id}: Exception processing {part_number}: {e}")
                    self.tui.add_log(
                        f"❌ {part_number} - Exception: {str(e)}",
                        "ERROR"
                    )
            
            except Exception as e:
                logger.exception(f"Session {session.session_id}: Fatal error in processing loop: {e}")
                await asyncio.sleep(5)
    
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
    # Load environment variables from .env
    load_dotenv()
    
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
