"""Rich TUI interface for monitoring collector."""

from rich.console import Console
from rich.layout import Layout
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, BarColumn, TextColumn
from rich.table import Table
from rich.live import Live
from rich.text import Text
from datetime import datetime
from typing import Dict, List


class CollectorTUI:
    """Terminal UI for collector monitoring."""
    
    def __init__(self):
        """Initialize TUI."""
        self.console = Console()
        self.layout = Layout()
        self.stats = {
            "total": 0,
            "completed": 0,
            "failed": 0,
            "speed": 0,
            "eta": 0
        }
        self.sessions = {}
        self.recent_logs = []
        
        self._setup_layout()
    
    def _setup_layout(self):
        """Setup layout structure."""
        self.layout.split(
            Layout(name="header", size=3),
            Layout(name="body"),
            Layout(name="footer", size=3)
        )
        
        self.layout["body"].split_row(
            Layout(name="progress", ratio=2),
            Layout(name="logs", ratio=1)
        )
    
    def update_stats(self, stats: Dict):
        """Update statistics."""
        self.stats.update(stats)
    
    def update_session(self, session_id: int, status: str, current_product: str):
        """Update session status."""
        self.sessions[session_id] = {
            "status": status,
            "product": current_product,
            "updated": datetime.now()
        }
    
    def add_log(self, message: str, level: str = "INFO"):
        """Add log message."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.recent_logs.append(f"[{timestamp}] {level}: {message}")
        if len(self.recent_logs) > 20:
            self.recent_logs.pop(0)
    
    def render(self) -> Layout:
        """Render TUI layout."""
        # Header
        self.layout["header"].update(
            Panel(
                Text("🤖 Product Data Collector v1.0", style="bold cyan"),
                subtitle="[P]ause [Q]uit"
            )
        )
        
        # Progress section
        progress_table = Table.grid(padding=1)
        progress_table.add_column(style="cyan", justify="left")
        progress_table.add_column(style="magenta")
        
        # Overall progress
        completed = self.stats.get("completed", 0)
        total = self.stats.get("total", 1)
        percentage = (completed / total * 100) if total > 0 else 0
        
        progress_table.add_row("📊 Overall Progress", f"{completed}/{total} ({percentage:.1f}%)")
        progress_table.add_row("⏱️  Speed", f"{self.stats.get('speed', 0):.1f} products/hour")
        progress_table.add_row("✅ Success", str(completed))
        progress_table.add_row("❌ Failed", str(self.stats.get("failed", 0)))
        
        # Sessions
        sessions_table = Table(title="🔄 Active Sessions", show_header=True)
        sessions_table.add_column("ID", style="cyan")
        sessions_table.add_column("Status", style="green")
        sessions_table.add_column("Current Product", style="yellow")
        
        for session_id, session_data in self.sessions.items():
            sessions_table.add_row(
                str(session_id),
                session_data["status"],
                session_data["product"]
            )
        
        self.layout["progress"].update(
            Panel(
                Table.grid(
                    progress_table,
                    sessions_table,
                    padding=1
                ),
                title="Progress"
            )
        )
        
        # Logs section
        logs_text = "\n".join(self.recent_logs[-15:])
        self.layout["logs"].update(
            Panel(logs_text, title="📝 Recent Activity")
        )
        
        # Footer
        self.layout["footer"].update(
            Panel(
                Text("Press Ctrl+C to stop", style="dim"),
                style="dim"
            )
        )
        
        return self.layout
