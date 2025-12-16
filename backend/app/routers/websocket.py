"""
WebSocket Gateway Router
Handles realtime presence, PTT floor state, and thread/event updates.
"""

import json
import asyncio
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

router = APIRouter(tags=["websocket"])


class ConnectionManager:
    """Manages WebSocket connections and broadcasts."""

    def __init__(self):
        # room_id -> set of websockets
        self.rooms: Dict[str, Set[WebSocket]] = {}
        # room_id -> user_id (who holds the floor)
        self.ptt_floor: Dict[str, str | None] = {}
        # room_id -> set of user_ids (present users)
        self.presence: Dict[str, Set[str]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
            self.ptt_floor[room_id] = None
            self.presence[room_id] = set()

        self.rooms[room_id].add(websocket)
        self.presence[room_id].add(user_id)

        # Notify others of join
        await self.broadcast(room_id, {
            "type": "presence",
            "action": "join",
            "user_id": user_id,
            "users": list(self.presence[room_id])
        }, exclude=websocket)

        # Send current state to new connection
        await websocket.send_json({
            "type": "state",
            "ptt_floor": self.ptt_floor[room_id],
            "users": list(self.presence[room_id])
        })

    def disconnect(self, websocket: WebSocket, room_id: str, user_id: str):
        if room_id in self.rooms:
            self.rooms[room_id].discard(websocket)
            self.presence[room_id].discard(user_id)

            # Release PTT floor if disconnecting user held it
            if self.ptt_floor.get(room_id) == user_id:
                self.ptt_floor[room_id] = None

            # Clean up empty rooms
            if not self.rooms[room_id]:
                del self.rooms[room_id]
                del self.ptt_floor[room_id]
                del self.presence[room_id]

    async def broadcast(self, room_id: str, message: dict, exclude: WebSocket = None):
        if room_id not in self.rooms:
            return

        disconnected = set()
        for ws in self.rooms[room_id]:
            if ws != exclude:
                try:
                    await ws.send_json(message)
                except Exception:
                    disconnected.add(ws)

        # Clean up disconnected sockets
        for ws in disconnected:
            self.rooms[room_id].discard(ws)

    async def request_floor(self, room_id: str, user_id: str) -> bool:
        """Request PTT floor. Returns True if granted."""
        if room_id not in self.ptt_floor:
            return False

        if self.ptt_floor[room_id] is None:
            self.ptt_floor[room_id] = user_id
            await self.broadcast(room_id, {
                "type": "ptt",
                "action": "granted",
                "user_id": user_id
            })
            return True
        return False

    async def release_floor(self, room_id: str, user_id: str):
        """Release PTT floor."""
        if room_id in self.ptt_floor and self.ptt_floor[room_id] == user_id:
            self.ptt_floor[room_id] = None
            await self.broadcast(room_id, {
                "type": "ptt",
                "action": "released",
                "user_id": user_id
            })


manager = ConnectionManager()


@router.websocket("/ws/{room_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, user_id: str):
    """
    WebSocket endpoint for realtime updates.

    Messages:
    - {"type": "ptt", "action": "request"} - Request PTT floor
    - {"type": "ptt", "action": "release"} - Release PTT floor
    - {"type": "message", "body": "..."} - Send message to room
    """
    await manager.connect(websocket, room_id, user_id)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "ptt":
                action = data.get("action")
                if action == "request":
                    granted = await manager.request_floor(room_id, user_id)
                    if not granted:
                        await websocket.send_json({
                            "type": "ptt",
                            "action": "denied",
                            "holder": manager.ptt_floor.get(room_id)
                        })
                elif action == "release":
                    await manager.release_floor(room_id, user_id)

            elif msg_type == "message":
                # Broadcast message to room
                await manager.broadcast(room_id, {
                    "type": "message",
                    "user_id": user_id,
                    "body": data.get("body", ""),
                    "channel": data.get("channel")
                })

            elif msg_type == "event":
                # Broadcast event update to room
                await manager.broadcast(room_id, {
                    "type": "event",
                    "action": data.get("action"),
                    "event": data.get("event")
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id, user_id)
        await manager.broadcast(room_id, {
            "type": "presence",
            "action": "leave",
            "user_id": user_id,
            "users": list(manager.presence.get(room_id, []))
        })
    except Exception:
        manager.disconnect(websocket, room_id, user_id)
