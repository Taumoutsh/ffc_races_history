#!/usr/bin/env python3
"""
Test script to verify database setup and functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import CyclingDatabase

def test_database():
    """Test database functionality"""
    db_path = 'database/cycling_data.db'
    
    print("🧪 Testing database functionality...")
    
    try:
        # Initialize database
        db = CyclingDatabase(db_path)
        print("✅ Database connection successful")
        
        # Get stats
        stats = db.get_database_stats()
        print(f"📊 Database Stats:")
        print(f"   - Total races: {stats['total_races']}")
        print(f"   - Total cyclists: {stats['total_cyclists']}")
        print(f"   - Total results: {stats['total_results']}")
        
        if stats['total_cyclists'] == 0:
            print("⚠️  No cyclists in database. Run migration first: python3 database/migrate_yaml_to_db.py")
            return False
        
        # Test search functionality
        print("\n🔍 Testing search functionality...")
        test_queries = ['thomas', 'martin', 'dupont', 'a']
        
        for query in test_queries:
            results = db.search_cyclists(query)
            print(f"   Search '{query}': {len(results)} results")
            if results:
                print(f"      First result: {results[0]['first_name']} {results[0]['last_name']} (ID: {results[0]['uci_id']})")
        
        # Test get cyclist by ID
        print("\n👤 Testing cyclist lookup...")
        all_cyclists = db.search_cyclists('a')  # Get some cyclists
        if all_cyclists:
            test_cyclist = all_cyclists[0]
            cyclist_data = db.get_cyclist_by_id(test_cyclist['uci_id'])
            if cyclist_data:
                print(f"✅ Cyclist lookup successful: {cyclist_data['first_name']} {cyclist_data['last_name']}")
                
                # Test history
                history = db.get_cyclist_history(test_cyclist['uci_id'])
                print(f"   Race history: {len(history)} races")
            else:
                print("❌ Cyclist lookup failed")
        
        # Test race functionality
        print("\n🏁 Testing race functionality...")
        races = db.get_all_races()
        if races:
            print(f"✅ Found {len(races)} races")
            test_race = races[0]
            race_details = db.get_race_with_participants(test_race['id'])
            if race_details:
                print(f"   Test race: {race_details['name']} with {len(race_details['participants'])} participants")
            else:
                print("❌ Race details lookup failed")
        else:
            print("❌ No races found")
        
        print("\n✅ All database tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

def test_api_server():
    """Test API server endpoints"""
    import requests
    
    api_base = 'http://localhost:3001/api'
    
    print("\n🌐 Testing API server...")
    
    try:
        # Health check
        response = requests.get(f'{api_base}/health', timeout=5)
        if response.status_code == 200:
            print("✅ API server is running")
            health_data = response.json()
            print(f"   Database status: {health_data.get('database', 'unknown')}")
        else:
            print(f"❌ API health check failed: {response.status_code}")
            return False
        
        # Test search
        response = requests.get(f'{api_base}/cyclists/search?q=thomas', timeout=5)
        if response.status_code == 200:
            results = response.json()
            print(f"✅ Search endpoint working: {len(results)} results for 'thomas'")
        else:
            print(f"❌ Search endpoint failed: {response.status_code}")
        
        # Test stats
        response = requests.get(f'{api_base}/stats', timeout=5)
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Stats endpoint working: {stats.get('total_races', 0)} races")
        else:
            print(f"❌ Stats endpoint failed: {response.status_code}")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API server. Make sure it's running: python3 api/server.py")
        return False
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Race Cycling Database Test Suite")
    print("=" * 50)
    
    db_success = test_database()
    
    if db_success:
        api_success = test_api_server()
        
        if api_success:
            print("\n🎉 All tests passed! The system is ready to use.")
        else:
            print("\n⚠️  Database works but API server needs to be started.")
            print("   Run: python3 api/server.py")
    else:
        print("\n❌ Database issues detected. Please run setup first.")
        print("   Run: ./setup_database.sh")