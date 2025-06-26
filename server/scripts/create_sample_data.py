#!/usr/bin/env python3
"""
Sample Data Generator for Telegram Dashboard
Creates sample data to test the dashboard UI
"""

import requests
import json
from datetime import datetime, timedelta
import random

# Configuration
BACKEND_URL = 'https://clean-dashboard.onrender.com'

def create_sample_data():
    """Create and send sample Telegram statistics"""
    
    # Sample data
    sample_stats = {
        'totalGroups': 15,
        'activeUsers': 234,
        'totalUsers': 1250,
        'totalMessages': 3456,
        'totalMediaFiles': 567,
        'messageRate': 493.7,
        'rateChange': 12.5,
        'groupPropagation': 86.7,
        'avgViewsPerMessage': 42.3,
        'mostActiveUsers': [
            {
                'userId': 'user_001',
                'username': 'john_doe',
                'firstName': 'John',
                'lastName': 'Doe',
                'messageCount': 156,
                'telegramId': '123456789'
            },
            {
                'userId': 'user_002',
                'username': 'jane_smith',
                'firstName': 'Jane',
                'lastName': 'Smith',
                'messageCount': 134,
                'telegramId': '987654321'
            },
            {
                'userId': 'user_003',
                'username': 'bob_wilson',
                'firstName': 'Bob',
                'lastName': 'Wilson',
                'messageCount': 98,
                'telegramId': '456789123'
            },
            {
                'userId': 'user_004',
                'username': 'alice_brown',
                'firstName': 'Alice',
                'lastName': 'Brown',
                'messageCount': 87,
                'telegramId': '789123456'
            },
            {
                'userId': 'user_005',
                'username': 'charlie_davis',
                'firstName': 'Charlie',
                'lastName': 'Davis',
                'messageCount': 76,
                'telegramId': '321654987'
            }
        ],
        'mostActiveGroups': [
            {
                'groupId': 'group_001',
                'title': 'Tech Enthusiasts',
                'username': 'techenthusiasts',
                'messageCount': 456,
                'memberCount': 1250,
                'isChannel': False
            },
            {
                'groupId': 'group_002',
                'title': 'Programming Hub',
                'username': 'programminghub',
                'messageCount': 389,
                'memberCount': 890,
                'isChannel': False
            },
            {
                'groupId': 'group_003',
                'title': 'AI & ML Community',
                'username': 'aimlcommunity',
                'messageCount': 312,
                'memberCount': 567,
                'isChannel': False
            },
            {
                'groupId': 'group_004',
                'title': 'Web Development',
                'username': 'webdevgroup',
                'messageCount': 298,
                'memberCount': 445,
                'isChannel': False
            },
            {
                'groupId': 'group_005',
                'title': 'Data Science',
                'username': 'datascience',
                'messageCount': 267,
                'memberCount': 334,
                'isChannel': False
            }
        ],
        'topUsersByGroups': [
            {
                'userId': 'user_001',
                'username': 'john_doe',
                'firstName': 'John',
                'lastName': 'Doe',
                'groupsJoined': 12,
                'telegramId': '123456789'
            },
            {
                'userId': 'user_002',
                'username': 'jane_smith',
                'firstName': 'Jane',
                'lastName': 'Smith',
                'groupsJoined': 10,
                'telegramId': '987654321'
            },
            {
                'userId': 'user_003',
                'username': 'bob_wilson',
                'firstName': 'Bob',
                'lastName': 'Wilson',
                'groupsJoined': 8,
                'telegramId': '456789123'
            },
            {
                'userId': 'user_004',
                'username': 'alice_brown',
                'firstName': 'Alice',
                'lastName': 'Brown',
                'groupsJoined': 7,
                'telegramId': '789123456'
            },
            {
                'userId': 'user_005',
                'username': 'charlie_davis',
                'firstName': 'Charlie',
                'lastName': 'Davis',
                'groupsJoined': 6,
                'telegramId': '321654987'
            }
        ],
        'collectionPeriod': {
            'start': (datetime.now() - timedelta(days=7)).isoformat(),
            'end': datetime.now().isoformat()
        }
    }
    
    try:
        print("Creating sample Telegram data...")
        
        # Send to Express API
        response = requests.post(
            f"{BACKEND_URL}/api/telegram/store-stats",
            json=sample_stats,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Sample data created successfully!")
            print(f"Response: {result.get('message', 'OK')}")
            return True
        else:
            print(f"❌ Failed to create sample data: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        return False

if __name__ == "__main__":
    success = create_sample_data()
    if success:
        print("\n🎉 Sample data has been created!")
        print("You can now refresh your dashboard to see the Telegram statistics.")
    else:
        print("\n❌ Failed to create sample data. Please check your backend server.") 