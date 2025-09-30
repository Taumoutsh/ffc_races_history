"""
Authentication Database Manager for Race Cycling History App
Separate SQLite database for user authentication and session management
"""

import sqlite3
import os
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from contextlib import contextmanager
import bcrypt


class AuthDatabase:
    def __init__(self, db_path: str = "backend/database/auth.db"):
        self.db_path = db_path
        self.ensure_database_exists()
    
    def ensure_database_exists(self):
        """Create authentication database and tables if they don't exist"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with self.get_connection() as conn:
            # Read and execute auth schema
            schema_path = os.path.join(os.path.dirname(__file__), "auth_schema.sql")
            if os.path.exists(schema_path):
                with open(schema_path, 'r') as f:
                    schema_sql = f.read()
                    conn.executescript(schema_sql)
            else:
                # Fallback inline schema if file doesn't exist
                self._create_fallback_schema(conn)
    
    def _create_fallback_schema(self, conn):
        """Create basic auth schema if schema file is missing"""
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME
            );
            
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token_hash TEXT NOT NULL UNIQUE,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
            CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);
        """)
    
    @contextmanager
    def get_connection(self):
        """Get database connection with proper error handling"""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA foreign_keys = ON")
            yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            raise e
        finally:
            if conn:
                conn.close()
    
    # User Management Methods
    
    def create_user(self, username: str, password: str, is_admin: bool = False) -> Optional[Dict]:
        """Create a new user with hashed password"""
        try:
            # Hash password with bcrypt
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            with self.get_connection() as conn:
                cursor = conn.execute(
                    """INSERT INTO users (username, password_hash, is_admin) 
                       VALUES (?, ?, ?) RETURNING *""",
                    (username, password_hash, is_admin)
                )
                
                user_row = cursor.fetchone()
                if user_row:
                    conn.commit()
                    return {
                        'id': user_row['id'],
                        'username': user_row['username'],
                        'is_admin': bool(user_row['is_admin']),
                        'is_active': bool(user_row['is_active']),
                        'created_at': user_row['created_at'],
                        'last_login': user_row['last_login']
                    }
                
        except sqlite3.IntegrityError:
            # Username already exists
            return None
        except Exception as e:
            print(f"Error creating user: {e}")
            return None
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict]:
        """Authenticate user credentials and return user data if valid"""
        try:
            with self.get_connection() as conn:
                cursor = conn.execute(
                    "SELECT * FROM users WHERE username = ? AND is_active = 1",
                    (username,)
                )
                user_row = cursor.fetchone()
                
                if user_row and bcrypt.checkpw(password.encode('utf-8'), user_row['password_hash'].encode('utf-8')):
                    # Update last login time
                    conn.execute(
                        "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
                        (user_row['id'],)
                    )
                    conn.commit()
                    
                    return {
                        'id': user_row['id'],
                        'username': user_row['username'],
                        'is_admin': bool(user_row['is_admin']),
                        'is_active': bool(user_row['is_active']),
                        'created_at': user_row['created_at'],
                        'last_login': datetime.now().isoformat()
                    }
                
                return None
                
        except Exception as e:
            print(f"Error authenticating user: {e}")
            return None
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """Get user by ID"""
        try:
            with self.get_connection() as conn:
                cursor = conn.execute(
                    "SELECT * FROM users WHERE id = ?",
                    (user_id,)
                )
                user_row = cursor.fetchone()
                
                if user_row:
                    return {
                        'id': user_row['id'],
                        'username': user_row['username'],
                        'is_admin': bool(user_row['is_admin']),
                        'is_active': bool(user_row['is_active']),
                        'created_at': user_row['created_at'],
                        'last_login': user_row['last_login']
                    }
                
                return None
                
        except Exception as e:
            print(f"Error getting user by ID: {e}")
            return None
    
    def get_all_users(self) -> List[Dict]:
        """Get all users (admin only)"""
        try:
            with self.get_connection() as conn:
                cursor = conn.execute(
                    "SELECT id, username, is_admin, is_active, created_at, last_login FROM users ORDER BY created_at"
                )
                users = []
                for row in cursor.fetchall():
                    users.append({
                        'id': row['id'],
                        'username': row['username'],
                        'is_admin': bool(row['is_admin']),
                        'is_active': bool(row['is_active']),
                        'created_at': row['created_at'],
                        'last_login': row['last_login']
                    })
                return users
        except Exception as e:
            print(f"Error getting all users: {e}")
            return []
    
    def update_user(self, user_id: int, **kwargs) -> bool:
        """Update user fields"""
        try:
            valid_fields = ['is_admin', 'is_active']
            updates = []
            values = []
            
            for field, value in kwargs.items():
                if field in valid_fields:
                    updates.append(f"{field} = ?")
                    values.append(value)
            
            if not updates:
                return False
            
            values.append(user_id)
            
            with self.get_connection() as conn:
                conn.execute(
                    f"UPDATE users SET {', '.join(updates)} WHERE id = ?",
                    values
                )
                conn.commit()
                return conn.total_changes > 0
                
        except Exception as e:
            print(f"Error updating user: {e}")
            return False
    
    def delete_user(self, user_id: int) -> bool:
        """Delete user and all associated sessions"""
        try:
            with self.get_connection() as conn:
                # Delete user (sessions will be deleted by CASCADE)
                conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
                conn.commit()
                return conn.total_changes > 0
                
        except Exception as e:
            print(f"Error deleting user: {e}")
            return False
    
    # Session Management Methods
    
    def create_session(self, user_id: int, expires_hours: int = 24) -> str:
        """Create a new session token for the user"""
        try:
            # Generate secure random token
            token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            
            # Calculate expiration time
            expires_at = datetime.now() + timedelta(hours=expires_hours)
            
            with self.get_connection() as conn:
                # Clean up expired sessions first
                self.cleanup_expired_sessions()
                
                # Insert new session
                conn.execute(
                    """INSERT INTO user_sessions (user_id, token_hash, expires_at) 
                       VALUES (?, ?, ?)""",
                    (user_id, token_hash, expires_at.isoformat())
                )
                conn.commit()
                
                return token
                
        except Exception as e:
            print(f"Error creating session: {e}")
            return None
    
    def validate_session(self, token: str) -> Optional[Dict]:
        """Validate session token and return user data if valid"""
        try:
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            
            with self.get_connection() as conn:
                # Use the active_sessions view if it exists, otherwise use JOIN
                cursor = conn.execute(
                    """SELECT u.id, u.username, u.is_admin, u.is_active, s.id as session_id
                       FROM user_sessions s
                       JOIN users u ON s.user_id = u.id
                       WHERE s.token_hash = ? 
                         AND s.expires_at > datetime('now')
                         AND u.is_active = 1""",
                    (token_hash,)
                )
                
                session_row = cursor.fetchone()
                
                if session_row:
                    # Update last_used timestamp
                    conn.execute(
                        "UPDATE user_sessions SET last_used = CURRENT_TIMESTAMP WHERE id = ?",
                        (session_row['session_id'],)
                    )
                    conn.commit()
                    
                    return {
                        'id': session_row['id'],
                        'username': session_row['username'],
                        'is_admin': bool(session_row['is_admin']),
                        'is_active': bool(session_row['is_active'])
                    }
                
                return None
                
        except Exception as e:
            print(f"Error validating session: {e}")
            return None
    
    def revoke_session(self, token: str) -> bool:
        """Revoke a specific session token"""
        try:
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            
            with self.get_connection() as conn:
                conn.execute(
                    "DELETE FROM user_sessions WHERE token_hash = ?",
                    (token_hash,)
                )
                conn.commit()
                return conn.total_changes > 0
                
        except Exception as e:
            print(f"Error revoking session: {e}")
            return False
    
    def revoke_all_user_sessions(self, user_id: int) -> bool:
        """Revoke all sessions for a specific user"""
        try:
            with self.get_connection() as conn:
                conn.execute(
                    "DELETE FROM user_sessions WHERE user_id = ?",
                    (user_id,)
                )
                conn.commit()
                return True
                
        except Exception as e:
            print(f"Error revoking user sessions: {e}")
            return False
    
    def cleanup_expired_sessions(self) -> int:
        """Remove expired session tokens"""
        try:
            with self.get_connection() as conn:
                cursor = conn.execute(
                    "DELETE FROM user_sessions WHERE expires_at <= datetime('now')"
                )
                conn.commit()
                return cursor.rowcount
                
        except Exception as e:
            print(f"Error cleaning up expired sessions: {e}")
            return 0
    
    # Admin Messages Methods

    def create_message(self, title: str, content: str, message_type: str, created_by: int) -> Optional[Dict]:
        """Create a new admin message"""
        try:
            with self.get_connection() as conn:
                cursor = conn.execute(
                    """INSERT INTO admin_messages (title, content, message_type, created_by)
                       VALUES (?, ?, ?, ?) RETURNING *""",
                    (title, content, message_type, created_by)
                )

                message_row = cursor.fetchone()
                if message_row:
                    conn.commit()
                    return {
                        'id': message_row['id'],
                        'title': message_row['title'],
                        'content': message_row['content'],
                        'message_type': message_row['message_type'],
                        'is_active': bool(message_row['is_active']),
                        'created_by': message_row['created_by'],
                        'created_at': message_row['created_at'],
                        'updated_at': message_row['updated_at']
                    }

        except Exception as e:
            print(f"Error creating message: {e}")
            return None

    def get_active_messages(self) -> List[Dict]:
        """Get all active admin messages"""
        try:
            with self.get_connection() as conn:
                cursor = conn.execute(
                    """SELECT m.*, u.username as created_by_username
                       FROM admin_messages m
                       LEFT JOIN users u ON m.created_by = u.id
                       WHERE m.is_active = 1
                       ORDER BY m.created_at DESC"""
                )
                messages = []
                for row in cursor.fetchall():
                    messages.append({
                        'id': row['id'],
                        'title': row['title'],
                        'content': row['content'],
                        'message_type': row['message_type'],
                        'is_active': bool(row['is_active']),
                        'created_by': row['created_by'],
                        'created_by_username': row['created_by_username'],
                        'created_at': row['created_at'],
                        'updated_at': row['updated_at']
                    })
                return messages
        except Exception as e:
            print(f"Error getting active messages: {e}")
            return []

    def get_all_messages(self) -> List[Dict]:
        """Get all admin messages (admin only)"""
        try:
            with self.get_connection() as conn:
                cursor = conn.execute(
                    """SELECT m.*, u.username as created_by_username
                       FROM admin_messages m
                       LEFT JOIN users u ON m.created_by = u.id
                       ORDER BY m.created_at DESC"""
                )
                messages = []
                for row in cursor.fetchall():
                    messages.append({
                        'id': row['id'],
                        'title': row['title'],
                        'content': row['content'],
                        'message_type': row['message_type'],
                        'is_active': bool(row['is_active']),
                        'created_by': row['created_by'],
                        'created_by_username': row['created_by_username'],
                        'created_at': row['created_at'],
                        'updated_at': row['updated_at']
                    })
                return messages
        except Exception as e:
            print(f"Error getting all messages: {e}")
            return []

    def update_message(self, message_id: int, **kwargs) -> bool:
        """Update message fields"""
        try:
            valid_fields = ['title', 'content', 'message_type', 'is_active']
            updates = []
            values = []

            for field, value in kwargs.items():
                if field in valid_fields:
                    updates.append(f"{field} = ?")
                    values.append(value)

            if not updates:
                return False

            values.append(message_id)

            with self.get_connection() as conn:
                conn.execute(
                    f"UPDATE admin_messages SET {', '.join(updates)} WHERE id = ?",
                    values
                )
                conn.commit()
                return conn.total_changes > 0

        except Exception as e:
            print(f"Error updating message: {e}")
            return False

    def delete_message(self, message_id: int) -> bool:
        """Delete admin message"""
        try:
            with self.get_connection() as conn:
                conn.execute("DELETE FROM admin_messages WHERE id = ?", (message_id,))
                conn.commit()
                return conn.total_changes > 0

        except Exception as e:
            print(f"Error deleting message: {e}")
            return False

    # Database Health and Stats

    def get_auth_stats(self) -> Dict:
        """Get authentication database statistics"""
        try:
            with self.get_connection() as conn:
                stats = {}

                # User statistics
                cursor = conn.execute("SELECT COUNT(*) as total FROM users")
                stats['total_users'] = cursor.fetchone()['total']

                cursor = conn.execute("SELECT COUNT(*) as active FROM users WHERE is_active = 1")
                stats['active_users'] = cursor.fetchone()['active']

                cursor = conn.execute("SELECT COUNT(*) as admins FROM users WHERE is_admin = 1")
                stats['admin_users'] = cursor.fetchone()['admins']

                # Session statistics
                cursor = conn.execute("SELECT COUNT(*) as total FROM user_sessions")
                stats['total_sessions'] = cursor.fetchone()['total']

                cursor = conn.execute(
                    "SELECT COUNT(*) as active FROM user_sessions WHERE expires_at > datetime('now')"
                )
                stats['active_sessions'] = cursor.fetchone()['active']

                # Message statistics
                cursor = conn.execute("SELECT COUNT(*) as total FROM admin_messages")
                stats['total_messages'] = cursor.fetchone()['total']

                cursor = conn.execute("SELECT COUNT(*) as active FROM admin_messages WHERE is_active = 1")
                stats['active_messages'] = cursor.fetchone()['active']

                return stats

        except Exception as e:
            print(f"Error getting auth stats: {e}")
            return {}

    # Followed Cyclists Management Methods

    def follow_cyclist(self, user_id: int, cyclist_uci_id: str) -> bool:
        """Add a cyclist to user's follow list"""
        try:
            with self.get_connection() as conn:
                conn.execute(
                    "INSERT OR IGNORE INTO followed_cyclists (user_id, cyclist_uci_id) VALUES (?, ?)",
                    (user_id, cyclist_uci_id)
                )
                conn.commit()
                return conn.total_changes > 0
        except Exception as e:
            print(f"Error following cyclist: {e}")
            return False

    def unfollow_cyclist(self, user_id: int, cyclist_uci_id: str) -> bool:
        """Remove a cyclist from user's follow list"""
        try:
            with self.get_connection() as conn:
                conn.execute(
                    "DELETE FROM followed_cyclists WHERE user_id = ? AND cyclist_uci_id = ?",
                    (user_id, cyclist_uci_id)
                )
                conn.commit()
                return conn.total_changes > 0
        except Exception as e:
            print(f"Error unfollowing cyclist: {e}")
            return False

    def get_followed_cyclists(self, user_id: int) -> List[str]:
        """Get list of cyclist UCI IDs that the user follows"""
        try:
            with self.get_connection() as conn:
                cursor = conn.execute(
                    "SELECT cyclist_uci_id FROM followed_cyclists WHERE user_id = ? ORDER BY created_at DESC",
                    (user_id,)
                )
                return [row['cyclist_uci_id'] for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error getting followed cyclists: {e}")
            return []

    def get_followed_cyclists_with_check_date(self, user_id: int) -> List[dict]:
        """Get list of followed cyclists with their last check dates"""
        try:
            with self.get_connection() as conn:
                cursor = conn.execute(
                    "SELECT cyclist_uci_id, last_check_date FROM followed_cyclists WHERE user_id = ? ORDER BY created_at DESC",
                    (user_id,)
                )
                return [{'cyclist_uci_id': row['cyclist_uci_id'], 'last_check_date': row['last_check_date']}
                        for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error getting followed cyclists with check dates: {e}")
            return []

    def is_cyclist_followed(self, user_id: int, cyclist_uci_id: str) -> bool:
        """Check if a user follows a specific cyclist"""
        try:
            with self.get_connection() as conn:
                cursor = conn.execute(
                    "SELECT 1 FROM followed_cyclists WHERE user_id = ? AND cyclist_uci_id = ?",
                    (user_id, cyclist_uci_id)
                )
                return cursor.fetchone() is not None
        except Exception as e:
            print(f"Error checking if cyclist is followed: {e}")
            return False

    def update_last_check_date(self, user_id: int, cyclist_uci_id: str) -> bool:
        """Update last_check_date when user views a followed cyclist's profile"""
        try:
            with self.get_connection() as conn:
                cursor = conn.execute(
                    "UPDATE followed_cyclists SET last_check_date = CURRENT_TIMESTAMP WHERE user_id = ? AND cyclist_uci_id = ?",
                    (user_id, cyclist_uci_id)
                )
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Error updating last check date: {e}")
            return False