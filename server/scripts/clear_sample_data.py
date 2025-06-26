#!/usr/bin/env python3
"""
Clear Sample Data Script
Removes sample data from the database
"""

import requests

# Configuration
BACKEND_URL = 'https://clean-dashboard.onrender.com'

def clear_sample_data():
    """Clear sample data from the database"""
    try:
        print("Clearing sample data...")
        
        # This would require adding a clear endpoint to your backend
        # For now, you can manually delete from MongoDB
        print("To clear sample data, you can:")
        print("1. Use MongoDB Compass to delete documents from 'telegram_stats' collection")
        print("2. Or add a clear endpoint to your backend API")
        print("3. Or wait for real data to replace the sample data")
        
        return True
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    clear_sample_data() 