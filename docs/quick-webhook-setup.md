# 🚀 Quick WhatsApp Webhook Setup

## ✅ **GOOD NEWS!**
- ✅ Your access token is FRESH and updated!
- ✅ Verify token is now correctly set
- ❌ Just need to fix the webhook URL (LocalTunnel is down)

## 🎯 **IMMEDIATE STEPS**

### 1. Install ngrok
```bash
# Download and install ngrok
# Go to https://ngrok.com/download
# Or install via npm:
npm install -g ngrok

# Sign up for free account and get auth token
# Run: ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 2. Start Your Server
```bash
# Terminal 1: Start your backend server
cd backend
npm start
# Leave this running!
```

### 3. Start ngrok Tunnel
```bash
# Terminal 2: Create public tunnel
ngrok http 5000

# Copy the HTTPS URL that appears
# Example: https://abc123-def456.ngrok-free.app
```

### 4. Update .env File
Replace line 20 in `backend/.env`:
```env
# OLD (LocalTunnel - broken):
WHATSAPP_WEBHOOK_URL=https://nice-rules-drum.loca.lt/api/whatsapp/webhook

# NEW (your ngrok URL):
WHATSAPP_WEBHOOK_URL=https://YOUR_NGROK_URL.ngrok-free.app/api/whatsapp/webhook
```

### 5. Configure Meta Dashboard
1. Go to **https://developers.facebook.com/**
2. Navigate to your **WhatsApp Business app**
3. Go to **WhatsApp** → **Configuration**
4. Click **"Edit"** next to Webhook
5. Enter webhook URL: `https://YOUR_NGROK_URL.ngrok-free.app/api/whatsapp/webhook`
6. Enter verify token: `whatsapp_webhook_verify_secure_token_2024`
7. Click **"Verify and Save"**
8. Subscribe to: **messages** and **message_statuses**

### 6. Test Everything
```bash
# Test the webhook setup helper
node setup-webhook.js

# Should show "✅ Webhook verification test PASSED!"
```

## 🧪 **Testing Your Setup**

### Test 1: Send from Meta Dashboard
1. Go to **https://business.facebook.com/**
2. Navigate to your WhatsApp account
3. Send a message to a verified phone number
4. **Message should appear in your React dashboard!**

### Test 2: Receive Messages
1. Send a message **TO** your WhatsApp Business number from another phone
2. Check server logs for webhook activity
3. **Message should appear in your React dashboard!**

### Test 3: Your Frontend Still Works
1. Go to **http://localhost:3000/whatsapp**
2. Send message using the form
3. **Should work as before!**

## 🎉 **Expected Results**

Once working properly:
- ✅ Messages sent from Meta Dashboard → Captured via webhook → Shown in React dashboard
- ✅ Messages received from users → Captured via webhook → Shown in React dashboard  
- ✅ Messages sent from React dashboard → Sent via API → Shown in React dashboard
- ✅ All statistics update automatically
- ✅ Both incoming and outgoing messages are properly tracked

## 🆘 **If You Need Help**

Run these commands to debug:
```bash
# Check current webhook status
node setup-webhook.js

# Check token status
node whatsapp-token-checker.js

# Test direct API call
curl -X GET "YOUR_WEBHOOK_URL?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=whatsapp_webhook_verify_secure_token_2024"
```

**Expected response:** `test123`

---

**⚡ QUICK TIP:** Keep both terminals running (backend server + ngrok) while testing!
