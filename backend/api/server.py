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

# Add project root to path for backend imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.database.models import CyclingDatabase

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize database
DB_PATH = os.environ.get('DB_PATH', 'backend/database/cycling_data.db')
db = CyclingDatabase(DB_PATH)


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'database': 'connected',
        'stats': db.get_database_stats()
    })


@app.route('/api/scraping-info', methods=['GET'])
def get_scraping_info():
    """Get scraping metadata"""
    info = db.get_scraping_info()
    return jsonify(info if info else {})


@app.route('/api/races', methods=['GET'])
def get_races():
    """Get all races with basic info"""
    races = db.get_all_races()
    return jsonify(races)


@app.route('/api/races/<race_id>', methods=['GET'])
def get_race_details(race_id):
    """Get detailed race information with participants"""
    race = db.get_race_with_participants(race_id)
    if race:
        return jsonify(race)
    else:
        return jsonify({'error': 'Race not found'}), 404


@app.route('/api/cyclists/search', methods=['GET'])
def search_cyclists():
    """Search cyclists by name"""
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    
    results = db.search_cyclists(query)
    return jsonify(results)


@app.route('/api/cyclists/<uci_id>', methods=['GET'])
def get_cyclist_details(uci_id):
    """Get cyclist information and race history"""
    cyclist = db.get_cyclist_by_id(uci_id)
    if not cyclist:
        return jsonify({'error': 'Cyclist not found'}), 404
    
    history = db.get_cyclist_history(uci_id)
    cyclist['race_history'] = history
    
    return jsonify(cyclist)


@app.route('/api/cyclists/<uci_id>/history', methods=['GET'])
def get_cyclist_history(uci_id):
    """Get race history for a specific cyclist"""
    history = db.get_cyclist_history(uci_id)
    return jsonify(history)


@app.route('/api/stats', methods=['GET'])
def get_database_stats():
    """Get database statistics"""
    stats = db.get_database_stats()
    return jsonify(stats)


@app.route('/api/export/yaml', methods=['GET'])
def export_yaml_format():
    """Export data in original YAML format for compatibility"""
    try:
        data = db.export_yaml_format()
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/research/entry-list', methods=['POST'])
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
    
    app.run(host='0.0.0.0', port=port, debug=debug)


if __name__ == '__main__':
    main()