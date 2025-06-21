# Telegram Database Connection Fix Guide

## 🚨 Issue Identified
The MongoDB connection is timing out, which prevents the Telegram message collection system from working. This is a common issue that can be resolved quickly.

## 🔧 Quick Fix Steps

### Step 1: Check if MongoDB is Running
Run this command to check MongoDB status:

**Windows:**
```bash
# Check if MongoDB service is running
net start | findstr MongoDB

# If not running, start it:
net start MongoDB
```

**macOS/Linux:**
```bash
# Check MongoDB status
sudo systemctl status mongod

# If not running, start it:
sudo systemctl start mongod
```

### Step 2: Test Database Connection
Run the diagnostic script:
```bash
cd tests
node setup-telegram-database.js
```

### Step 3: If Step 2 Fails, Try Manual MongoDB Setup

#### Option A: Install MongoDB (if not installed)
1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Install with default settings
3. Start the MongoDB service

#### Option B: Use MongoDB Compass for Visual Check
1. Download MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Connect to: `mongodb://localhost:27017`
3. If connection works, the issue is in your Node.js setup

### Step 4: Fix Node.js Environment Variables
Check your `server/.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/telegram_dashboard
```

### Step 5: Alternative Database Solutions

#### Option A: Use a different database name
Update `server/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/test_db
```

#### Option B: Use cloud MongoDB (MongoDB Atlas)
1. Create free account at https://cloud.mongodb.com/
2. Create cluster and get connection string
3. Update `server/.env` with your Atlas connection string

## 🧪 Test the Fix

After fixing MongoDB, run these tests in order:

### 1. Test Database Connection
```bash
cd tests
node setup-telegram-database.js
```
Expected: ✅ All Database Tests Passed!

### 2. Test Full Message System
```bash
cd tests
node test-telegram-message-collection.js
```
Expected: ✅ All tests completed successfully!

### 3. Test Backend API
```bash
cd server
npm run dev
```
Expected: Server running on port 5000

## 🔄 Alternative: Use File-Based Storage (Emergency Fallback)

If MongoDB continues to fail, you can temporarily use file-based storage:

1. Create `server/data/` directory
2. Update message storage to use JSON files instead of MongoDB
3. This allows you to test the message collection while fixing MongoDB

## 🏥 Common MongoDB Issues & Solutions

### Issue: "MongooseError: Operation buffering timed out"
**Solution:** MongoDB service is not running
```bash
# Windows
net start MongoDB

# macOS/Linux  
sudo systemctl start mongod
```

### Issue: "ECONNREFUSED 127.0.0.1:27017"
**Solution:** MongoDB is not installed or configured
- Reinstall MongoDB Community Server
- Check firewall/antivirus blocking port 27017

### Issue: "Authentication failed"
**Solution:** MongoDB has authentication enabled
```env
MONGODB_URI=mongodb://username:password@localhost:27017/telegram_dashboard
```

### Issue: "Cannot connect to Docker MongoDB"
**Solution:** If using Docker
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## 📞 Emergency Support Commands

### Quick MongoDB Restart (Windows)
```bash
net stop MongoDB
net start MongoDB
```

### Quick MongoDB Restart (macOS/Linux)
```bash
sudo systemctl restart mongod
```

### Check MongoDB Logs
```bash
# Windows
type "C:\Program Files\MongoDB\Server\4.4\log\mongod.log"

# macOS/Linux
tail -f /var/log/mongodb/mongod.log
```

### Test Connection with MongoDB Shell
```bash
mongo
# If this connects, MongoDB is working

# In mongo shell:
show dbs
use telegram_dashboard
show collections
```

## ✅ Success Indicators

After fixing, you should see:
- ✅ MongoDB connection successful
- ✅ Database permissions OK
- ✅ Test data creation successful
- ✅ All queries working

## 🚀 Next Steps After Fix

1. **Run the setup script:** `node tests/setup-telegram-database.js`
2. **Run the full test:** `node tests/test-telegram-message-collection.js`
3. **Start the backend:** `cd server && npm run dev`
4. **Start the frontend:** `npm start`
5. **Test message collection:** `cd scripts && python telegramStats.py`

## 💡 Prevention Tips

1. **Always start MongoDB before testing**
2. **Add MongoDB to system startup services**
3. **Keep a backup connection string ready**
4. **Monitor MongoDB logs for early warning signs**

---

## 🔗 Need More Help?

If these steps don't work, the issue might be:
- Windows firewall blocking MongoDB
- Antivirus software interference  
- Port 27017 already in use by another service
- Corrupted MongoDB installation

Contact system administrator or provide error logs for advanced troubleshooting.
