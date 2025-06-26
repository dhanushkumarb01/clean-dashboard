# Telegram Statistics Collection Module

This module provides automated collection of Telegram group and channel statistics using the Telethon library and stores the data in MongoDB via the Express API.

## Features

- **Real-time Statistics**: Collects data from all joined Telegram groups and channels
- **User Analytics**: Tracks most active users with message counts and Telegram IDs
- **Group Insights**: Analyzes most active groups and channels with engagement metrics
- **Automated Collection**: Configurable cron jobs for regular data updates
- **Error Handling**: Robust logging and retry mechanisms
- **Rate Limiting**: Respects Telegram API limits and handles flood wait errors

## Prerequisites

- Python 3.7 or higher
- Telegram API credentials (API ID and API Hash)
- Node.js backend running with MongoDB
- Access to Telegram groups/channels you want to monitor

## Setup Instructions

### 1. Get Telegram API Credentials

1. Visit [https://my.telegram.org/apps](https://my.telegram.org/apps)
2. Log in with your Telegram account
3. Create a new application
4. Note down your `API_ID` and `API_HASH`

### 2. Install Python Dependencies

```bash
cd scripts
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy the example environment file and update it with your credentials:

```bash
cp env.example .env
```

Edit `.env` with your actual values:

```bash
TELEGRAM_API_ID=your_actual_api_id
TELEGRAM_API_HASH=your_actual_api_hash
TELEGRAM_PHONE_NUMBER=+1234567890
BACKEND_URL=http://localhost:5000
```

### 4. First Time Authentication

Run the script for the first time to authenticate with Telegram:

```bash
python3 telegramStats.py
```

You'll be prompted to:
1. Enter the verification code sent to your Telegram
2. Enter your 2FA password if enabled

The session will be saved for future runs.

## Usage

### Manual Execution

```bash
# Run the statistics collection
python3 telegramStats.py

# Or use the shell script (recommended for cron jobs)
chmod +x runTelegramStats.sh
./runTelegramStats.sh
```

### Automated Execution with Cron

Add to your crontab for automatic execution:

```bash
# Edit crontab
crontab -e

# Add one of these lines:
# Every 10 minutes
*/10 * * * * /path/to/scripts/runTelegramStats.sh >> /path/to/scripts/logs/cron.log 2>&1

# Every hour
0 * * * * /path/to/scripts/runTelegramStats.sh >> /path/to/scripts/logs/cron.log 2>&1

# Every 6 hours
0 */6 * * * /path/to/scripts/runTelegramStats.sh >> /path/to/scripts/logs/cron.log 2>&1
```

### Windows Task Scheduler

For Windows systems, create a scheduled task:

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., every 10 minutes)
4. Action: Start a program
5. Program: `python`
6. Arguments: `telegramStats.py`
7. Start in: `C:\path\to\scripts`

## Data Collected

The script collects the following statistics:

### Basic Metrics
- **Total Groups**: Count of all monitored groups and channels
- **Active Users**: Users who sent messages in the last 7 days
- **Total Users**: Unique users across all groups
- **Total Messages**: Message count from the last 7 days
- **Total Media Files**: Photos and documents shared

### Engagement Metrics
- **Message Rate**: Average messages per day
- **Rate Change**: Percentage change in activity
- **Group Propagation**: Percentage of groups with recent activity
- **Avg Views/Message**: Average engagement per message

### User Analytics
- **Most Active Users**: Top 10 users by message count
- **Top Users by Groups**: Users with highest group participation

### Group Analytics
- **Most Active Groups**: Top 10 groups by message activity
- **Group Types**: Distinction between groups and channels

## File Structure

```
scripts/
├── telegramStats.py          # Main collection script
├── runTelegramStats.sh       # Shell script wrapper
├── requirements.txt          # Python dependencies
├── env.example              # Environment variables template
├── .env                     # Your environment variables (create this)
├── logs/                    # Log files directory
│   ├── telegram_stats.log   # Python script logs
│   ├── cron.log            # Cron job logs
│   └── last_run_status.txt # Last run status
└── telegram_stats_session.session  # Telegram session file
```

## Error Handling

The script includes comprehensive error handling:

- **Flood Wait Errors**: Automatically waits and retries when rate limited
- **Network Errors**: Retries on connection failures
- **Authentication Errors**: Handles session expiration and 2FA
- **API Errors**: Graceful handling of Telegram API errors
- **Logging**: Detailed logs for debugging and monitoring

## Monitoring

### Check Last Run Status

```bash
cat logs/last_run_status.txt
```

### View Logs

```bash
# View recent logs
tail -f logs/telegram_stats.log

# View cron logs
tail -f logs/cron.log
```

### Test Backend Connection

```bash
curl -X GET http://localhost:5000/api/telegram/stats
```

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Check that `.env` file exists and has correct values
   - Verify `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, and `TELEGRAM_PHONE_NUMBER`

2. **"Required Python packages not installed"**
   - Run `pip install -r requirements.txt`
   - Check Python version: `python3 --version`

3. **"Telegram authentication failed"**
   - Delete `telegram_stats_session.session` file
   - Re-run the script and re-authenticate

4. **"Backend connection failed"**
   - Verify backend is running on `BACKEND_URL`
   - Check network connectivity
   - Verify MongoDB is accessible

5. **"Flood wait error"**
   - Normal behavior, script will wait automatically
   - Consider reducing collection frequency if frequent

### Performance Optimization

- **Reduce Collection Frequency**: If hitting rate limits, increase interval
- **Limit Groups**: Modify script to exclude specific groups
- **Optimize Time Range**: Adjust the 7-day window in the script
- **Use Virtual Environment**: Isolate Python dependencies

## Security Considerations

- **API Credentials**: Keep `.env` file secure and never commit to version control
- **Session File**: The `.session` file contains authentication tokens
- **Network Security**: Use HTTPS for backend communication in production
- **Access Control**: Ensure only authorized users can run the script

## API Integration

The script sends data to the Express backend at these endpoints:

- `POST /api/telegram/store-stats` - Store new statistics
- `GET /api/telegram/stats` - Retrieve latest statistics
- `GET /api/telegram/most-active-users` - Get user analytics
- `GET /api/telegram/most-active-groups` - Get group analytics

## Support

For issues or questions:

1. Check the logs in `logs/telegram_stats.log`
2. Verify environment variables are set correctly
3. Test backend connectivity
4. Review Telegram API documentation
5. Check for rate limiting or authentication issues

## License

This module is part of the dashboard-internship project and follows the same license terms. 