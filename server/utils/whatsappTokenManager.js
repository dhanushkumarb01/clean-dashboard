const axios = require('axios');

class WhatsAppTokenManager {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.appId = process.env.WHATSAPP_APP_ID;
    this.appSecret = process.env.WHATSAPP_APP_SECRET;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.wabaId = process.env.WHATSAPP_WABA_ID;
  }

  /**
   * Check if the current access token is valid
   */
  async validateToken() {
    try {
      console.log('🔍 Validating WhatsApp access token...');
      
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      console.log('✅ Token is valid:', response.data.display_phone_number);
      return {
        valid: true,
        data: response.data
      };
    } catch (error) {
      console.log('❌ Token validation failed:', error.response?.data || error.message);
      
      if (error.response?.data?.error?.code === 190) {
        return {
          valid: false,
          error: 'Token expired',
          code: 190,
          details: error.response.data
        };
      }
      
      return {
        valid: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Get token information including expiry
   */
  async getTokenInfo() {
    try {
      console.log('📊 Getting token information...');
      
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/debug_token`,
        {
          params: {
            input_token: this.accessToken,
            access_token: this.accessToken
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error getting token info:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Generate a long-lived token from a short-lived token
   * Note: This requires app secret and only works for certain token types
   */
  async generateLongLivedToken() {
    try {
      if (!this.appId || !this.appSecret) {
        throw new Error('App ID and App Secret are required for token extension');
      }

      console.log('🔄 Attempting to generate long-lived token...');
      
      const response = await axios.get(
        'https://graph.facebook.com/v18.0/oauth/access_token',
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: this.appId,
            client_secret: this.appSecret,
            fb_exchange_token: this.accessToken
          }
        }
      );

      console.log('✅ Long-lived token generated successfully');
      return {
        success: true,
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      console.error('Error generating long-lived token:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Get app access token (for certain operations)
   */
  async getAppAccessToken() {
    try {
      if (!this.appId || !this.appSecret) {
        throw new Error('App ID and App Secret are required');
      }

      console.log('🔑 Getting app access token...');
      
      const response = await axios.get(
        'https://graph.facebook.com/v18.0/oauth/access_token',
        {
          params: {
            client_id: this.appId,
            client_secret: this.appSecret,
            grant_type: 'client_credentials'
          }
        }
      );

      return {
        success: true,
        accessToken: response.data.access_token
      };
    } catch (error) {
      console.error('Error getting app access token:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Test WhatsApp API connection with current token
   */
  async testConnection() {
    try {
      console.log('🧪 Testing WhatsApp API connection...');
      
      const validation = await this.validateToken();
      if (!validation.valid) {
        return validation;
      }

      // Try to get business account info
      const wabaResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${this.wabaId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return {
        valid: true,
        phoneNumber: validation.data,
        businessAccount: wabaResponse.data,
        message: 'Connection successful'
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Get instructions for manual token refresh
   */
  getTokenRefreshInstructions() {
    return {
      steps: [
        "1. Go to Meta for Developers (https://developers.facebook.com/)",
        "2. Navigate to your WhatsApp Business app",
        "3. Go to WhatsApp > Getting Started",
        "4. Find the 'Temporary access token' section",
        "5. Click 'Generate token' or 'Refresh token'",
        "6. Copy the new token",
        "7. Update WHATSAPP_ACCESS_TOKEN in your .env file",
        "8. Restart your server"
      ],
      notes: [
        "• Temporary tokens expire after 24 hours",
        "• For production, set up a permanent token",
        "• System user tokens last longer but require business verification",
        "• Always keep your tokens secure and never commit them to version control"
      ],
      links: {
        developerDashboard: "https://developers.facebook.com/",
        documentation: "https://developers.facebook.com/docs/whatsapp/business-management-api/get-started",
        businessVerification: "https://developers.facebook.com/docs/development/release/business-verification"
      }
    };
  }
}

module.exports = WhatsAppTokenManager;
