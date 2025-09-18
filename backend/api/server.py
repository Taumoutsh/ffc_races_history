#!/usr/bin/env python3
"""
REST API Server for Race Cycling History App
Serves data from SQLite database via HTTP endpoints
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys
import re
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from functools import wraps
import threading
import time
import hashlib
import json

# Add project root to path for backend imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.database.models import CyclingDatabase
from backend.database.auth_models import AuthDatabase

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize databases
DB_PATH = os.environ.get('DB_PATH', 'backend/database/cycling_data.db')
AUTH_DB_PATH = os.environ.get('AUTH_DB_PATH', 'backend/database/auth.db')
db = CyclingDatabase(DB_PATH)
auth_db = AuthDatabase(AUTH_DB_PATH)

# Database monitoring and memoization system
class DatabaseMonitor:
    def __init__(self, db_path, db_instance):
        self.db_path = db_path
        self.db = db_instance
        self.current_hash = None
        self.cached_races_data = None
        self.cached_json_response = None
        self.cached_timestamp = None
        self.lock = threading.Lock()
        self.monitoring = True
        self.monitor_thread = None

    def get_database_hash(self):
        """Calculate hash of the database file"""
        try:
            if not os.path.exists(self.db_path):
                return None
            with open(self.db_path, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except Exception:
            return None

    def update_cache(self):
        """Update the cached races data and pre-serialize JSON response"""
        try:
            races_data = self.db.get_races_data()
            # Pre-serialize the JSON response to avoid repeated serialization
            json_response = json.dumps(races_data, separators=(',', ':'))

            with self.lock:
                self.cached_races_data = races_data
                self.cached_json_response = json_response
                self.cached_timestamp = datetime.now()
                self.current_hash = self.get_database_hash()
            total_races = len(races_data.get('races', {}))
            print(f"Cache updated at {self.cached_timestamp} with {total_races} races")
        except Exception as e:
            print(f"Error updating cache: {e}")

    def get_cached_races(self):
        """Get cached races data and JSON response"""
        with self.lock:
            return self.cached_races_data, self.cached_json_response, self.cached_timestamp

    def monitor_database(self):
        """Background thread to monitor database changes"""
        while self.monitoring:
            try:
                new_hash = self.get_database_hash()
                if new_hash and new_hash != self.current_hash:
                    print(f"Database change detected, updating cache...")
                    self.update_cache()
                time.sleep(5)  # Check every 5 seconds
            except Exception as e:
                print(f"Error in database monitoring: {e}")
                time.sleep(10)  # Wait longer if there's an error

    def start_monitoring(self):
        """Start the background monitoring thread"""
        # Initial cache update
        self.update_cache()

        # Start monitoring thread
        self.monitor_thread = threading.Thread(target=self.monitor_database)
        self.monitor_thread.start()
        print("Database monitoring started")

    def stop_monitoring(self):
        """Stop the background monitoring"""
        self.monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=2)

# Initialize database monitor
db_monitor = DatabaseMonitor(DB_PATH, db)


# Authentication middleware
def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        user = auth_db.validate_session(token)
        
        if not user:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        request.current_user = user
        return f(*args, **kwargs)
    return decorated_function


def require_admin(f):
    """Decorator to require admin privileges"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not getattr(request, 'current_user', None) or not request.current_user.get('is_admin'):
            return jsonify({'error': 'Admin privileges required'}), 403
        return f(*args, **kwargs)
    return decorated_function


# Authentication routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        user = auth_db.authenticate_user(username, password)
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        token = auth_db.create_session(user['id'], expires_hours=24)
        
        return jsonify({
            'user': user,
            'token': token,
            'expires_in': 24 * 60 * 60  # 24 hours in seconds
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/logout', methods=['POST'])
@require_auth
def logout():
    """User logout endpoint"""
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        auth_db.revoke_session(token)
    
    return jsonify({'message': 'Logged out successfully'})


@app.route('/api/auth/verify', methods=['GET'])
@require_auth
def verify_token():
    """Verify token and return user info"""
    return jsonify({'user': request.current_user})


@app.route('/api/auth/users', methods=['GET'])
@require_auth
@require_admin
def get_users():
    """Get all users (admin only)"""
    users = auth_db.get_all_users()
    return jsonify(users)


@app.route('/api/auth/users', methods=['POST'])
@require_auth
@require_admin
def create_user():
    """Create new user (admin only)"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        is_admin = data.get('is_admin', False)
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        user = auth_db.create_user(username, password, is_admin)
        if not user:
            return jsonify({'error': 'Username already exists'}), 409
        
        return jsonify(user), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/users/<int:user_id>', methods=['PUT'])
@require_auth
@require_admin
def update_user(user_id):
    """Update user (admin only)"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        is_admin = data.get('is_admin')
        is_active = data.get('is_active')
        
        if password is not None and len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Build update parameters (AuthDatabase only supports is_admin and is_active updates)
        update_params = {}
        if is_admin is not None:
            update_params['is_admin'] = is_admin
        if is_active is not None:
            update_params['is_active'] = is_active
            
        success = auth_db.update_user(user_id, **update_params)
        if not success:
            return jsonify({'error': 'User not found'}), 404
        
        user = auth_db.get_user_by_id(user_id)
        return jsonify(user)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/users/<int:user_id>', methods=['DELETE'])
@require_auth
@require_admin
def delete_user(user_id):
    """Delete user (admin only)"""
    try:
        # Prevent admin from deleting themselves
        if user_id == request.current_user['id']:
            return jsonify({'error': 'Cannot delete your own account'}), 400

        success = auth_db.delete_user(user_id)
        if not success:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({'message': 'User deleted successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Admin Messages routes
@app.route('/api/admin/messages', methods=['GET'])
@require_auth
@require_admin
def get_all_admin_messages():
    """Get all admin messages (admin only)"""
    messages = auth_db.get_all_messages()
    return jsonify(messages)


@app.route('/api/admin/messages', methods=['POST'])
@require_auth
@require_admin
def create_admin_message():
    """Create new admin message (admin only)"""
    try:
        data = request.get_json()
        title = data.get('title', '').strip()
        content = data.get('content', '').strip()
        message_type = data.get('message_type', 'info')

        if not title or not content:
            return jsonify({'error': 'Title and content are required'}), 400

        if message_type not in ['info', 'warning', 'error', 'success']:
            return jsonify({'error': 'Invalid message type'}), 400

        message = auth_db.create_message(title, content, message_type, request.current_user['id'])
        if not message:
            return jsonify({'error': 'Failed to create message'}), 500

        return jsonify(message), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/messages/<int:message_id>', methods=['PUT'])
@require_auth
@require_admin
def update_admin_message(message_id):
    """Update admin message (admin only)"""
    try:
        data = request.get_json()
        title = data.get('title')
        content = data.get('content')
        message_type = data.get('message_type')
        is_active = data.get('is_active')

        if message_type is not None and message_type not in ['info', 'warning', 'error', 'success']:
            return jsonify({'error': 'Invalid message type'}), 400

        # Build update parameters
        update_params = {}
        if title is not None:
            update_params['title'] = title.strip()
        if content is not None:
            update_params['content'] = content.strip()
        if message_type is not None:
            update_params['message_type'] = message_type
        if is_active is not None:
            update_params['is_active'] = is_active

        if not update_params:
            return jsonify({'error': 'No valid fields to update'}), 400

        success = auth_db.update_message(message_id, **update_params)
        if not success:
            return jsonify({'error': 'Message not found'}), 404

        # Return updated message
        messages = auth_db.get_all_messages()
        updated_message = next((m for m in messages if m['id'] == message_id), None)
        return jsonify(updated_message)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/messages/<int:message_id>', methods=['DELETE'])
@require_auth
@require_admin
def delete_admin_message(message_id):
    """Delete admin message (admin only)"""
    try:
        success = auth_db.delete_message(message_id)
        if not success:
            return jsonify({'error': 'Message not found'}), 404

        return jsonify({'message': 'Message deleted successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/messages', methods=['GET'])
@require_auth
def get_active_messages():
    """Get active admin messages for users"""
    messages = auth_db.get_active_messages()
    return jsonify(messages)


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        stats = db.get_database_stats()
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'stats': stats
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'database': 'error',
            'error': str(e)
        }), 500


@app.route('/api/scraping-info', methods=['GET'])
@require_auth
def get_scraping_info():
    """Get scraping metadata"""
    info = db.get_scraping_info()
    return jsonify(info if info else {})


@app.route('/api/races', methods=['GET'])
@require_auth
def get_races():
    """Get all races with basic info"""
    try:
        races = db.get_all_races()
        return jsonify(races)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/races/<race_id>', methods=['GET'])
@require_auth
def get_race_details(race_id):
    """Get detailed race information with participants"""
    race = db.get_race_with_participants(race_id)
    if race:
        return jsonify(race)
    else:
        return jsonify({'error': 'Race not found'}), 404


@app.route('/api/cyclists/search', methods=['GET'])
@require_auth
def search_cyclists():
    """Search cyclists by name"""
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    
    results = db.search_cyclists(query)
    return jsonify(results)


@app.route('/api/cyclists/<uci_id>', methods=['GET'])
@require_auth
def get_cyclist_details(uci_id):
    """Get cyclist information and race history"""
    cyclist = db.get_cyclist_by_id(uci_id)
    if not cyclist:
        return jsonify({'error': 'Cyclist not found'}), 404
    
    history = db.get_cyclist_history(uci_id)
    cyclist['race_history'] = history
    
    return jsonify(cyclist)


@app.route('/api/cyclists/<uci_id>/history', methods=['GET'])
@require_auth
def get_cyclist_history(uci_id):
    """Get race history for a specific cyclist"""
    history = db.get_cyclist_history(uci_id)
    return jsonify(history)


@app.route('/api/stats', methods=['GET'])
@require_auth
def get_database_stats():
    """Get database statistics"""
    stats = db.get_database_stats()
    return jsonify(stats)


@app.route('/api/races/data', methods=['GET'])
@require_auth
def get_races_data():
    """Export data in original YAML format for compatibility (optimized with JSON caching)"""
    try:
        # Get cached races data and pre-serialized JSON
        cached_races_data, cached_json_response, cache_timestamp = db_monitor.get_cached_races()

        if cached_json_response is not None:
            # Return pre-serialized JSON response directly
            from flask import Response
            response = Response(
                cached_json_response,
                mimetype='application/json',
                status=200
            )
            if cache_timestamp:
                response.headers['X-Cache-Timestamp'] = cache_timestamp.isoformat()
                response.headers['X-Cache-Status'] = 'HIT'
            return response
        else:
            # Fallback to direct database query if cache is not available
            data = db.get_races_data()
            response = jsonify(data)
            response.headers['X-Cache-Status'] = 'MISS'
            return response
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/research/scrape-race', methods=['POST'])
@require_auth
def scrape_race_data():
    """Scrape race data from paysdelaloirecyclisme.fr URL"""
    try:
        data = request.get_json()
        url = data.get('url', '')
        
        if not url:
            return jsonify({'error': 'No URL provided'}), 400
        
        # Validate URL
        if 'paysdelaloirecyclisme.fr' not in url and 'velo.ffc.fr' not in url:
            return jsonify({'error': 'Only paysdelaloirecyclisme.fr and velo.ffc.fr URLs are supported'}), 400
        
        # Scrape the webpage
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract race name from <h1> tag
        race_name = ''
        h1_tag = soup.find('h1')
        if h1_tag:
            race_name = h1_tag.get_text(strip=True)
        
        # Extract race date from <time> tag with class header-race__date
        race_date = ''
        time_tag = soup.find('time', class_='header-race__date')
        if time_tag:
            race_date = time_tag.get_text(strip=True)
        
        # Extract organizer from <span>Organisateur</span> tag
        organizer_club = ''
        organizer_spans = soup.find_all('span', string='Organisateur')
        if organizer_spans:
            # Look for the next element that contains the organizer name
            for span in organizer_spans:
                # Check parent or next sibling elements
                parent = span.parent
                if parent:
                    # Look for the organizer name in the same parent or next elements
                    text = parent.get_text(strip=True)
                    # Remove "Organisateur" from the text and extract the club name
                    organizer_club = text.replace('Organisateur', '').strip()
                    if organizer_club:
                        break
        
        # Extract cyclist data from table
        entry_list = ''
        table = soup.find('table')
        if table:
            rows = table.find_all('tr')
            for row in rows[1:]:  # Skip header row
                cells = row.find_all('td')
                if len(cells) >= 7:  # Ensure we have enough columns
                    # Extract data from each cell
                    uci_id = cells[0].get_text(strip=True)
                    last_name = cells[1].get_text(strip=True)
                    first_name = cells[2].get_text(strip=True)
                    category = cells[3].get_text(strip=True)
                    region = cells[4].get_text(strip=True)
                    club = cells[5].get_text(strip=True)
                    team = cells[6].get_text(strip=True) if len(cells) > 6 else ''
                    line = f"{uci_id}\t{last_name}\t{first_name}\t{category}\t{region}\t{club}\t{team}"
                    entry_list += line + '\n'
        
        if not entry_list:
            return jsonify({'error': 'No cyclist table found on the webpage'}), 400
        
        return jsonify({
            'race_name': race_name,
            'race_date': race_date,
            'organizer_club': organizer_club,
            'entry_list': entry_list.strip()
        })
        
    except requests.RequestException as e:
        return jsonify({'error': f'Failed to fetch webpage: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Scraping failed: {str(e)}'}), 500


@app.route('/api/research/entry-list', methods=['POST'])
@require_auth
def research_entry_list():
    """Analyze entry list against database"""
    try:
        data = request.get_json()
        entry_list = data.get('entryList', '')
        
        if not entry_list:
            return jsonify({'error': 'No entry list provided'}), 400
        
        # Parse entry list (tab/space separated)
        lines = entry_list.strip().split('\n')
        results = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Split by tab or multiple spaces
            parts = re.split(r'\t+|\s{2,}', line)
            if len(parts) < 3:
                continue
                
            uci_id = parts[0].strip()
            last_name = parts[1].strip() if len(parts) > 1 else ''
            first_name = parts[2].strip() if len(parts) > 2 else ''
            category = parts[3].strip() if len(parts) > 3 else ''
            region = parts[4].strip() if len(parts) > 4 else ''
            club = parts[5].strip() if len(parts) > 5 else ''
            team = parts[6].strip() if len(parts) > 6 else ''
            
            # Search for cyclist in database
            cyclist = db.get_cyclist_by_id(uci_id)
            
            if not cyclist:
                # Try searching by name
                search_results = db.search_cyclists(f"{first_name} {last_name}")
                cyclist = search_results[0] if search_results else None
            
            # Get best position if cyclist found
            best_position = None
            if cyclist:
                history = db.get_cyclist_history(cyclist['uci_id'])
                if history:
                    best_position = min(race['rank'] for race in history)
            
            results.append({
                'uci_id': uci_id,
                'last_name': last_name,
                'first_name': first_name,
                'category': category,
                'region': region,
                'club': club,
                'team': team,
                'found_in_db': cyclist is not None,
                'best_position': best_position,
                'total_races': cyclist['total_races'] if cyclist else 0,
                'db_uci_id': cyclist['uci_id'] if cyclist else None
            })
        
        return jsonify({
            'results': results,
            'total_analyzed': len(results),
            'found_in_db': sum(1 for r in results if r['found_in_db'])
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500




def main():
    """Run the API server"""
    port = int(os.environ.get('PORT', 3001))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'

    print(f"Starting Race Cycling API Server...")
    print(f"Database: {DB_PATH}")
    print(f"Port: {port}")
    print(f"Debug: {debug}")

    # Check database connectivity
    try:
        stats = db.get_database_stats()
        print(f"Database connected successfully!")
        print(f"- Total races: {stats['total_races']}")
        print(f"- Total cyclists: {stats['total_cyclists']}")
        print(f"- Total results: {stats['total_results']}")
    except Exception as e:
        print(f"Database connection failed: {e}")
        return

    # Start database monitoring for race caching
    try:
        db_monitor.start_monitoring()
    except Exception as e:
        print(f"Warning: Database monitoring failed to start: {e}")

    # Setup cleanup on shutdown
    import atexit
    atexit.register(db_monitor.stop_monitoring)

    # Remove SSL context for Docker deployment - nginx handles SSL termination
    app.run(host='0.0.0.0', port=port, debug=debug)


if __name__ == '__main__':
    main()