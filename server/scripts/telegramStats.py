#!/usr/bin/env python3
"""
Telegram Statistics Collector
Fetches Telegram statistics using Telethon and stores them in MongoDB via Express API
Now includes message content collection for monitoring and analysis
"""

import asyncio
import json
import os
import sys
import re
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import requests
from telethon import TelegramClient, events
from telethon.tl.types import User, Chat, Channel, MessageMediaPhoto, MessageMediaDocument
from telethon.errors import FloodWaitError, SessionPasswordNeededError, PhoneCodeInvalidError
import logging
from dotenv import load_dotenv
import uuid
import argparse
import sqlite3
import time
import pymongo

# Ensure data directory exists for logging
os.makedirs('data', exist_ok=True)

# Load environment variables from config directory
load_dotenv(os.path.join(os.path.dirname(__file__), '../config/scripts.env'))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('data/telegram_stats.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configuration
API_ID = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')
PHONE_NUMBER = os.getenv('TELEGRAM_PHONE_NUMBER')
BACKEND_URL = os.getenv('BACKEND_URL', 'https://clean-dashboard.onrender.com')
SESSION_NAME = 'telegram_stats_session'
SESSIONS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../sessions'))
os.makedirs(SESSIONS_DIR, exist_ok=True)

# MongoDB connection
MONGO_URI = "mongodb+srv://dhanushkumar:JcEI%403098@internship-dashboard.r6iodbd.mongodb.net/test?retryWrites=true&w=majority&appName=internship-dashboard"
print(f"[DEBUG] Using MongoDB URI: {MONGO_URI}")
mongo_client = pymongo.MongoClient(MONGO_URI)
mongo_db = mongo_client['test']
stats_collection = mongo_db['telegramstats']
messages_collection = mongo_db['telegrammessages']

def get_session_path(phone):
    safe_phone = phone.replace('+', '')
    return os.path.join(SESSIONS_DIR, f'{safe_phone}.session')

# Defensive check for missing environment variables
missing = [k for k, v in {
    'TELEGRAM_API_ID': API_ID,
    'TELEGRAM_API_HASH': API_HASH,
    'TELEGRAM_PHONE_NUMBER': PHONE_NUMBER
}.items() if not v]
if missing:
    raise EnvironmentError(f"Missing required environment variables: {', '.join(missing)}")

API_ID = int(API_ID)

# Suspicious keywords for content analysis
SUSPICIOUS_KEYWORDS = [
    'scam', 'fraud', 'fake', 'phishing', 'hack', 'steal', 'bitcoin', 'crypto',
    'investment', 'profit', 'money back', 'guaranteed', 'risk-free', 'get rich',
    'click here', 'urgent', 'limited time', 'act now', 'free money', 'loan',
    'credit repair', 'debt relief', 'casino', 'gambling', 'lottery', 'winner'
]

logging.basicConfig(filename="/tmp/telegram_debug.log", level=logging.DEBUG)
logging.debug("Script started")

class TelegramStatsCollector:
    def __init__(self):
        self.client = None
        self.collection_batch_id = str(uuid.uuid4())
        self.collected_messages = []
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
        session_path = get_session_path(PHONE_NUMBER)
        lock_path = session_path + '.lock'
        retry = False
        for attempt in range(2):
            try:
                # Lock file logic: only one process per session
                if os.path.exists(lock_path):
                    logger.error(f"Session lock detected for {session_path}. Another process may be using this session.")
                    raise RuntimeError(f"Session lock detected for {session_path}. Only one process can use a session at a time.")
                with open(lock_path, 'w') as lockf:
                    lockf.write(str(os.getpid()))
                logger.info(f"Using session file: {session_path}")
                self.client = TelegramClient(session_path, int(API_ID), API_HASH)
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
                os.remove(lock_path)
                return True
            except sqlite3.OperationalError as e:
                if 'database is locked' in str(e) and not retry:
                    logger.warning(f"Session DB is locked for {session_path}. Deleting and retrying once...")
                    if os.path.exists(session_path + '.session'):
                        os.remove(session_path + '.session')
                    retry = True
                    time.sleep(1)
                    continue
                else:
                    logger.error(f"Failed to initialize Telegram client: {e}")
                    if os.path.exists(lock_path):
                        os.remove(lock_path)
                    return False
            except Exception as e:
                logger.error(f"Failed to initialize Telegram client: {e}")
                if os.path.exists(lock_path):
                    os.remove(lock_path)
                return False
        return False
    
    async def initialize_client_cli(self, args):
        session_path = get_session_path(args.phone)
        lock_path = session_path + '.lock'
        retry = False
        for attempt in range(2):
            try:
                if os.path.exists(lock_path):
                    print(f"Session lock detected for {session_path}. Another process may be using this session.")
                    raise RuntimeError(f"Session lock detected for {session_path}. Only one process can use a session at a time.")
                with open(lock_path, 'w') as lockf:
                    lockf.write(str(os.getpid()))
                self.client = TelegramClient(session_path, int(API_ID), API_HASH)
                await self.client.connect()
                if not await self.client.is_user_authorized():
                    if not args.code:
                        result = await self.client.send_code_request(args.phone)
                        phone_code_hash = result.phone_code_hash
                        print(f'CODE_SENT:{phone_code_hash}')
                        logging.debug("Sending code to: %s", args.phone)
                        os.remove(lock_path)
                        return
                    try:
                        if hasattr(args, 'phone_code_hash') and args.phone_code_hash:
                            await self.client.sign_in(args.phone, args.code, phone_code_hash=args.phone_code_hash)
                        else:
                            await self.client.sign_in(args.phone, args.code)
                    except SessionPasswordNeededError:
                        if not args.password:
                            print('2FA_REQUIRED')
                            os.remove(lock_path)
                            return
                        await self.client.sign_in(password=args.password)
                print('LOGIN_SUCCESS')
                os.remove(lock_path)
                # Now run data collection as usual
                await self.run_collection()
                return
            except sqlite3.OperationalError as e:
                if 'database is locked' in str(e) and not retry:
                    print(f"Session DB is locked for {session_path}. Deleting and retrying once...")
                    if os.path.exists(session_path + '.session'):
                        os.remove(session_path + '.session')
                    retry = True
                    time.sleep(1)
                    continue
                else:
                    print(f'ERROR: {e}')
                    if os.path.exists(lock_path):
                        os.remove(lock_path)
                    return
            except Exception as e:
                print(f'ERROR: {e}')
                if os.path.exists(lock_path):
                    os.remove(lock_path)
                return
        return
    
    def analyze_message_content(self, message_text):
        """Analyze message content for suspicious keywords and other flags"""
        if not message_text:
            return {
                'word_count': 0,
                'contains_urls': False,
                'contains_hashtags': False,
                'contains_mentions': False,
                'suspicious_keywords': [],
                'risk_score': 0
            }
        
        # Convert to lowercase for analysis
        text_lower = message_text.lower()
        
        # Check for URLs
        url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        contains_urls = bool(re.search(url_pattern, message_text))
        
        # Check for hashtags
        contains_hashtags = bool(re.search(r'#\w+', message_text))
        
        # Check for mentions
        contains_mentions = bool(re.search(r'@\w+', message_text))
        
        # Check for suspicious keywords
        suspicious_keywords = []
        for keyword in SUSPICIOUS_KEYWORDS:
            if keyword in text_lower:
                suspicious_keywords.append(keyword)
        
        # Calculate risk score (0-10)
        risk_score = 0
        risk_score += len(suspicious_keywords) * 2  # 2 points per suspicious keyword
        risk_score += 1 if contains_urls else 0  # 1 point for URLs
        risk_score = min(risk_score, 10)  # Cap at 10
        
        return {
            'word_count': len(message_text.split()),
            'contains_urls': contains_urls,
            'contains_hashtags': contains_hashtags,
            'contains_mentions': contains_mentions,
            'suspicious_keywords': suspicious_keywords,
            'risk_score': risk_score
        }
    
    def get_message_type(self, message):
        """Determine the type of message based on media content"""
        if not message.media:
            return 'text', None, False
        
        if hasattr(message.media, 'photo'):
            return 'photo', 'photo', True
        elif hasattr(message.media, 'document'):
            if message.media.document.mime_type:
                if 'video' in message.media.document.mime_type:
                    return 'video', 'video', True
                elif 'audio' in message.media.document.mime_type:
                    return 'audio', 'audio', True
                else:
                    return 'document', 'document', True
            return 'document', 'document', True
        else:
            return 'other', 'other', True
    
    async def collect_messages_from_chat(self, dialog, limit=200):
        """Collect recent messages from a specific chat/group"""
        try:
            chat_type = 'private'
            if dialog.is_group:
                chat_type = 'group'
            elif dialog.is_channel:
                chat_type = 'channel'
            
            logger.info(f"Collecting messages from {chat_type}: {dialog.title} (limit: {limit})")
            
            messages_collected = 0
            since_date = datetime.now() - timedelta(days=7)  # Last 7 days
            
            async for message in self.client.iter_messages(dialog.entity, limit=limit, offset_date=since_date):
                try:
                    # Skip service messages and empty messages
                    if not message.text and not message.media:
                        continue
                    
                    # Get sender information
                    sender_info = {
                        'sender_id': str(message.sender_id) if message.sender_id else 'unknown',
                        'sender_username': None,
                        'sender_first_name': None,
                        'sender_last_name': None,
                        'sender_is_bot': False
                    }
                    
                    if message.sender:
                        sender_info.update({
                            'sender_username': getattr(message.sender, 'username', None),
                            'sender_first_name': getattr(message.sender, 'first_name', None),
                            'sender_last_name': getattr(message.sender, 'last_name', None),
                            'sender_is_bot': getattr(message.sender, 'bot', False)
                        })
                    
                    # Analyze message content
                    content_analysis = self.analyze_message_content(message.text)
                    
                    # Get message type and media info
                    message_type, media_type, has_media = self.get_message_type(message)
                    
                    # Create message data structure
                    message_data = {
                        'messageId': str(message.id),
                        'chatId': str(dialog.id),
                        'chatName': dialog.title or 'Unknown Chat',
                        'chatType': chat_type,
                        'senderId': sender_info['sender_id'],
                        'senderUsername': sender_info['sender_username'],
                        'senderFirstName': sender_info['sender_first_name'],
                        'senderLastName': sender_info['sender_last_name'],
                        'senderIsBot': sender_info['sender_is_bot'],
                        'messageText': message.text or '',
                        'messageType': message_type,
                        'hasMedia': has_media,
                        'mediaType': media_type,
                        'timestamp': message.date.isoformat(),
                        'editedTimestamp': message.edit_date.isoformat() if message.edit_date else None,
                        'views': getattr(message, 'views', 0) or 0,
                        'forwards': getattr(message, 'forwards', 0) or 0,
                        'replies': 0,  # Replies count not easily available in Telethon
                        'wordCount': content_analysis['word_count'],
                        'containsUrls': content_analysis['contains_urls'],
                        'containsHashtags': content_analysis['contains_hashtags'],
                        'containsMentions': content_analysis['contains_mentions'],
                        'suspiciousKeywords': content_analysis['suspicious_keywords'],
                        'riskScore': content_analysis['risk_score'],
                        'collectionBatch': self.collection_batch_id,
                        'isFlagged': content_analysis['risk_score'] >= 5  # Auto-flag high risk messages
                    }
                    
                    # Add phone number to message
                    message_data['phone'] = PHONE_NUMBER
                    
                    self.collected_messages.append(message_data)
                    messages_collected += 1
                    
                    # Add small delay to avoid flood wait
                    if messages_collected % 50 == 0:
                        await asyncio.sleep(1)
                        
                except Exception as e:
                    logger.warning(f"Error processing message {message.id}: {e}")
                    continue
            
            logger.info(f"Collected {messages_collected} messages from {dialog.title}")
            return messages_collected
            
        except FloodWaitError as e:
            logger.warning(f"Flood wait for {dialog.title}: {e.seconds} seconds")
            await asyncio.sleep(e.seconds)
            return 0
        except Exception as e:
            logger.error(f"Error collecting messages from {dialog.title}: {e}")
            return 0
    
    async def collect_all_messages(self):
        """Collect messages from all groups and 1-on-1 chats"""
        try:
            logger.info("Starting message content collection...")
            
            total_messages_collected = 0
            dialogs_processed = 0
            
            async for dialog in self.client.iter_dialogs():
                # Process groups, channels, and private chats
                if dialog.is_group or dialog.is_channel or dialog.is_user:
                    # Skip bots in private chats
                    if dialog.is_user and dialog.entity.bot:
                        continue
                    
                    # Determine message limit based on chat type
                    if dialog.is_user:
                        limit = 100  # Fewer messages from private chats
                    else:
                        limit = 200  # More from groups/channels
                    
                    messages_count = await self.collect_messages_from_chat(dialog, limit)
                    total_messages_collected += messages_count
                    dialogs_processed += 1
                    
                    # Add delay between chats to respect rate limits
                    await asyncio.sleep(2)
                    
                    # Log progress every 5 chats
                    if dialogs_processed % 5 == 0:
                        logger.info(f"Processed {dialogs_processed} chats, collected {total_messages_collected} messages so far")
            
            logger.info(f"Message collection completed: {total_messages_collected} messages from {dialogs_processed} chats")
            return total_messages_collected
            
        except Exception as e:
            logger.error(f"Error in message collection: {e}")
            return 0
    
    def store_messages_via_api(self):
        if not self.collected_messages:
            print(f"[WARN] No messages to POST for phone: {PHONE_NUMBER}")
        # Ensure phone is present in every message
        for msg in self.collected_messages:
            msg['phone'] = PHONE_NUMBER
        payload = {"messages": self.collected_messages}
        url = f"{BACKEND_URL}/api/telegram/store-messages"
        print(f"[DEBUG] POSTing messages to: {url}")
        print(f"[DEBUG] Payload (first 1): {json.dumps(self.collected_messages[:1], default=str) if self.collected_messages else '[]'} ... total: {len(self.collected_messages)}")
        try:
            response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=60)
            print(f"[DEBUG] Response status: {response.status_code}")
            print(f"[DEBUG] Response text: {response.text}")
            if response.status_code == 200:
                print(f"✅ API inserted messages for phone: {PHONE_NUMBER}")
            else:
                print(f"❌ API failed to insert messages: {response.status_code}")
        except Exception as e:
            print(f"❌ API call failed for messages: {e}")
            print(f"[ERROR] Payload: {json.dumps(payload, default=str)[:1000]}")

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
                except Exception as e:
                    logger.warning(f"Could not get participants for {dialog.title}: {e}")
            
            self.stats['totalUsers'] = len(unique_users)
            
            logger.info(f"Total unique users identified across all groups (excluding bots): {len(unique_users)}")
            
            # Count messages and media files
            message_count = 0
            media_count = 0
            user_message_counts = defaultdict(int)
            group_message_counts = defaultdict(int)
            
            # Use collected messages for stats if available
            if self.collected_messages:
                message_count = len(self.collected_messages)
                for msg in self.collected_messages:
                    if msg['hasMedia']:
                        media_count += 1
                    user_message_counts[msg['senderId']] += 1
                    group_message_counts[msg['chatId']] += 1
            else:
                # Fallback to old method
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
            
            # Use collected messages if available
            if self.collected_messages:
                for msg in self.collected_messages:
                    sender_id = msg['senderId']
                    user_message_counts[sender_id] += 1
                    if sender_id not in user_info:
                        user_info[sender_id] = {
                            'userId': sender_id,
                            'username': msg['senderUsername'],
                            'firstName': msg['senderFirstName'],
                            'lastName': msg['senderLastName'],
                            'telegramId': sender_id
                        }
            else:
                # Fallback to old method
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
            
            # Use collected messages if available
            if self.collected_messages:
                for msg in self.collected_messages:
                    if msg['chatType'] in ['group', 'channel']:
                        chat_id = msg['chatId']
                        group_message_counts[chat_id] += 1
                        if chat_id not in group_info:
                            group_info[chat_id] = {
                                'groupId': chat_id,
                                'title': msg['chatName'],
                                'username': None,
                                'isChannel': msg['chatType'] == 'channel',
                                'memberCount': 0
                            }
                
                # Try to get member counts
                async for dialog in self.client.iter_dialogs():
                    if dialog.is_group or dialog.is_channel:
                        chat_id = str(dialog.id)
                        if chat_id in group_info:
                            try:
                                participants = await self.client.get_participants(dialog.entity, limit=1)
                                group_info[chat_id]['memberCount'] = len(participants) if participants else 0
                                group_info[chat_id]['username'] = getattr(dialog.entity, 'username', None)
                            except:
                                pass
            else:
                # Fallback to old method
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
    
    def store_stats_via_api(self):
        self.stats['phone'] = PHONE_NUMBER
        self.stats['collectionPeriod'] = {
            'start': (datetime.now() - timedelta(days=7)).isoformat(),
            'end': datetime.now().isoformat()
        }
        url = f"{BACKEND_URL}/api/telegram/store-stats"
        print(f"[DEBUG] POSTing stats to: {url}")
        print(f"[DEBUG] Payload: {json.dumps(self.stats, default=str)[:1000]}")
        try:
            response = requests.post(url, json=self.stats, headers={'Content-Type': 'application/json'}, timeout=60)
            print(f"[DEBUG] Response status: {response.status_code}")
            print(f"[DEBUG] Response text: {response.text}")
            if response.status_code == 200:
                print(f"✅ API inserted stats for phone: {PHONE_NUMBER}")
            else:
                print(f"❌ API failed to insert stats: {response.status_code}")
        except Exception as e:
            print(f"❌ API call failed for stats: {e}")
            print(f"[ERROR] Payload: {json.dumps(self.stats, default=str)[:1000]}")

    async def run_collection(self):
        print("run_collection START for phone:", PHONE_NUMBER)
        try:
            logger.info("Starting Telegram statistics and message collection...")
            if not await self.initialize_client():
                print("run_collection ABORT: failed to initialize client for phone:", PHONE_NUMBER)
                return False
            await self.collect_all_messages()
            print("Collected all messages for phone:", PHONE_NUMBER)
            self.store_messages_via_api()
            print("Inserted messages for phone:", PHONE_NUMBER)
            await self.collect_basic_stats()
            print("Collected basic stats for phone:", PHONE_NUMBER)
            await self.collect_most_active_users()
            print("Collected most active users for phone:", PHONE_NUMBER)
            await self.collect_most_active_groups()
            print("Collected most active groups for phone:", PHONE_NUMBER)
            await self.collect_top_users_by_groups()
            print("Collected top users by groups for phone:", PHONE_NUMBER)
            await self.collect_private_chat_users()
            print("Collected private chat users for phone:", PHONE_NUMBER)
            self.store_stats_via_api()
            logger.info(f"Stats for phone {PHONE_NUMBER} inserted into backend API before any fetch/display.")
            await self.client.disconnect()
            print("run_collection END for phone:", PHONE_NUMBER)
            return True
        except Exception as e:
            logger.error(f"Error in collection process: {e}")
            print("run_collection ERROR for phone:", PHONE_NUMBER, e)
            if self.client:
                await self.client.disconnect()
            return False

def parse_args():
    parser = argparse.ArgumentParser(description='Telegram Stats Collector')
    parser.add_argument('--phone', type=str, required=True, help='Telegram phone number')
    parser.add_argument('--code', type=str, help='Telegram login code (OTP)')
    parser.add_argument('--phone_code_hash', type=str, help='Telegram phone_code_hash (from send_code_request)')
    parser.add_argument('--password', type=str, help='Telegram 2FA password (if enabled)')
    return parser.parse_args()

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--phone', required=True)
    parser.add_argument('--code')
    parser.add_argument('--phone_code_hash')
    parser.add_argument('--password')
    args = parser.parse_args()
    phone = args.phone
    session_path = get_session_path(phone)
    if os.path.exists(session_path):
        print(f'[SESSION_EXISTS] Session file exists for {phone}, skipping OTP.')
    client = TelegramClient(session_path, int(API_ID), API_HASH)
    await client.connect()
    try:
        if not await client.is_user_authorized():
            if not args.code:
                result = await client.send_code_request(phone)
                print(f'[OTP_SENT] CODE_SENT:{result.phone_code_hash}')
                await client.disconnect()
                return
            try:
                if args.phone_code_hash:
                    await client.sign_in(phone, args.code, phone_code_hash=args.phone_code_hash)
                else:
                    await client.sign_in(phone, args.code)
            except SessionPasswordNeededError:
                if args.password:
                    await client.sign_in(password=args.password)
                else:
                    print('[ERROR] 2FA_REQUIRED')
                    await client.disconnect()
                    return
            except PhoneCodeInvalidError:
                print('[ERROR] PhoneCodeInvalidError: The phone code entered was invalid')
                await client.disconnect()
                return
        print('[OTP_VERIFIED] LOGIN_SUCCESS')
        # Data collection
        collector = TelegramStatsCollector()
        collector.client = client
        await collector.collect_all_messages()
        print('Collected all messages for phone:', phone)
        collector.store_messages_via_api()
        print('Inserted messages for phone:', phone)
        await collector.collect_basic_stats()
        print('Collected basic stats for phone:', phone)
        await collector.collect_most_active_users()
        print('Collected most active users for phone:', phone)
        await collector.collect_most_active_groups()
        print('Collected most active groups for phone:', phone)
        await collector.collect_top_users_by_groups()
        print('Collected top users by groups for phone:', phone)
        await collector.collect_private_chat_users()
        print('Collected private chat users for phone:', phone)
        # Build detailed stats_doc
        now = datetime.now()
        stats_doc = {
            'phone': phone,
            'totalGroups': collector.stats.get('totalGroups', 0),
            'activeUsers': collector.stats.get('activeUsers', 0),
            'totalUsers': collector.stats.get('totalUsers', 0),
            'totalMessages': collector.stats.get('totalMessages', 0),
            'totalMediaFiles': collector.stats.get('totalMediaFiles', 0),
            'messageRate': collector.stats.get('messageRate', 0),
            'rateChange': collector.stats.get('rateChange', 0),
            'groupPropagation': collector.stats.get('groupPropagation', 0),
            'avgViewsPerMessage': collector.stats.get('avgViewsPerMessage', 0),
            'mostActiveUsers': collector.stats.get('mostActiveUsers', []),
            'mostActiveGroups': collector.stats.get('mostActiveGroups', []),
            'topUsersByGroups': collector.stats.get('topUsersByGroups', []),
            'mostActiveUserLast7Days': collector.stats.get('mostActiveUserLast7Days', {}),
            'avgMessagesPerDay': collector.stats.get('avgMessagesPerDay', 0),
            'peakHourOfActivity': collector.stats.get('peakHourOfActivity', 0),
            'messageGrowthLast7Days': collector.stats.get('messageGrowthLast7Days', 0),
            'totalSuspiciousUsers': collector.stats.get('totalSuspiciousUsers', 0),
            'suspiciousUsers': collector.stats.get('suspiciousUsers', []),
            'topUserLocations': collector.stats.get('topUserLocations', []),
            'keywordCloud': collector.stats.get('keywordCloud', []),
            'dataSource': 'telethon',
            'collectionPeriod': collector.stats.get('collectionPeriod', {
                'start': (now - timedelta(days=7)).isoformat(),
                'end': now.isoformat()
            }),
            'createdAt': now.isoformat(),
            'updatedAt': now.isoformat(),
            'timestamp': now.isoformat()
        }
        # POST stats to backend
        try:
            print(f"[DEBUG] POSTing stats to backend API for phone: {phone}")
            response = requests.post(
                f"{BACKEND_URL}/api/telegram/store-stats",
                json=stats_doc,
                headers={'Content-Type': 'application/json'},
                timeout=60
            )
            print(f"[DEBUG] Stats API response: {response.status_code} {response.text}")
            if response.status_code != 200:
                print(f"[ERROR] Failed to store stats via API: {response.status_code}")
        except Exception as e:
            print(f"[ERROR] Exception during stats API call: {e}")
        print(f'[✔] Session file stored at: {session_path}')
        await client.disconnect()
    except Exception as e:
        print(f'[ERROR] {e}')
        await client.disconnect()

if __name__ == '__main__':
    asyncio.run(main())
