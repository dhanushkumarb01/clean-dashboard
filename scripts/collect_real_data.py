#!/usr/bin/env python3
"""
Enhanced Telegram Data Collection Script
Collects real Telegram statistics with progress tracking and error handling
"""

import asyncio
import os
import sys
from datetime import datetime, timedelta
import requests
from telethon import TelegramClient
from telethon.tl.types import User, Chat, Channel
from telethon.errors import FloodWaitError, SessionPasswordNeededError
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('telegram_collection.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configuration
API_ID = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')
PHONE_NUMBER = os.getenv('TELEGRAM_PHONE_NUMBER')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5000')
SESSION_NAME = 'telegram_real_session'

class RealTelegramCollector:
    def __init__(self):
        self.client = None
        self.stats = {
            'totalGroups': 0,
            'activeUsers': 0,
            'totalUsers': 0,
            'totalMessages': 0,
            'totalMediaFiles': 0,
            'messageRate': 0,
            'rateChange': 0,
            'groupPropagation': 0,
            'avgViewsPerMessage': 0,
            'mostActiveUsers': [],
            'mostActiveGroups': [],
            'topUsersByGroups': []
        }
        
    async def initialize_client(self):
        """Initialize Telegram client with user-friendly prompts"""
        try:
            print("🔐 Initializing Telegram client...")
            
            if not all([API_ID, API_HASH, PHONE_NUMBER]):
                print("❌ Missing API credentials!")
                print("Please check your .env file contains:")
                print("- TELEGRAM_API_ID")
                print("- TELEGRAM_API_HASH") 
                print("- TELEGRAM_PHONE_NUMBER")
                return False
            
            print(f"📱 Connecting to Telegram as {PHONE_NUMBER}...")
            self.client = TelegramClient(SESSION_NAME, int(API_ID), API_HASH)
            
            # Start the client
            await self.client.start(phone=PHONE_NUMBER)
            
            if not await self.client.is_user_authorized():
                print("📲 First time login required!")
                print("A verification code has been sent to your Telegram account.")
                code = input("Enter the verification code: ")
                
                try:
                    await self.client.sign_in(PHONE_NUMBER, code)
                except SessionPasswordNeededError:
                    print("🔒 Two-factor authentication detected!")
                    password = input("Enter your 2FA password: ")
                    await self.client.sign_in(password=password)
            
            print("✅ Successfully connected to Telegram!")
            return True
            
        except Exception as e:
            print(f"❌ Failed to initialize client: {e}")
            return False
    
    async def collect_dialogs(self):
        """Collect all dialogs with progress tracking"""
        print("📋 Collecting your Telegram dialogs...")
        
        dialogs = []
        try:
            async for dialog in self.client.iter_dialogs():
                dialogs.append(dialog)
                if len(dialogs) % 10 == 0:
                    print(f"   Found {len(dialogs)} dialogs...")
            
            print(f"✅ Found {len(dialogs)} total dialogs")
            return dialogs
            
        except Exception as e:
            print(f"❌ Error collecting dialogs: {e}")
            return []
    
    async def analyze_groups(self, dialogs):
        """Analyze groups and channels"""
        print("📊 Analyzing groups and channels...")
        
        groups = [d for d in dialogs if d.is_group or d.is_channel]
        channels = [d for d in dialogs if d.is_channel and not d.is_group]
        
        self.stats['totalGroups'] = len(groups)
        print(f"   Found {len(groups)} groups/channels")
        print(f"   Found {len(channels)} channels")
        
        return groups
    
    async def collect_user_statistics(self, groups):
        """Collect user statistics"""
        print("👥 Collecting user statistics...")
        
        unique_users = set()
        user_message_counts = {}
        
        for i, group in enumerate(groups):
            try:
                print(f"   Analyzing {group.title} ({i+1}/{len(groups)})...")
                
                # Get participants
                participants = await self.client.get_participants(group.entity, limit=1000)
                for participant in participants:
                    if isinstance(participant, User) and not participant.bot:
                        unique_users.add(participant.id)
                
                # Get recent messages
                messages = await self.client.get_messages(group.entity, limit=500)
                for message in messages:
                    if message.sender_id:
                        user_message_counts[message.sender_id] = user_message_counts.get(message.sender_id, 0) + 1
                
            except FloodWaitError as e:
                print(f"   ⏳ Rate limited, waiting {e.seconds} seconds...")
                await asyncio.sleep(e.seconds)
            except Exception as e:
                print(f"   ⚠️  Error with {group.title}: {e}")
        
        self.stats['totalUsers'] = len(unique_users)
        self.stats['activeUsers'] = len(user_message_counts)
        
        # Get top users
        top_users = sorted(user_message_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        self.stats['mostActiveUsers'] = [
            {
                'userId': str(user_id),
                'messageCount': count,
                'telegramId': str(user_id)
            }
            for user_id, count in top_users
        ]
        
        print(f"   Found {len(unique_users)} unique users")
        print(f"   Found {len(user_message_counts)} active users")
    
    async def collect_group_statistics(self, groups):
        """Collect group statistics"""
        print("📈 Collecting group statistics...")
        
        group_stats = []
        
        for i, group in enumerate(groups):
            try:
                print(f"   Analyzing {group.title} ({i+1}/{len(groups)})...")
                
                # Get recent messages
                messages = await self.client.get_messages(group.entity, limit=500)
                message_count = len(messages)
                media_count = sum(1 for msg in messages if msg.media)
                
                group_stats.append({
                    'groupId': str(group.id),
                    'title': group.title,
                    'username': getattr(group.entity, 'username', None),
                    'messageCount': message_count,
                    'memberCount': 0,  # Will be updated if accessible
                    'isChannel': group.is_channel
                })
                
                self.stats['totalMessages'] += message_count
                self.stats['totalMediaFiles'] += media_count
                
            except Exception as e:
                print(f"   ⚠️  Error with {group.title}: {e}")
        
        # Sort by message count
        group_stats.sort(key=lambda x: x['messageCount'], reverse=True)
        self.stats['mostActiveGroups'] = group_stats[:10]
        
        print(f"   Total messages: {self.stats['totalMessages']}")
        print(f"   Total media files: {self.stats['totalMediaFiles']}")
    
    def calculate_metrics(self):
        """Calculate derived metrics"""
        print("🧮 Calculating metrics...")
        
        # Message rate (messages per day, assuming 7 days of data)
        self.stats['messageRate'] = round(self.stats['totalMessages'] / 7, 2)
        
        # Group propagation (percentage of groups with recent activity)
        if self.stats['totalGroups'] > 0:
            active_groups = len([g for g in self.stats['mostActiveGroups'] if g['messageCount'] > 0])
            self.stats['groupPropagation'] = round((active_groups / self.stats['totalGroups']) * 100, 2)
        
        # Average views per message (simplified)
        if self.stats['totalMessages'] > 0:
            self.stats['avgViewsPerMessage'] = round(self.stats['totalMessages'] / self.stats['totalGroups'], 2)
    
    def store_data(self):
        """Store collected data via API"""
        try:
            print("💾 Storing data in database...")
            
            # Add collection period
            self.stats['collectionPeriod'] = {
                'start': (datetime.now() - timedelta(days=7)).isoformat(),
                'end': datetime.now().isoformat()
            }
            
            # Send to Express API
            response = requests.post(
                f"{BACKEND_URL}/api/telegram/store-stats",
                json=self.stats,
                headers={'Content-Type': 'application/json'},
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Data stored successfully!")
                return True
            else:
                print(f"❌ Failed to store data: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error storing data: {e}")
            return False
    
    async def run_collection(self):
        """Run the complete data collection process"""
        try:
            print("🚀 Starting real Telegram data collection...")
            print("=" * 50)
            
            # Initialize client
            if not await self.initialize_client():
                return False
            
            # Collect dialogs
            dialogs = await self.collect_dialogs()
            if not dialogs:
                return False
            
            # Analyze groups
            groups = await self.analyze_groups(dialogs)
            
            # Collect statistics
            await self.collect_user_statistics(groups)
            await self.collect_group_statistics(groups)
            
            # Calculate metrics
            self.calculate_metrics()
            
            # Store data
            success = self.store_data()
            
            # Close client
            await self.client.disconnect()
            
            return success
            
        except Exception as e:
            print(f"❌ Error in collection process: {e}")
            if self.client:
                await self.client.disconnect()
            return False

async def main():
    """Main function"""
    print("🎯 Real Telegram Data Collection")
    print("=" * 40)
    
    collector = RealTelegramCollector()
    success = await collector.run_collection()
    
    if success:
        print("\n🎉 Real Telegram data collection completed successfully!")
        print("You can now refresh your dashboard to see your actual statistics.")
        sys.exit(0)
    else:
        print("\n❌ Data collection failed. Please check the logs and try again.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main()) 