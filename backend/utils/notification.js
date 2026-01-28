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
  TEMPLATE_NAME_PAKISTAN: 'donation_confirmation_utility', // For Pakistani numbers (+92)
  TEMPLATE_NAME_INTERNATIONAL: 'receipt_confirm',  // For other countries
  LANGUAGE_CODE: 'en_us'
};

/**
 * Determine which template to use based on phone number country code
 * @param {string} phoneNumber - Phone number with country code
 * @returns {string} - Template name to use
 */
function getTemplateNameForCountry(phoneNumber) {
  // Remove all non-digit characters except +
  const cleanPhone = phoneNumber.replace(/[\s\-]/g, '');
  
  // Check if it's a Pakistani number (starts with +92 or 92)
  if (cleanPhone.startsWith('+92') || cleanPhone.startsWith('92')) {
    console.log('🇵🇰 Pakistani number detected - using template:', WHATSAPP_CONFIG.TEMPLATE_NAME_PAKISTAN);
    return WHATSAPP_CONFIG.TEMPLATE_NAME_PAKISTAN;
  }
  
  // Default to international template for all other countries
  console.log('🌍 International number detected - using template:', WHATSAPP_CONFIG.TEMPLATE_NAME_INTERNATIONAL);
  return WHATSAPP_CONFIG.TEMPLATE_NAME_INTERNATIONAL;
}

/**
 * Debug WhatsApp Configuration
 */
export async function debugWhatsAppConfig() {
  console.log('\n🔍 ===== WhatsApp Configuration Debug =====');
  console.log('Phone Number ID:', WHATSAPP_CONFIG.PHONE_NUMBER_ID || '❌ NOT SET');
  console.log('Access Token Set:', !!WHATSAPP_CONFIG.ACCESS_TOKEN ? '✅ YES' : '❌ NO');
  console.log('Template (Pakistan):', WHATSAPP_CONFIG.TEMPLATE_NAME_PAKISTAN);
  console.log('Template (International):', WHATSAPP_CONFIG.TEMPLATE_NAME_INTERNATIONAL);
  console.log('API Version:', WHATSAPP_CONFIG.API_VERSION);

  if (!WHATSAPP_CONFIG.ACCESS_TOKEN) {
    console.log('❌ Access Token is missing in environment variables!');
    return { configured: false, error: 'Access token missing' };
  }

  if (!WHATSAPP_CONFIG.PHONE_NUMBER_ID) {
    console.log('❌ Phone Number ID is missing in environment variables!');
    return { configured: false, error: 'Phone number ID missing' };
  }

  // Try to get phone number details
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

    // First, get the WhatsApp Business Account ID
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

    // Now get templates for this account
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
      configured: true // Credentials exist but something else is wrong
    };
  }
}

/**
 * Send WhatsApp template message using Meta Cloud API
 * @param {Object} params - Message parameters
 * @param {string} params.to - Recipient phone number (format: 923001234567)
 * @param {string} params.donorName - Donor's name
 * @param {string} params.amount - Donation amount
 * @param {string} params.purpose - Donation purpose
 * @param {string} params.paymentMethod - Payment method
 * @param {string} params.date - Donation date
 */
export async function sendWhatsAppNotification({
  to,
  donorName,
  amount,
  purpose,
  paymentMethod,
  date
}) {
  try {
    // Validate configuration
    if (!WHATSAPP_CONFIG.ACCESS_TOKEN || !WHATSAPP_CONFIG.PHONE_NUMBER_ID) {
      console.log('⚠️ WhatsApp not configured - skipping notification');
      console.log('   Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env file');
      return { success: false, skipped: true, reason: 'Not configured' };
    }

    // Ensure it starts with country code
    const formattedPhone = to.replace(/[\s\-\+]/g, '');
    const recipientPhone = formattedPhone;

    // Determine which template to use based on country code
    const templateName = getTemplateNameForCountry(to);

    // Format date
    const formattedDate = new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // API endpoint
    const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}/messages`;

    // Request payload
    const payload = {
      messaging_product: 'whatsapp',
      to: recipientPhone,
      type: 'template',
      template: {
        name: templateName, // Dynamic template based on country
        language: {
          code: WHATSAPP_CONFIG.LANGUAGE_CODE
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: donorName },           // {{1}} - Donor Name
              { type: 'text', text: amount.toString() },   // {{2}} - Amount
              { type: 'text', text: purpose },             // {{3}} - Purpose
              { type: 'text', text: paymentMethod },       // {{4}} - Payment Method
              { type: 'text', text: formattedDate }        // {{5}} - Date
            ]
          }
        ]
      }
    };

    console.log('📦 WhatsApp Payload:', JSON.stringify(payload, null, 2));
    console.log(`📤 Sending WhatsApp message to: ${recipientPhone} using template: ${templateName}`);

    // Send request
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ WhatsApp notification sent successfully:', {
      to: recipientPhone,
      template: templateName,
      messageId: response.data.messages[0].id,
      status: response.data.messages[0].message_status
    });

    return {
      success: true,
      messageId: response.data.messages[0].id,
      recipient: recipientPhone,
      templateUsed: templateName,
      timestamp: new Date()
    };

  } catch (error) {
    const errorDetails = {
      message: error.response?.data?.error?.message || error.message,
      code: error.response?.data?.error?.code,
      type: error.response?.data?.error?.type,
      status: error.response?.status
    };

    console.error('❌ WhatsApp notification failed:', errorDetails);

    // Provide helpful error messages
    if (errorDetails.code === 133010) {
      console.error('⚠️ WhatsApp failed: Account not registered');
      console.error('   Fix: Verify phone number is registered in Meta Business Manager');
      console.error('   Link: https://business.facebook.com/wa/manage/phone-numbers/');
    } else if (errorDetails.code === 131026) {
      console.error('⚠️ WhatsApp failed: Template does not exist or is not approved');
      console.error(`   Template attempted: ${getTemplateNameForCountry(to)}`);
      console.error('   Fix: Create and get approval for template in Meta Business Manager');
    } else if (errorDetails.code === 190) {
      console.error('⚠️ WhatsApp failed: Invalid access token');
      console.error('   Fix: Get a new permanent access token from Meta Business Manager');
    }

    // Don't throw - just log and return error
    return {
      success: false,
      error: errorDetails.message,
      errorCode: errorDetails.code,
      errorType: errorDetails.type,
      errorDetails: errorDetails
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
  hasPhoneNumberId: !!WHATSAPP_CONFIG.PHONE_NUMBER_ID
});