import api from './api';

class WebhookService {
  /**
   * Get webhook status and statistics
   */
  async getWebhookStatus() {
    try {
      const response = await api.get('/webhook/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching webhook status:', error);
      
      // Return a structured error response
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        return {
          success: false,
          error: error.response.data?.error || `Server error: ${error.response.status}`,
          stats: { pending: 0, sent: 0, delivered: 0, read: 0, failed: 0, total: 0 },
          recentActivity: []
        };
      } else if (error.request) {
        // The request was made but no response was received
        return {
          success: false,
          error: 'No response from server. Please check your connection.',
          stats: { pending: 0, sent: 0, delivered: 0, read: 0, failed: 0, total: 0 },
          recentActivity: []
        };
      } else {
        // Something happened in setting up the request that triggered an Error
        return {
          success: false,
          error: error.message || 'Failed to fetch webhook status',
          stats: { pending: 0, sent: 0, delivered: 0, read: 0, failed: 0, total: 0 },
          recentActivity: []
        };
      }
    }
  }

  /**
   * Get details for a specific message
   */
  async getMessageDetails(messageId) {
    try {
      const response = await api.get(`/webhook/message/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching message details:', error);
      throw error;
    }
  }

  /**
   * Get message timeline/audit logs
   */
  async getMessageTimeline(donationId) {
    try {
      const response = await api.get(`/donations/${donationId}/history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching message timeline:', error);
      throw error;
    }
  }

  /**
   * Test webhook (admin only)
   */
  async testWebhook(payload) {
    try {
      const response = await api.post('/webhook/test', payload);
      return response.data;
    } catch (error) {
      console.error('Error testing webhook:', error);
      throw error;
    }
  }
}

export default new WebhookService();