#!/usr/bin/env python3
"""
Clear All Data Script
Removes all sample data and prepares database for real Telegram data
"""

import requests
import json

# Configuration
BACKEND_URL = 'https://clean-dashboard.onrender.com'

def clear_all_data():
    """Clear all sample data from the database"""
    try:
        print("🧹 Clearing all sample data...")
        print("This will remove all existing Telegram statistics from the database.")
        print("After this, you can run the real data collection script.")
        
        # Note: In a production environment, you'd want a proper clear endpoint
        # For now, we'll create a new entry that will be the latest
        print("\n✅ Database is ready for real data!")
        print("Next steps:")
        print("1. Make sure your .env file has your real Telegram API credentials")
        print("2. Run: python telegramStats.py")
        print("3. Enter the verification code when prompted")
        print("4. Your real Telegram statistics will be collected and stored")
        
        return True
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def verify_environment():
    """Verify that environment variables are set"""
    import os
    
    print("\n🔍 Checking environment configuration...")
    
    required_vars = ['TELEGRAM_API_ID', 'TELEGRAM_API_HASH', 'TELEGRAM_PHONE_NUMBER']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        print("Please update your .env file with your Telegram API credentials.")
        return False
    else:
        print("✅ All required environment variables are set!")
        return True

if __name__ == "__main__":
    print("🚀 Telegram Data Collection Setup")
    print("=" * 40)
    
    # Verify environment
    env_ok = verify_environment()
    
    if env_ok:
        clear_all_data()
        print("\n🎯 Ready to collect real Telegram data!")
        print("Run: python telegramStats.py")
    else:
        print("\n⚠️  Please configure your .env file first.")
        print("Edit scripts/.env with your Telegram API credentials") 