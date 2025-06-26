# 🚀 Professional Telegram Data Collection Setup

## Overview
This guide will help you collect real Telegram statistics from your account and display them in your dashboard.

## Prerequisites
- ✅ Backend server running on port 5000
- ✅ Frontend running on port 3000
- ✅ MongoDB connected
- ✅ Python 3.7+ installed

## Step 1: Get Telegram API Credentials

1. **Visit Telegram API Development**
   - Go to: https://my.telegram.org/apps
   - Sign in with your Telegram account

2. **Create New Application**
   - Click "Create new application"
   - Fill in the form:
     - **App title**: `Dashboard Analytics` (or any name)
     - **Short name**: `dashboard` (or any short name)
     - **Platform**: `Desktop`
     - **Description**: `Telegram statistics collection for dashboard`

3. **Save Your Credentials**
   - Note your `api_id` (number)
   - Note your `api_hash` (32-character string)
   - Keep these secure!

## Step 2: Configure Environment

1. **Edit Environment File**
   ```bash
   cd scripts
   notepad .env
   ```

2. **Add Your Credentials**
   ```env
   TELEGRAM_API_ID=your_api_id_here
   TELEGRAM_API_HASH=your_api_hash_here
   TELEGRAM_PHONE_NUMBER=+1234567890
   BACKEND_URL=http://localhost:5000
   ```

3. **Replace Placeholders**
   - `your_api_id_here` → Your actual API ID (number)
   - `your_api_hash_here` → Your actual API hash (string)
   - `+1234567890` → Your actual phone number with country code

## Step 3: Verify Setup

1. **Check Environment**
   ```bash
   python clear_all_data.py
   ```
   This will verify your environment variables are set correctly.

## Step 4: Collect Real Data

1. **Run Enhanced Collection Script**
   ```bash
   python collect_real_data.py
   ```

2. **Authentication Process**
   - First time: Enter verification code sent to your Telegram
   - 2FA users: Enter your 2FA password if prompted
   - Session will be saved for future runs

3. **Monitor Progress**
   - Watch real-time progress updates
   - See which groups are being analyzed
   - Check for any errors or rate limits

## Step 5: View Your Dashboard

1. **Refresh Dashboard**
   - Go to: http://localhost:3000
   - Click "Telegram" tab
   - See your real statistics!

## What Data is Collected

### Basic Statistics
- **Total Groups**: Number of groups and channels you're in
- **Active Users**: Users who sent messages in the last 7 days
- **Total Users**: Unique users across all your groups
- **Total Messages**: Messages in the last 7 days
- **Total Media Files**: Media files shared in the last 7 days

### Advanced Metrics
- **Message Rate**: Average messages per day
- **Group Propagation**: Percentage of active groups
- **Average Views**: Simplified engagement metric

### User Analytics
- **Most Active Users**: Top 10 users by message count
- **Most Active Groups**: Top 10 groups by activity
- **Top Users by Groups**: Users with most group memberships

## Troubleshooting

### Common Issues

1. **"Missing API credentials"**
   - Check your `.env` file
   - Ensure no extra spaces or quotes
   - Verify API ID is a number, API hash is a string

2. **"ApiIdInvalidError"**
   - Double-check your API ID and hash
   - Make sure you copied them correctly from my.telegram.org

3. **"Phone number invalid"**
   - Use international format: `+1234567890`
   - Include country code

4. **"Rate limited"**
   - Script automatically handles rate limits
   - Just wait for it to continue

5. **"No data found"**
   - Make sure you're in some Telegram groups
   - Check if groups have recent activity

### Performance Notes

- **Collection Time**: 2-10 minutes depending on group count
- **Rate Limits**: Automatically handled with delays
- **Memory Usage**: Minimal for typical group sizes
- **Network**: Moderate bandwidth usage

## Automation Setup

### Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Every 10 minutes
4. Action: Start a program
5. Program: `python`
6. Arguments: `C:\path\to\your\project\scripts\collect_real_data.py`

### Linux/macOS Cron
```bash
crontab -e
# Add this line:
*/10 * * * * /path/to/your/project/scripts/collect_real_data.py
```

## Security Best Practices

1. **Keep Credentials Secure**
   - Never commit `.env` files to version control
   - Use environment variables in production

2. **Session Files**
   - `telegram_real_session.session` contains authentication
   - Keep this file secure
   - Delete if compromised

3. **Rate Limiting**
   - Respect Telegram's rate limits
   - Don't run multiple instances simultaneously

## Monitoring

### Logs
- Check `telegram_collection.log` for detailed logs
- Monitor console output for real-time status

### Dashboard Updates
- Data updates automatically when script runs
- Refresh dashboard to see latest statistics

## Support

If you encounter issues:
1. Check the logs in `telegram_collection.log`
2. Verify your API credentials
3. Ensure your backend is running
4. Check your internet connection

## Next Steps

Once you have real data:
1. **Analyze Trends**: Look at your most active groups
2. **Identify Patterns**: See which users are most engaged
3. **Optimize Engagement**: Focus on your most active communities
4. **Set Up Automation**: Schedule regular data collection

---

**🎉 Congratulations!** You now have a professional Telegram analytics dashboard with real data from your account. 