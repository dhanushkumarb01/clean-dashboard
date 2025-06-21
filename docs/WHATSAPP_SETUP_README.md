# WhatsApp Business Dashboard Integration

This document provides instructions for setting up and using the WhatsApp Business dashboard that has been integrated into your existing React + Node.js + MongoDB application.

## 🎯 Features

The WhatsApp dashboard includes:

- **Real-time Statistics**: Message counts, delivery rates, response times
- **Message Management**: Send messages via WhatsApp Business API
- **Contact Management**: View and manage active contacts
- **Message History**: Track sent and received messages
- **Webhook Integration**: Receive incoming messages automatically
- **Professional UI**: Consistent with existing Telegram and YouTube dashboards

## 🛠 Setup Instructions

### 1. WhatsApp Business API Setup

1. **Create a Meta Developer Account**
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create an account or log in

2. **Create a WhatsApp Business App**
   - Create a new app and select "Business" type
   - Add WhatsApp product to your app

3. **Get Your Credentials**
   - **Access Token**: From your app dashboard
   - **Phone Number ID**: From WhatsApp > Getting Started
   - **WABA ID**: Your WhatsApp Business Account ID
   - **Verify Token**: Create a secure random string for webhook verification

### 2. Environment Configuration

1. **Backend Configuration**
   Copy the example environment file and add your credentials:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Add WhatsApp Credentials to backend/.env**:
   ```env
   # WhatsApp Business API Configuration
   WHATSAPP_ACCESS_TOKEN=your_actual_access_token_here
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
   WHATSAPP_WABA_ID=your_waba_id_here
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token_here
   ```

### 3. Webhook Configuration

1. **Set Up Webhook URL**
   - In your Meta App Dashboard, go to WhatsApp > Configuration
   - Set webhook URL to: `https://your-domain.com/api/whatsapp/webhook`
   - Use the verify token you set in your .env file

2. **Subscribe to Webhook Fields**
   - Subscribe to: `messages` and `message_statuses`

### 4. Install Dependencies and Start

1. **Install Backend Dependencies** (if not already done):
   ```bash
   cd backend
   npm install
   ```

2. **Start the Application**:
   ```bash
   # Start backend
   cd backend
   npm start

   # Start frontend (in another terminal)
   cd ..
   npm start
   ```

## 📱 Using the WhatsApp Dashboard

### Accessing the Dashboard

1. Navigate to `/whatsapp` in your application
2. The dashboard will show:
   - Message statistics
   - Send message form
   - Recent messages list
   - Active contacts

### Sending Messages

1. Use the "Send WhatsApp Message" form
2. Enter phone number with country code (e.g., +1234567890)
3. Type your message (max 1600 characters)
4. Click "Send Message"

### Viewing Statistics

The dashboard displays:
- **Total Messages**: All messages sent and received
- **Messages Sent/Received**: Breakdown by direction
- **Unique Contacts**: Number of different contacts
- **24h/7d Messages**: Recent activity metrics
- **Delivery Rate**: Percentage of successfully delivered messages
- **Average Response Time**: How quickly you respond to messages

## 🔧 Technical Implementation

### Backend Components

- **Model**: `backend/models/WhatsAppMessage.js` - MongoDB schema for messages
- **Controller**: `backend/controllers/whatsappController.js` - Business logic
- **Routes**: `backend/routes/whatsapp.js` - API endpoints
- **Server**: Routes mounted in `backend/server.js`

### Frontend Components

- **Main Dashboard**: `src/pages/WhatsAppDashboard/WhatsAppDashboard.js`
- **Stat Cards**: `src/pages/WhatsAppDashboard/WhatsAppStatCard.js`
- **Send Form**: `src/pages/WhatsAppDashboard/SendMessageForm.js`
- **Messages List**: `src/pages/WhatsAppDashboard/MessagesList.js`
- **Contacts List**: `src/pages/WhatsAppDashboard/ContactsList.js`

### API Endpoints

- `GET /api/whatsapp/stats` - Dashboard statistics
- `POST /api/whatsapp/send-message` - Send message
- `GET /api/whatsapp/messages` - Recent messages
- `GET /api/whatsapp/conversation/:phoneNumber` - Conversation history
- `GET/POST /api/whatsapp/webhook` - Webhook for incoming messages

## 🚨 Important Notes

### Security

- Keep your access token secure and never commit it to version control
- Use HTTPS for webhook URLs in production
- Implement rate limiting for message sending

### Rate Limits

- WhatsApp Business API has rate limits
- Free tier: 1000 conversations per month
- Monitor your usage in Meta Business Manager

### Message Types

Currently supports:
- Text messages
- Future: Images, documents, templates

### Phone Number Format

- Always include country code
- Format: +[country code][phone number]
- Example: +1234567890

## 🐛 Troubleshooting

### Common Issues

1. **"WhatsApp API credentials not configured"**
   - Check that all environment variables are set correctly
   - Restart the server after adding credentials

2. **Messages not being received**
   - Verify webhook URL is correctly configured
   - Check webhook verify token matches
   - Ensure webhook URL is accessible from the internet

3. **"Failed to send message"**
   - Verify access token is valid and not expired
   - Check phone number format includes country code
   - Ensure you have permission to message the number

### Debug Mode

Enable detailed logging by setting `NODE_ENV=development` in your backend .env file.

## 📈 Production Deployment

### Requirements

1. **HTTPS**: WhatsApp requires HTTPS for webhooks
2. **Domain Verification**: Verify your domain with Meta
3. **Business Verification**: Complete business verification for higher limits

### Scaling Considerations

- Implement message queuing for high volume
- Add database indexing for message queries
- Consider caching for frequently accessed data

## 🤝 Integration with Existing Features

The WhatsApp dashboard integrates seamlessly with:
- Existing authentication system
- Sidebar navigation
- Error handling patterns
- API architecture
- Database connection

## 📞 Support

For WhatsApp Business API support:
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Meta Developer Support](https://developers.facebook.com/support/)

For technical issues with this integration:
- Check the browser console for frontend errors
- Check server logs for backend errors
- Verify all environment variables are correctly set
