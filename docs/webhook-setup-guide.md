# 🔗 WhatsApp Webhook Setup Guide

## Current Issue
Your webhook URL `https://nice-rules-drum.loca.lt/api/whatsapp/webhook` is not receiving messages because:
1. LocalTunnel URL might be inactive
2. Webhook configuration in Meta Dashboard needs verification

## 🎯 Solution Steps

### Step 1: Set Up Public URL (Choose One Option)

#### Option A: Using ngrok (Recommended for Testing)
```bash
# Install ngrok if not already installed
# Download from https://ngrok.com/

# Start your server first
cd backend
npm start

# In another terminal, expose port 5000
ngrok http 5000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

#### Option B: Using LocalTunnel (Alternative)
```bash
# Install localtunnel globally
npm install -g localtunnel

# Start your server first
cd backend
npm start

# In another terminal, create tunnel
lt --port 5000 --subdomain whatsapp-webhook-dhanush

# Copy the HTTPS URL
```

#### Option C: Deploy to Cloud (Production)
- Deploy to Heroku, Vercel, Railway, or DigitalOcean
- Get permanent HTTPS URL

### Step 2: Update Webhook URL in .env
```env
WHATSAPP_WEBHOOK_URL=https://YOUR_NEW_URL/api/whatsapp/webhook
```

### Step 3: Configure Webhook in Meta Dashboard

1. **Go to Meta for Developers**
   - Visit: https://developers.facebook.com/
   - Navigate to your WhatsApp Business app

2. **Configure Webhook**
   - Go to **WhatsApp** → **Configuration**
   - Click **"Edit"** next to Webhook
   - Enter your webhook URL: `https://YOUR_NEW_URL/api/whatsapp/webhook`
   - Enter verify token: `whatsapp_webhook_verify_secure_token_2024`
   - Click **"Verify and Save"**

3. **Subscribe to Webhook Fields**
   - Subscribe to: `messages` and `message_statuses`
   - Click **"Save"**

### Step 4: Test Webhook
```bash
# Test webhook verification
curl -X GET "YOUR_WEBHOOK_URL?hub.mode=subscribe&hub.challenge=test&hub.verify_token=whatsapp_webhook_verify_secure_token_2024"

# Should return "test"
```

## 🧪 Testing Instructions

### Test 1: Webhook Verification
- Configure webhook in Meta Dashboard
- Should see "✅ WhatsApp Webhook verification successful" in server logs

### Test 2: Incoming Messages
- Send message TO your WhatsApp Business number from another phone
- Check server logs for "🔔 === WEBHOOK RECEIVED ==="
- Verify message appears in database

### Test 3: Outgoing Messages (Meta Dashboard)
- Send message FROM Meta Dashboard/WhatsApp Business Manager
- Should be captured via webhook
- Check if message appears in your dashboard

## 🔧 Debugging Commands

```bash
# Check webhook endpoint directly
curl -X POST YOUR_WEBHOOK_URL/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Monitor server logs
cd backend
npm start
# Watch for webhook logs
```

## 📱 Meta Dashboard Message Testing

1. **Go to WhatsApp Business Manager**
   - Visit: https://business.facebook.com/
   - Navigate to your WhatsApp account

2. **Test Sending Messages**
   - Use the message composer in Business Manager
   - Send test messages to verified phone numbers
   - Messages should appear in your dashboard

## ⚠️ Important Notes

- Webhook URL must be HTTPS (not HTTP)
- Webhook must be publicly accessible
- Verify token must match exactly
- Test with a real phone number that can receive WhatsApp messages
- For production, use a stable hosting service (not LocalTunnel/ngrok)
