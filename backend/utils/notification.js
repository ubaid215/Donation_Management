import { Resend } from 'resend';
import axios from 'axios';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailNotification({ to, subject, html, text }) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'donations@yourorg.com',
      to,
      subject,
      html,
      text
    });
 
    if (error) {
      console.error('Email sending error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}


// WhatsApp Configuration
const WHATSAPP_CONFIG = {
  PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
  API_VERSION: 'v22.0',
  TEMPLATE_NAME_PAKISTAN: 'donation_confirmation_thanks',
  TEMPLATE_NAME_INTERNATIONAL: 'receipt_confirm',
  LANGUAGE_CODE: 'en_us',
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000, // Start with 1 second
  TIMEOUT_MS: 15000 // 15 seconds timeout per attempt
};

/**
 * Determine which template to use based on phone number country code and admin preference
 */
function getTemplateNameForCountry(phoneNumber, sendDonationConfirmation = true) {
  const cleanPhone = phoneNumber.replace(/[\s\-]/g, '');
  
  if (!sendDonationConfirmation) {
    console.log('📧 Admin preference: Receipt confirmation - using template:', WHATSAPP_CONFIG.TEMPLATE_NAME_INTERNATIONAL);
    return WHATSAPP_CONFIG.TEMPLATE_NAME_INTERNATIONAL;
  }
  
  if (cleanPhone.startsWith('+92') || cleanPhone.startsWith('92')) {
    console.log('🇵🇰 Pakistani number detected - using template:', WHATSAPP_CONFIG.TEMPLATE_NAME_PAKISTAN);
    return WHATSAPP_CONFIG.TEMPLATE_NAME_PAKISTAN;
  }
  
  console.log('🌍 International number - using template:', WHATSAPP_CONFIG.TEMPLATE_NAME_PAKISTAN);
  return WHATSAPP_CONFIG.TEMPLATE_NAME_PAKISTAN;
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Determine if error is retryable (network/timeout) or permanent (config/validation)
 */
function isRetryableError(error) {
  // Network errors - retryable
  if (error.code === 'ECONNABORTED' || 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED' ||
      error.message?.includes('timeout') ||
      error.message?.includes('network')) {
    return true;
  }

  // HTTP status codes - retryable
  const status = error.response?.status;
  if (status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }

  // WhatsApp API specific errors - NOT retryable (permanent issues)
  const errorCode = error.response?.data?.error?.code;
  if (errorCode === 133010 || // Account not registered
      errorCode === 131026 || // Template doesn't exist
      errorCode === 190 ||    // Invalid access token
      errorCode === 100 ||    // Invalid parameter
      errorCode === 131047 || // Re-engagement message
      errorCode === 131031) { // Phone number not registered
    return false;
  }

  // Default: retry for unknown errors
  return true;
}

/**
 * Send WhatsApp notification with retry logic
 * @returns {Promise<Object>} - Success object or throws error with details
 */
export async function sendWhatsAppNotificationWithRetry({
  to,
  donorName,
  amount,
  purpose,
  paymentMethod,
  date,
  sendDonationConfirmation = true
}) {
  // Check if WhatsApp is configured
  if (!WHATSAPP_CONFIG.ACCESS_TOKEN || !WHATSAPP_CONFIG.PHONE_NUMBER_ID) {
    console.log('⚠️ WhatsApp not configured - skipping notification');
    return { 
      success: false, 
      skipped: true, 
      reason: 'WhatsApp not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in environment variables.',
      code: 'NOT_CONFIGURED'
    };
  }

  const formattedPhone = to.replace(/[\s\-\+]/g, '');
  const templateName = getTemplateNameForCountry(to, sendDonationConfirmation);
  const formattedDate = new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}/messages`;
  
  const payload = {
    messaging_product: 'whatsapp',
    to: formattedPhone,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: WHATSAPP_CONFIG.LANGUAGE_CODE
      },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: donorName },
            { type: 'text', text: amount.toString() },
            { type: 'text', text: purpose },
            { type: 'text', text: paymentMethod },
            { type: 'text', text: formattedDate }
          ]
        }
      ]
    }
  };

  let lastError = null;
  
  // Retry loop
  for (let attempt = 1; attempt <= WHATSAPP_CONFIG.MAX_RETRIES; attempt++) {
    try {
      console.log(`📤 WhatsApp attempt ${attempt}/${WHATSAPP_CONFIG.MAX_RETRIES} to ${formattedPhone} using template: ${templateName}`);
      
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: WHATSAPP_CONFIG.TIMEOUT_MS
      });

      // Success!
      console.log(`✅ WhatsApp sent successfully on attempt ${attempt}:`, {
        to: formattedPhone,
        template: templateName,
        messageId: response.data.messages[0].id
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        recipient: formattedPhone,
        templateUsed: templateName,
        templateType: sendDonationConfirmation ? 'Donation Confirmation' : 'Receipt Confirmation',
        timestamp: new Date(),
        attempt: attempt
      };

    } catch (error) {
      lastError = error;
      const errorDetails = {
        message: error.response?.data?.error?.message || error.message,
        code: error.response?.data?.error?.code,
        type: error.response?.data?.error?.type,
        status: error.response?.status,
        attempt: attempt
      };

      console.error(`❌ WhatsApp attempt ${attempt} failed:`, errorDetails);

      // Check if error is retryable
      if (!isRetryableError(error)) {
        console.error('⚠️ Permanent error detected - stopping retries');
        
        // Provide helpful error messages for common permanent errors
        let userMessage = errorDetails.message;
        if (errorDetails.code === 133010) {
          userMessage = 'Phone number not registered with WhatsApp Business';
        } else if (errorDetails.code === 131026) {
          userMessage = `Template "${templateName}" does not exist or is not approved`;
        } else if (errorDetails.code === 190) {
          userMessage = 'Invalid WhatsApp access token - please reconfigure';
        } else if (errorDetails.code === 131031) {
          userMessage = 'Recipient phone number is not a valid WhatsApp number';
        }

        throw {
          success: false,
          error: userMessage,
          errorCode: errorDetails.code,
          errorType: errorDetails.type,
          isPermanent: true,
          canRetry: false,
          details: errorDetails
        };
      }

      // If we have more attempts, wait with exponential backoff
      if (attempt < WHATSAPP_CONFIG.MAX_RETRIES) {
        const delayMs = WHATSAPP_CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying in ${delayMs}ms... (${attempt}/${WHATSAPP_CONFIG.MAX_RETRIES})`);
        await sleep(delayMs);
      }
    }
  }

  // All retries exhausted
  const finalError = {
    message: lastError?.response?.data?.error?.message || lastError?.message || 'Network error',
    code: lastError?.response?.data?.error?.code,
    type: lastError?.response?.data?.error?.type
  };

  console.error(`❌ All ${WHATSAPP_CONFIG.MAX_RETRIES} WhatsApp attempts failed`);
  
  throw {
    success: false,
    error: 'Unable to send WhatsApp message. Please check your internet connection and try again.',
    errorCode: finalError.code,
    errorType: finalError.type,
    isPermanent: false,
    canRetry: true,
    attempts: WHATSAPP_CONFIG.MAX_RETRIES,
    details: finalError
  };
}

/**
 * Legacy function - maintained for backward compatibility
 * Now calls the retry version
 */
export async function sendWhatsAppNotification(params) {
  return await sendWhatsAppNotificationWithRetry(params);
}

/**
 * Debug WhatsApp Configuration
 */
export async function debugWhatsAppConfig() {
  console.log('\n🔍 ===== WhatsApp Configuration Debug =====');
  console.log('Phone Number ID:', WHATSAPP_CONFIG.PHONE_NUMBER_ID || '❌ NOT SET');
  console.log('Access Token Set:', !!WHATSAPP_CONFIG.ACCESS_TOKEN ? '✅ YES' : '❌ NO');
  console.log('Template (Donation Confirmation - Pakistan):', WHATSAPP_CONFIG.TEMPLATE_NAME_PAKISTAN);
  console.log('Template (Receipt Confirmation - All):', WHATSAPP_CONFIG.TEMPLATE_NAME_INTERNATIONAL);
  console.log('API Version:', WHATSAPP_CONFIG.API_VERSION);
  console.log('Max Retries:', WHATSAPP_CONFIG.MAX_RETRIES);
  console.log('Timeout:', WHATSAPP_CONFIG.TIMEOUT_MS + 'ms');

  if (!WHATSAPP_CONFIG.ACCESS_TOKEN) {
    console.log('❌ Access Token is missing in environment variables!');
    return { configured: false, error: 'Access token missing' };
  }

  if (!WHATSAPP_CONFIG.PHONE_NUMBER_ID) {
    console.log('❌ Phone Number ID is missing in environment variables!');
    return { configured: false, error: 'Phone number ID missing' };
  }

  try {
    const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}`;
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`
      },
      params: {
        fields: 'verified_name,display_phone_number,quality_rating,account_id'
      }
    });
    console.log('✅ Phone Number Details:', response.data);
    console.log('==========================================\n');
    return { configured: true, details: response.data };
  } catch (error) {
    console.error('❌ Cannot fetch phone number details:');
    console.error('Error:', error.response?.data || error.message);
    console.log('==========================================\n');
    return { configured: false, error: error.response?.data || error.message };
  }
}

/**
 * List all available WhatsApp templates
 */
export async function listWhatsAppTemplates() {
  try {
    if (!WHATSAPP_CONFIG.ACCESS_TOKEN || !WHATSAPP_CONFIG.PHONE_NUMBER_ID) {
      throw new Error('WhatsApp not configured properly');
    }

    console.log('\n📋 ===== Fetching WhatsApp Templates =====');

    const phoneUrl = `https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}`;
    const phoneResponse = await axios.get(phoneUrl, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`
      },
      params: {
        fields: 'account_id'
      }
    });

    const waba_id = phoneResponse.data.account_id;
    console.log('WhatsApp Business Account ID:', waba_id);

    const templatesUrl = `https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${waba_id}/message_templates`;
    const templatesResponse = await axios.get(templatesUrl, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`
      }
    });

    console.log('\n📋 Available Templates:');
    if (templatesResponse.data.data.length === 0) {
      console.log('  ⚠️ No templates found. You need to create templates in Meta Business Manager.');
    } else {
      templatesResponse.data.data.forEach(template => {
        console.log(`  - ${template.name} (Status: ${template.status}, Language: ${template.language})`);
      });
    }
    console.log('==========================================\n');

    return templatesResponse.data.data;

  } catch (error) {
    console.error('❌ Failed to list templates:', error.response?.data || error.message);
    console.log('==========================================\n');
    throw error;
  }
}

/**
 * Check WhatsApp API health
 */
export async function checkWhatsAppHealth() {
  try {
    if (!WHATSAPP_CONFIG.ACCESS_TOKEN || !WHATSAPP_CONFIG.PHONE_NUMBER_ID) {
      return {
        healthy: false,
        error: 'WhatsApp not configured - missing credentials',
        configured: false
      };
    }

    const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`
      },
      params: {
        fields: 'verified_name,display_phone_number,quality_rating'
      }
    });

    console.log('✅ WhatsApp API is healthy:', response.data);
    return { healthy: true, data: response.data, configured: true };

  } catch (error) {
    console.error('❌ WhatsApp API health check failed:', error.response?.data || error.message);
    return {
      healthy: false,
      error: error.response?.data || error.message,
      configured: true
    };
  }
}

/**
 * Send test WhatsApp message (for activation/testing)
 */
export async function sendTestWhatsAppMessage(testPhoneNumber) {
  try {
    if (!WHATSAPP_CONFIG.ACCESS_TOKEN || !WHATSAPP_CONFIG.PHONE_NUMBER_ID) {
      throw new Error('WhatsApp not configured - missing credentials');
    }

    const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: testPhoneNumber.replace(/[\s\-\+]/g, ''),
      type: 'template',
      template: {
        name: 'hello_world',
        language: {
          code: 'en_US'
        }
      }
    };

    console.log('📤 Sending test message to:', testPhoneNumber);

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Test message sent:', response.data);
    return { success: true, data: response.data };

  } catch (error) {
    console.error('❌ Test message failed:', error.response?.data || error.message);
    throw error;
  }
}

// Export configuration for use in other modules
export const getWhatsAppConfig = () => ({
  isConfigured: !!(WHATSAPP_CONFIG.ACCESS_TOKEN && WHATSAPP_CONFIG.PHONE_NUMBER_ID),
  phoneNumberId: WHATSAPP_CONFIG.PHONE_NUMBER_ID,
  templateNamePakistan: WHATSAPP_CONFIG.TEMPLATE_NAME_PAKISTAN,
  templateNameInternational: WHATSAPP_CONFIG.TEMPLATE_NAME_INTERNATIONAL,
  hasAccessToken: !!WHATSAPP_CONFIG.ACCESS_TOKEN,
  hasPhoneNumberId: !!WHATSAPP_CONFIG.PHONE_NUMBER_ID,
  maxRetries: WHATSAPP_CONFIG.MAX_RETRIES,
  timeoutMs: WHATSAPP_CONFIG.TIMEOUT_MS
});