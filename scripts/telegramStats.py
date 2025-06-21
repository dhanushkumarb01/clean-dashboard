#!/usr/bin/env python3
"""
Telegram Statistics Collector
Fetches Telegram statistics using Telethon and stores them in MongoDB via Express API
"""

import asyncio
import json
import os
import sys
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import requests
from telethon import TelegramClient, events
from telethon.tl.types import User, Chat, Channel, MessageMediaPhoto, MessageMediaDocument
from telethon.errors import FloodWaitError, SessionPasswordNeededError
import logging
from dotenv import load_dotenv

# Load environment variables from config directory
load_dotenv('../config/scripts.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('../data/telegram_stats.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configuration
API_ID = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')
PHONE_NUMBER = os.getenv('TELEGRAM_PHONE_NUMBER')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5000')
SESSION_NAME = 'telegram_stats_session'

class TelegramStatsCollector:
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
        """Initialize Telegram client"""
        try:
            if not all([API_ID, API_HASH, PHONE_NUMBER]):
                raise ValueError("Missing required environment variables: TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_PHONE_NUMBER")
            
            self.client = TelegramClient(SESSION_NAME, int(API_ID), API_HASH)
            await self.client.start(phone=PHONE_NUMBER)
            
            if not await self.client.is_user_authorized():
                logger.info("First time login required. Please check your Telegram for the verification code.")
                await self.client.send_code_request(PHONE_NUMBER)
                code = input("Enter the verification code: ")
                try:
                    await self.client.sign_in(PHONE_NUMBER, code)
                except SessionPasswordNeededError:
                    password = input("Enter your 2FA password: ")
                    await self.client.sign_in(password=password)
            
            logger.info("Telegram client initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Telegram client: {e}")
            return False
    
    async def collect_basic_stats(self):
        """Collect basic statistics from all dialogs"""
        try:
            logger.info("Collecting basic statistics...")
            
            dialogs = []
            async for dialog in self.client.iter_dialogs():
                dialogs.append(dialog)
            
            # Count groups and channels
            groups = [d for d in dialogs if d.is_group or d.is_channel]
            channels = [d for d in dialogs if d.is_channel and not d.is_group]
            
            self.stats['totalGroups'] = len(groups)
            
            # Count total users across all groups
            unique_users = set()
            
            for dialog in groups:
                try:
                    logger.info(f"Fetching participants for group/channel: {dialog.title} (ID: {dialog.id})")
                    participants = await self.client.get_participants(dialog.entity, limit=None) # Fetch all participants
                    logger.info(f"Found {len(participants)} participants in {dialog.title}")
                    for participant in participants:
                        if isinstance(participant, User):
                            if not participant.bot:
                                unique_users.add(participant.id)
                                # logger.debug(f"Added user: {participant.id} - {getattr(participant, 'username', 'N/A')}")
                            # else:
                                # logger.debug(f"Skipping bot: {participant.id} - {getattr(participant, 'username', 'N/A')}")
                        # else:
                            # logger.debug(f"Skipping non-user participant: {type(participant)}")
                except Exception as e:
                    logger.warning(f"Could not get participants for {dialog.title}: {e}")
            
            self.stats['totalUsers'] = len(unique_users)
            
            logger.info(f"Total unique users identified across all groups (excluding bots): {len(unique_users)}")
            
            # Count messages and media files
            message_count = 0
            media_count = 0
            user_message_counts = defaultdict(int)
            group_message_counts = defaultdict(int)
            
            # Collect messages from last 7 days
            since_date = datetime.now() - timedelta(days=7)
            
            for dialog in groups:
                try:
                    async for message in self.client.iter_messages(dialog.entity, limit=1000, offset_date=since_date):
                        message_count += 1
                        
                        # Count media files
                        if message.media:
                            if isinstance(message.media, (MessageMediaPhoto, MessageMediaDocument)):
                                media_count += 1
                        
                        # Count user messages
                        if message.sender_id:
                            user_message_counts[message.sender_id] += 1
                        
                        # Count group messages
                        group_message_counts[dialog.id] += 1
                        
                except FloodWaitError as e:
                    logger.warning(f"Flood wait for {dialog.title}: {e.seconds} seconds")
                    await asyncio.sleep(e.seconds)
                except Exception as e:
                    logger.warning(f"Error collecting messages from {dialog.title}: {e}")
            
            self.stats['totalMessages'] = message_count
            self.stats['totalMediaFiles'] = media_count
            
            # Calculate active users (users who sent messages in last 7 days)
            self.stats['activeUsers'] = len(user_message_counts)
            
            # Calculate message rate (messages per day)
            self.stats['messageRate'] = round(message_count / 7, 2)
            
            # Calculate group propagation (percentage of groups with recent activity)
            active_groups = len([g for g in group_message_counts.values() if g > 0])
            self.stats['groupPropagation'] = round((active_groups / len(groups)) * 100, 2) if groups else 0
            
            # Calculate average views per message (simplified)
            self.stats['avgViewsPerMessage'] = round(message_count / len(groups), 2) if groups else 0
            
            logger.info(f"Basic stats collected: {self.stats['totalGroups']} groups, {self.stats['totalMessages']} messages")
            
        except Exception as e:
            logger.error(f"Error collecting basic stats: {e}")
    
    async def collect_most_active_users(self):
        """Collect most active users data"""
        try:
            logger.info("Collecting most active users...")
            
            user_message_counts = defaultdict(int)
            user_info = {}
            
            # Collect user message counts and info
            since_date = datetime.now() - timedelta(days=7)
            
            async for dialog in self.client.iter_dialogs():
                if dialog.is_group or dialog.is_channel:
                    try:
                        async for message in self.client.iter_messages(dialog.entity, limit=1000, offset_date=since_date):
                            if message.sender_id:
                                user_message_counts[message.sender_id] += 1
                                
                                # Store user info
                                if message.sender_id not in user_info and message.sender:
                                    user_info[message.sender_id] = {
                                        'userId': str(message.sender_id),
                                        'username': getattr(message.sender, 'username', None),
                                        'firstName': getattr(message.sender, 'first_name', None),
                                        'lastName': getattr(message.sender, 'last_name', None),
                                        'telegramId': str(message.sender_id)
                                    }
                    except Exception as e:
                        logger.warning(f"Error collecting user data from {dialog.title}: {e}")
            
            # Get top 10 most active users
            top_users = sorted(user_message_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            
            self.stats['mostActiveUsers'] = [
                {
                    **user_info.get(user_id, {
                        'userId': str(user_id),
                        'username': None,
                        'firstName': None,
                        'lastName': None,
                        'telegramId': str(user_id)
                    }),
                    'messageCount': count
                }
                for user_id, count in top_users
            ]
            
            logger.info(f"Most active users collected: {len(self.stats['mostActiveUsers'])} users")
            
        except Exception as e:
            logger.error(f"Error collecting most active users: {e}")
    
    async def collect_most_active_groups(self):
        """Collect most active groups data"""
        try:
            logger.info("Collecting most active groups...")
            
            group_message_counts = defaultdict(int)
            group_info = {}
            
            since_date = datetime.now() - timedelta(days=7)
            
            async for dialog in self.client.iter_dialogs():
                if dialog.is_group or dialog.is_channel:
                    try:
                        message_count = 0
                        async for message in self.client.iter_messages(dialog.entity, limit=1000, offset_date=since_date):
                            message_count += 1
                        
                        group_message_counts[dialog.id] = message_count
                        
                        # Store group info
                        group_info[dialog.id] = {
                            'groupId': str(dialog.id),
                            'title': dialog.title,
                            'username': getattr(dialog.entity, 'username', None),
                            'isChannel': dialog.is_channel
                        }
                        
                        # Try to get member count
                        try:
                            participants = await self.client.get_participants(dialog.entity, limit=1)
                            group_info[dialog.id]['memberCount'] = len(participants) if participants else 0
                        except:
                            group_info[dialog.id]['memberCount'] = 0
                            
                    except Exception as e:
                        logger.warning(f"Error collecting group data from {dialog.title}: {e}")
            
            # Get top 10 most active groups
            top_groups = sorted(group_message_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            
            self.stats['mostActiveGroups'] = [
                {
                    **group_info.get(group_id, {
                        'groupId': str(group_id),
                        'title': 'Unknown Group',
                        'username': None,
                        'isChannel': False,
                        'memberCount': 0
                    }),
                    'messageCount': count
                }
                for group_id, count in top_groups
            ]
            
            logger.info(f"Most active groups collected: {len(self.stats['mostActiveGroups'])} groups")
            
        except Exception as e:
            logger.error(f"Error collecting most active groups: {e}")
    
    async def collect_top_users_by_groups(self):
        """Collect top users by groups joined data"""
        try:
            logger.info("Collecting top users by groups...")
            
            # This aggregation would require storing group membership history per user,
            # which is not currently implemented in this simplified collector.
            # For a more robust solution, you would need to store user-group relationships
            # or fetch participant lists for all groups and then count.
            
            # For now, return empty data or implement a simplified logic if possible
            self.stats['topUsersByGroups'] = []
            logger.info("Top users by groups collection skipped (feature not fully implemented)")
            
        except Exception as e:
            logger.error(f"Error collecting top users by groups: {e}")
    
    async def collect_private_chat_users(self):
        """Fetches and prints details of 1-on-1 personal chats with real users."""
        logger.info("Collecting 1-on-1 private chat user details...")
        unique_private_users = set()

        try:
            async for dialog in self.client.iter_dialogs():
                # Check if it's a 1-on-1 user chat and not a bot
                if dialog.is_user and not dialog.entity.bot:
                    user = dialog.entity
                    unique_private_users.add(user.id)
                    logger.info(
                        f"User: "
                        f"Username: {getattr(user, 'username', 'N/A')}, "
                        f"First Name: {getattr(user, 'first_name', 'N/A')}, "
                        f"Last Name: {getattr(user, 'last_name', 'N/A')}, "
                        f"Telegram ID: {user.id}"
                    )

            logger.info(f"Total unique 1-on-1 private chat users: {len(unique_private_users)}")
        except Exception as e:
            logger.error(f"Error collecting private chat users: {e}", exc_info=True)
    
    def store_stats_in_mongodb(self):
        """Store collected statistics in MongoDB via Express API"""
        try:
            logger.info("Storing statistics in MongoDB...")
            
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
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Statistics stored successfully: {result.get('message', 'OK')}")
                return True
            else:
                logger.error(f"Failed to store statistics: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error storing statistics: {e}")
            return False
    
    async def run_collection(self):
        """Run the complete statistics collection process"""
        try:
            logger.info("Starting Telegram statistics collection...")
            
            # Initialize client
            if not await self.initialize_client():
                return False
            
            # Collect all statistics
            await self.collect_basic_stats()
            await self.collect_most_active_users()
            await self.collect_most_active_groups()
            await self.collect_top_users_by_groups()
            await self.collect_private_chat_users()
            
            # Store in MongoDB
            success = self.store_stats_in_mongodb()
            
            # Close client
            await self.client.disconnect()
            
            return success
            
        except Exception as e:
            logger.error(f"Error in collection process: {e}")
            if self.client:
                await self.client.disconnect()
            return False

async def main():
    """Main function"""
    collector = TelegramStatsCollector()
    success = await collector.run_collection()
    
    if success:
        logger.info("Telegram statistics collection completed successfully")
        sys.exit(0)
    else:
        logger.error("Telegram statistics collection failed")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
