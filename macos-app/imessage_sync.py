#!/usr/bin/env python3
"""
WickedCRM - macOS iMessage Sync Service
Syncs iMessages from Mac to WickedCRM backend.

Requirements:
- macOS with Messages app
- Full Disk Access permission for this script
- Python 3.9+

Install:
    pip3 install requests watchdog

Usage:
    python3 imessage_sync.py

Grant Full Disk Access:
    System Preferences > Security & Privacy > Privacy > Full Disk Access
    Add Terminal or Python
"""

import sqlite3
import os
import time
import json
import subprocess
import requests
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any

# Configuration
BACKEND_URL = os.environ.get("WICKEDCRM_URL", "http://localhost:8000")
API_KEY = os.environ.get("WICKEDCRM_API_KEY", "")
SYNC_INTERVAL = 5  # seconds
MESSAGES_DB = os.path.expanduser("~/Library/Messages/chat.db")


class iMessageSync:
    """Sync iMessages to WickedCRM backend."""

    def __init__(self, backend_url: str = BACKEND_URL):
        self.backend_url = backend_url
        self.last_message_id = self._load_last_id()
        self.db_path = MESSAGES_DB

    def _load_last_id(self) -> int:
        """Load last synced message ID from cache."""
        cache_file = os.path.expanduser("~/.wickedcrm_sync_cache")
        try:
            if os.path.exists(cache_file):
                with open(cache_file, "r") as f:
                    return int(f.read().strip())
        except:
            pass
        return 0

    def _save_last_id(self, msg_id: int):
        """Save last synced message ID."""
        cache_file = os.path.expanduser("~/.wickedcrm_sync_cache")
        with open(cache_file, "w") as f:
            f.write(str(msg_id))
        self.last_message_id = msg_id

    def check_permissions(self) -> bool:
        """Check if we have access to Messages database."""
        if not os.path.exists(self.db_path):
            print(f"❌ Messages database not found at {self.db_path}")
            return False

        try:
            conn = sqlite3.connect(self.db_path)
            conn.execute("SELECT 1 FROM message LIMIT 1")
            conn.close()
            print("✅ Messages database accessible")
            return True
        except sqlite3.OperationalError as e:
            print(f"❌ Cannot access Messages database: {e}")
            print("\n📋 Grant Full Disk Access:")
            print("   1. Open System Preferences > Security & Privacy")
            print("   2. Go to Privacy > Full Disk Access")
            print("   3. Add Terminal (or your Python app)")
            return False

    def get_new_messages(self) -> List[Dict[str, Any]]:
        """Fetch new messages from iMessage database."""
        messages = []

        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # Query for new messages
            query = """
                SELECT
                    m.ROWID as id,
                    m.text,
                    m.is_from_me,
                    m.date / 1000000000 + 978307200 as timestamp,
                    m.service,
                    h.id as phone_number,
                    h.uncanonicalized_id as contact_name,
                    c.chat_identifier,
                    c.display_name as chat_name
                FROM message m
                LEFT JOIN handle h ON m.handle_id = h.ROWID
                LEFT JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
                LEFT JOIN chat c ON cmj.chat_id = c.ROWID
                WHERE m.ROWID > ?
                ORDER BY m.ROWID ASC
                LIMIT 100
            """

            cursor.execute(query, (self.last_message_id,))

            for row in cursor.fetchall():
                if row["text"]:  # Skip empty messages
                    messages.append({
                        "id": row["id"],
                        "body": row["text"],
                        "direction": "outbound" if row["is_from_me"] else "inbound",
                        "timestamp": datetime.fromtimestamp(row["timestamp"]).isoformat(),
                        "service": row["service"] or "iMessage",
                        "phone_number": row["phone_number"],
                        "contact_name": row["contact_name"] or row["chat_name"],
                        "chat_id": row["chat_identifier"],
                    })

            conn.close()

        except Exception as e:
            print(f"Error reading messages: {e}")

        return messages

    def sync_message(self, message: Dict[str, Any]) -> bool:
        """Send message to WickedCRM backend."""
        try:
            payload = {
                "body": message["body"],
                "channel": "imessage" if message["service"] == "iMessage" else "sms",
                "direction": message["direction"],
                "external_id": str(message["id"]),
                "contact_phone": message["phone_number"],
                "contact_name": message["contact_name"],
                "received_at": message["timestamp"],
            }

            response = requests.post(
                f"{self.backend_url}/api/messages/sync",
                json=payload,
                headers={"Authorization": f"Bearer {API_KEY}"},
                timeout=10
            )

            if response.status_code in [200, 201]:
                return True
            else:
                print(f"Sync failed: {response.status_code} - {response.text}")
                return False

        except requests.RequestException as e:
            print(f"Network error: {e}")
            return False

    def send_imessage(self, phone: str, message: str) -> bool:
        """Send iMessage via AppleScript."""
        script = f'''
        tell application "Messages"
            set targetService to 1st service whose service type = iMessage
            set targetBuddy to buddy "{phone}" of targetService
            send "{message}" to targetBuddy
        end tell
        '''

        try:
            subprocess.run(
                ["osascript", "-e", script],
                check=True,
                capture_output=True
            )
            print(f"✅ Sent iMessage to {phone}")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to send iMessage: {e}")
            return False

    def send_sms(self, phone: str, message: str) -> bool:
        """Send SMS via AppleScript (if iPhone connected)."""
        script = f'''
        tell application "Messages"
            set targetService to 1st service whose service type = SMS
            set targetBuddy to buddy "{phone}" of targetService
            send "{message}" to targetBuddy
        end tell
        '''

        try:
            subprocess.run(
                ["osascript", "-e", script],
                check=True,
                capture_output=True
            )
            print(f"✅ Sent SMS to {phone}")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to send SMS: {e}")
            return False

    def run_sync_loop(self):
        """Main sync loop."""
        print("=" * 50)
        print("  WickedCRM iMessage Sync Service")
        print("=" * 50)
        print(f"Backend: {self.backend_url}")
        print(f"Database: {self.db_path}")
        print(f"Last synced ID: {self.last_message_id}")
        print()

        if not self.check_permissions():
            return

        print(f"\n🔄 Syncing every {SYNC_INTERVAL} seconds...")
        print("   Press Ctrl+C to stop\n")

        try:
            while True:
                messages = self.get_new_messages()

                if messages:
                    print(f"📬 Found {len(messages)} new message(s)")

                    for msg in messages:
                        direction = "→" if msg["direction"] == "outbound" else "←"
                        contact = msg["contact_name"] or msg["phone_number"] or "Unknown"
                        preview = msg["body"][:50] + "..." if len(msg["body"]) > 50 else msg["body"]

                        print(f"   {direction} [{contact}] {preview}")

                        if self.sync_message(msg):
                            self._save_last_id(msg["id"])

                time.sleep(SYNC_INTERVAL)

        except KeyboardInterrupt:
            print("\n\n👋 Sync service stopped")


class MessageListener:
    """Listen for outgoing message requests from backend."""

    def __init__(self, backend_url: str = BACKEND_URL):
        self.backend_url = backend_url
        self.sync = iMessageSync(backend_url)

    def poll_outgoing(self):
        """Poll backend for messages to send."""
        try:
            response = requests.get(
                f"{self.backend_url}/api/messages/outgoing",
                headers={"Authorization": f"Bearer {API_KEY}"},
                timeout=10
            )

            if response.status_code == 200:
                messages = response.json()
                for msg in messages:
                    if msg.get("channel") == "imessage":
                        self.sync.send_imessage(msg["to"], msg["body"])
                    else:
                        self.sync.send_sms(msg["to"], msg["body"])

                    # Mark as sent
                    requests.post(
                        f"{self.backend_url}/api/messages/{msg['id']}/sent",
                        headers={"Authorization": f"Bearer {API_KEY}"}
                    )

        except Exception as e:
            pass  # Silently fail polling


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="WickedCRM iMessage Sync")
    parser.add_argument("--url", default=BACKEND_URL, help="Backend URL")
    parser.add_argument("--send", nargs=2, metavar=("PHONE", "MESSAGE"), help="Send a message")
    parser.add_argument("--test", action="store_true", help="Test database access")

    args = parser.parse_args()

    sync = iMessageSync(args.url)

    if args.test:
        sync.check_permissions()
    elif args.send:
        phone, message = args.send
        sync.send_imessage(phone, message)
    else:
        sync.run_sync_loop()
