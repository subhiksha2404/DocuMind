# backend/chat_history.py - STANDALONE CHAT HISTORY
import json
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
import os

class ChatHistoryManager:
    def __init__(self, storage_path: str = "./chat_history"):
        self.storage_path = storage_path
        os.makedirs(storage_path, exist_ok=True)
    
    def _get_user_file_path(self, user_id: str) -> str:
        return os.path.join(self.storage_path, f"{user_id}_chats.json")
    
    def _load_user_chats(self, user_id: str) -> Dict[str, Any]:
        file_path = self._get_user_file_path(user_id)
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)
        return {"sessions": {}}
    
    def _save_user_chats(self, user_id: str, data: Dict[str, Any]):
        file_path = self._get_user_file_path(user_id)
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)
    
    def create_session(self, user_id: str, title: str) -> dict:
        session_id = str(uuid.uuid4())
        now = datetime.now()
        
        session = {
            "id": session_id,
            "user_id": user_id,
            "title": title,
            "messages": [],
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "is_active": True
        }
        
        user_data = self._load_user_chats(user_id)
        user_data["sessions"][session_id] = session
        self._save_user_chats(user_id, user_data)
        
        return session
    
    def add_message(self, user_id: str, session_id: str, role: str, content: str, sources: Optional[List[Dict]] = None) -> dict:
        user_data = self._load_user_chats(user_id)
        
        if session_id not in user_data["sessions"]:
            raise ValueError("Session not found")
        
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "sources": sources or []
        }
        
        session_data = user_data["sessions"][session_id]
        session_data["messages"].append(message)
        session_data["updated_at"] = datetime.now().isoformat()
        
        self._save_user_chats(user_id, user_data)
        
        return session_data
    
    def get_session(self, user_id: str, session_id: str) -> Optional[dict]:
        """Get a specific session by ID"""
        try:
            user_data = self._load_user_chats(user_id)
            
            session_data = user_data["sessions"].get(session_id)
            if session_data and session_data.get("is_active", True):
                return session_data
            return None
        except Exception as e:
            print(f"Error getting session {session_id}: {e}")
            return None
    
    def get_user_sessions(self, user_id: str) -> List[dict]:
        user_data = self._load_user_chats(user_id)
        sessions = []
        
        for session_data in user_data["sessions"].values():
            if session_data.get("is_active", True):
                sessions.append(session_data)
        
        # Sort by updated_at descending
        sessions.sort(key=lambda x: x["updated_at"], reverse=True)
        return sessions
    
    def delete_session(self, user_id: str, session_id: str) -> bool:
        user_data = self._load_user_chats(user_id)
        
        if session_id in user_data["sessions"]:
            user_data["sessions"][session_id]["is_active"] = False
            self._save_user_chats(user_id, user_data)
            return True
        return False
    
    def update_session_title(self, user_id: str, session_id: str, title: str) -> dict:
        user_data = self._load_user_chats(user_id)
        
        if session_id not in user_data["sessions"]:
            raise ValueError("Session not found")
        
        session_data = user_data["sessions"][session_id]
        session_data["title"] = title
        session_data["updated_at"] = datetime.now().isoformat()
        
        self._save_user_chats(user_id, user_data)
        
        return session_data

# Global instance
chat_history_manager = ChatHistoryManager()