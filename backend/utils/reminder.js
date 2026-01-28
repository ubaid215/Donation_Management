// utils/reminder.js
import { Resend } from 'resend';
import axios from 'axios';

const resend = new Resend(process.env.RESEND_API_KEY);

// WhatsApp Configuration
const WHATSAPP_CONFIG = {
  PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
  API_VERSION: 'v22.0',
  TEMPLATES: {
    RECEIPT_FULL: 'receipt_full_payment',      // For full payments
    RECEIPT_PARTIAL: 'receipt_partial_payment', // For partial payments
    PAYMENT_REMINDER: 'payment_reminder'       // For payment reminders
  },
  LANGUAGE_CODE: 'en_us'
};

/**
 * Send payment reminder via WhatsApp
 */
export async function sendPaymentReminder({
  donationId,
  donorName,
  donorPhone,
  donorEmail,
  totalAmount,
  paidAmount,
  remainingAmount,
  purpose
}) {
  try {
    // Validate configuration
    if (!WHATSAPP_CONFIG.ACCESS_TOKEN || !WHATSAPP_CONFIG.PHONE_NUMBER_ID) {
      console.log('⚠️ WhatsApp not configured - skipping reminder');
      return { 
        success: false, 
        skipped: true, 
        reason: 'Not configured',
        error: 'WhatsApp credentials not configured'
      };
    }

    if (!donorPhone) {
      console.log('⚠️ No phone number for donor - skipping reminder');
      return { 
        success: false, 
        skipped: true, 
        reason: 'No phone number',
        error: 'Donor phone number not available'
      };
    }

    // Format phone number
    const formattedPhone = donorPhone.replace(/[\s\-\+]/g, '');

    // Prepare template parameters
    const formattedTotalAmount = `Rs. ${parseFloat(totalAmount).toFixed(2)}`;
    const formattedPaidAmount = `Rs. ${parseFloat(paidAmount).toFixed(2)}`;
    const formattedRemainingAmount = `Rs. ${parseFloat(remainingAmount).toFixed(2)}`;

    // API endpoint
    const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}/messages`;

    // Request payload for reminder template
    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: WHATSAPP_CONFIG.TEMPLATES.PAYMENT_REMINDER,
        language: {
          code: WHATSAPP_CONFIG.LANGUAGE_CODE
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: donorName },                    // {{1}} - Donor Name
              { type: 'text', text: purpose },                      // {{2}} - Purpose
              { type: 'text', text: formattedTotalAmount },         // {{3}} - Total Amount
              { type: 'text', text: formattedPaidAmount },          // {{4}} - Paid Amount
              { type: 'text', text: formattedRemainingAmount },     // {{5}} - Remaining Amount
              { type: 'text', text: donationId.substring(0, 8) }    // {{6}} - Receipt/Donation ID
            ]
          }
        ]
      }
    };

    console.log('📦 WhatsApp Reminder Payload:', JSON.stringify(payload, null, 2));

    // Send request
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Payment reminder sent successfully:', {
      to: donorPhone,
      messageId: response.data.messages[0].id,
      reminderType: 'payment_reminder'
    });

    return {
      success: true,
      messageId: response.data.messages[0].id,
      recipient: donorPhone,
      timestamp: new Date(),
      template: WHATSAPP_CONFIG.TEMPLATES.PAYMENT_REMINDER
    };

  } catch (error) {
    const errorDetails = {
      message: error.response?.data?.error?.message || error.message,
      code: error.response?.data?.error?.code,
      type: error.response?.data?.error?.type,
      status: error.response?.status
    };

    console.error('❌ Payment reminder failed:', errorDetails);

    // Check if it's a template error and try alternative
    if (errorDetails.code === 131026) {
      console.log('⚠️ Payment reminder template not found, trying receipt template...');
      return await sendPaymentReminderWithReceiptTemplate({
        donationId,
        donorName,
        donorPhone,
        totalAmount,
        paidAmount,
        remainingAmount,
        purpose
      });
    }

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
 * Alternative: Send reminder using receipt template
 */
async function sendPaymentReminderWithReceiptTemplate({
  donationId,
  donorName,
  donorPhone,
  totalAmount,
  paidAmount,
  remainingAmount,
  purpose
}) {
  try {
    const formattedPhone = donorPhone.replace(/[\s\-\+]/g, '');
    const formattedTotalAmount = `Rs. ${parseFloat(totalAmount).toFixed(2)}`;
    const formattedPaidAmount = `Rs. ${parseFloat(paidAmount).toFixed(2)}`;
    const formattedRemainingAmount = `Rs. ${parseFloat(remainingAmount).toFixed(2)}`;
    
    const currentDate = new Date().toLocaleDateString('en-GB', {
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
        name: WHATSAPP_CONFIG.TEMPLATES.RECEIPT_PARTIAL,
        language: {
          code: WHATSAPP_CONFIG.LANGUAGE_CODE
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: donorName },
              { type: 'text', text: formattedTotalAmount },
              { type: 'text', text: purpose },
              { type: 'text', text: 'CASH/BANK/UPI' },
              { type: 'text', text: currentDate }
            ]
          },
          {
            type: 'button',
            sub_type: 'quick_reply',
            index: 0,
            parameters: [
              {
                type: 'payload',
                payload: `REMINDER_${donationId}_${formattedRemainingAmount}`
              }
            ]
          }
        ]
      }
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Payment reminder sent via receipt template:', {
      to: donorPhone,
      messageId: response.data.messages[0].id
    });

    return {
      success: true,
      messageId: response.data.messages[0].id,
      recipient: donorPhone,
      timestamp: new Date(),
      template: WHATSAPP_CONFIG.TEMPLATES.RECEIPT_PARTIAL,
      fallback: true
    };

  } catch (error) {
    console.error('❌ Fallback reminder failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send email payment reminder
 */
export async function sendEmailPaymentReminder({
  to,
  donorName,
  donationId,
  totalAmount,
  paidAmount,
  remainingAmount,
  purpose,
  dueDate = null
}) {
  try {
    // Format amounts
    const formattedTotalAmount = `Rs. ${parseFloat(totalAmount).toFixed(2)}`;
    const formattedPaidAmount = `Rs. ${parseFloat(paidAmount).toFixed(2)}`;
    const formattedRemainingAmount = `Rs. ${parseFloat(remainingAmount).toFixed(2)}`;
    
    // Format dates
    const currentDate = new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    let dueDateText = '';
    if (dueDate) {
      dueDateText = new Date(dueDate).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    // Email subject
    const subject = `Payment Reminder - ${purpose} (${donationId.substring(0, 8)})`;

    // HTML email content
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Reminder</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 20px;
          }
          .logo {
            max-width: 150px;
            margin-bottom: 15px;
          }
          h1 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 24px;
          }
          .highlight {
            color: #e74c3c;
            font-weight: bold;
            font-size: 20px;
          }
          .payment-details {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }
          .detail-label {
            font-weight: 600;
            color: #555;
          }
          .detail-value {
            font-weight: 600;
            color: #2c3e50;
          }
          .remaining-amount {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 15px;
            text-align: center;
            margin: 20px 0;
            font-size: 18px;
          }
          .action-buttons {
            text-align: center;
            margin-top: 30px;
          }
          .btn {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            margin: 0 10px;
            transition: background-color 0.3s;
          }
          .btn:hover {
            background-color: #45a049;
          }
          .btn-secondary {
            background-color: #3498db;
          }
          .btn-secondary:hover {
            background-color: #2980b9;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #777;
            font-size: 14px;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          .contact-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Reminder</h1>
            <p>Dear ${donorName},</p>
          </div>
          
          <p>This is a friendly reminder regarding your donation for <strong>${purpose}</strong>.</p>
          
          <div class="payment-details">
            <div class="detail-row">
              <span class="detail-label">Donation ID:</span>
              <span class="detail-value">${donationId.substring(0, 8)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Total Amount:</span>
              <span class="detail-value">${formattedTotalAmount}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount Paid:</span>
              <span class="detail-value">${formattedPaidAmount}</span>
            </div>
            ${dueDate ? `
            <div class="detail-row">
              <span class="detail-label">Due Date:</span>
              <span class="detail-value" style="color: #e74c3c;">${dueDateText}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="remaining-amount">
            <strong>Remaining Balance:</strong>
            <div class="highlight">${formattedRemainingAmount}</div>
          </div>
          
          <p>Please complete your payment at your earliest convenience to support our cause.</p>
          
          <div class="action-buttons">
            <a href="mailto:${process.env.ORG_EMAIL || 'donations@yourorg.com'}" class="btn">
              Contact Us
            </a>
            <a href="${process.env.PAYMENT_PORTAL_URL || '#'}" class="btn btn-secondary">
              Make Payment
            </a>
          </div>
          
          <div class="contact-info">
            <p><strong>For any queries:</strong></p>
            <p>Email: ${process.env.ORG_EMAIL || 'donations@yourorg.com'}</p>
            <p>Phone: ${process.env.ORG_PHONE || '+91 XXXXX XXXXX'}</p>
          </div>
          
          <div class="footer">
            <p>Thank you for your continued support.</p>
            <p>This is an automated message, please do not reply to this email.</p>
            <p>${currentDate}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Text version for email clients that don't support HTML
    const text = `
Payment Reminder
================

Dear ${donorName},

This is a friendly reminder regarding your donation for ${purpose}.

Donation Details:
- Donation ID: ${donationId.substring(0, 8)}
- Total Amount: ${formattedTotalAmount}
- Amount Paid: ${formattedPaidAmount}
- Remaining Balance: ${formattedRemainingAmount}
${dueDate ? `- Due Date: ${dueDateText}` : ''}

Please complete your payment at your earliest convenience to support our cause.

For any queries:
Email: ${process.env.ORG_EMAIL || 'donations@yourorg.com'}
Phone: ${process.env.ORG_PHONE || '+91 XXXXX XXXXX'}

Thank you for your continued support.

This is an automated message, please do not reply to this email.
${currentDate}
    `;

    // Send email
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'donations@yourorg.com',
      to,
      subject,
      html,
      text
    });

    if (error) {
      console.error('Email reminder sending error:', error);
      throw error;
    }

    console.log('✅ Email reminder sent successfully:', {
      to: to,
      messageId: data.id
    });

    return {
      success: true,
      messageId: data.id,
      recipient: to,
      timestamp: new Date(),
      type: 'email'
    };

  } catch (error) {
    console.error('❌ Email reminder failed:', error);
    throw error;
  }
}

/**
 * Send WhatsApp notification with appropriate template based on payment status
 */
export async function sendWhatsAppNotification({
  to,
  donorName,
  totalAmount,
  paidAmount,
  remainingAmount,
  purpose,
  paymentMethod,
  date,
  paymentStatus = 'PAID'
}) {
  try {
    // Validate configuration
    if (!WHATSAPP_CONFIG.ACCESS_TOKEN || !WHATSAPP_CONFIG.PHONE_NUMBER_ID) {
      console.log('⚠️ WhatsApp not configured - skipping notification');
      return { 
        success: false, 
        skipped: true, 
        reason: 'Not configured',
        error: 'WhatsApp credentials not configured'
      };
    }

    // Format phone number
    const formattedPhone = to.replace(/[\s\-\+]/g, '');

    // Format amounts
    const formattedTotalAmount = `Rs. ${parseFloat(totalAmount).toFixed(2)}`;
    const formattedPaidAmount = `Rs. ${parseFloat(paidAmount).toFixed(2)}`;
    const formattedRemainingAmount = `Rs. ${parseFloat(remainingAmount).toFixed(2)}`;
    
    // Format date
    const formattedDate = new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Choose template based on payment status
    let templateName;
    let parameters = [];

    if (paymentStatus === 'PAID') {
      // Full payment template
      templateName = WHATSAPP_CONFIG.TEMPLATES.RECEIPT_FULL;
      parameters = [
        { type: 'text', text: donorName },           // {{1}} - Donor Name
        { type: 'text', text: formattedTotalAmount }, // {{2}} - Amount
        { type: 'text', text: purpose },             // {{3}} - Purpose
        { type: 'text', text: paymentMethod },       // {{4}} - Payment Method
        { type: 'text', text: formattedDate }        // {{5}} - Date
      ];
    } else if (paymentStatus === 'PARTIAL') {
      // Partial payment template
      templateName = WHATSAPP_CONFIG.TEMPLATES.RECEIPT_PARTIAL;
      parameters = [
        { type: 'text', text: donorName },                    // {{1}} - Donor Name
        { type: 'text', text: formattedTotalAmount },         // {{2}} - Total Amount
        { type: 'text', text: formattedPaidAmount },          // {{3}} - Paid Amount
        { type: 'text', text: formattedRemainingAmount },     // {{4}} - Remaining Amount
        { type: 'text', text: purpose },                      // {{5}} - Purpose
        { type: 'text', text: paymentMethod },                // {{6}} - Payment Method
        { type: 'text', text: formattedDate }                 // {{7}} - Date
      ];
    } else {
      // PENDING payment - use partial template
      templateName = WHATSAPP_CONFIG.TEMPLATES.RECEIPT_PARTIAL;
      parameters = [
        { type: 'text', text: donorName },
        { type: 'text', text: formattedTotalAmount },
        { type: 'text', text: 'Rs. 0.00' },
        { type: 'text', text: formattedTotalAmount },
        { type: 'text', text: purpose },
        { type: 'text', text: paymentMethod },
        { type: 'text', text: formattedDate }
      ];
    }

    // API endpoint
    const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}/messages`;

    // Request payload
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
            parameters: parameters
          }
        ]
      }
    };

    console.log('📦 WhatsApp Notification Payload:', JSON.stringify(payload, null, 2));
    console.log(`📤 Sending ${paymentStatus} WhatsApp message to:`, formattedPhone);

    // Send request
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ WhatsApp ${paymentStatus} notification sent successfully:`, {
      to: formattedPhone,
      messageId: response.data.messages[0].id,
      template: templateName
    });

    return {
      success: true,
      messageId: response.data.messages[0].id,
      recipient: formattedPhone,
      timestamp: new Date(),
      template: templateName,
      paymentStatus: paymentStatus
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
    if (errorDetails.code === 131026) {
      console.error(`⚠️ WhatsApp failed: Template "${templateName}" does not exist or is not approved`);
      console.error('   Fix: Create and get approval for template in Meta Business Manager');
    }

    return {
      success: false,
      error: errorDetails.message,
      errorCode: errorDetails.code,
      errorType: errorDetails.type,
      errorDetails: errorDetails,
      paymentStatus: paymentStatus
    };
  }
}

/**
 * Schedule automatic reminders for pending payments
 */
export async function scheduleAutomaticReminders() {
  try {
    console.log('⏰ Checking for pending payments that need reminders...');
    
    // This function would typically be called by a cron job
    // You would need to pass prisma instance or import it
    
    // For now, just return a placeholder
    return {
      success: true,
      message: 'Reminder scheduler ready',
      timestamp: new Date()
    };
    
  } catch (error) {
    console.error('❌ Automatic reminder scheduling failed:', error);
    throw error;
  }
}

/**
 * Check if WhatsApp templates are properly configured
 */
export async function verifyWhatsAppTemplates() {
  try {
    if (!WHATSAPP_CONFIG.ACCESS_TOKEN || !WHATSAPP_CONFIG.PHONE_NUMBER_ID) {
      return {
        configured: false,
        error: 'WhatsApp not configured',
        templates: {}
      };
    }

    const templates = {};
    const templateNames = Object.values(WHATSAPP_CONFIG.TEMPLATES);

    for (const templateName of templateNames) {
      try {
        const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}/message_templates?name=${templateName}`;
        
        const response = await axios.get(url, {
          headers: {
            'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`
          }
        });

        templates[templateName] = {
          exists: response.data.data.length > 0,
          status: response.data.data.length > 0 ? response.data.data[0].status : 'NOT_FOUND',
          details: response.data.data.length > 0 ? response.data.data[0] : null
        };

      } catch (error) {
        templates[templateName] = {
          exists: false,
          error: error.response?.data?.error?.message || error.message
        };
      }
    }

    console.log('📋 WhatsApp Templates Verification:', templates);
    return {
      configured: true,
      templates: templates
    };

  } catch (error) {
    console.error('❌ Template verification failed:', error);
    return {
      configured: false,
      error: error.message,
      templates: {}
    };
  }
}

/**
 * Create WhatsApp templates in Meta Business Manager
 * Note: This is for documentation purposes only - templates must be created in Meta Business Console
 */
export function getTemplateRequirements() {
  return {
    RECEIPT_FULL_PAYMENT: {
      name: 'receipt_full_payment',
      category: 'UTILITY',
      language: 'en_us',
      components: [
        {
          type: 'BODY',
          text: `Thank you for your generous donation, {{1}}! 

💰 Donation Amount: {{2}}
🎯 Purpose: {{3}}
💳 Payment Method: {{4}}
📅 Date: {{5}}

Your support helps us make a difference. A formal receipt has been emailed to you.

Thank you for your generosity!`
        },
        {
          type: 'FOOTER',
          text: 'For any queries, contact us at +91 XXXX XXXX XX'
        }
      ],
      variables: [
        'Donor Name',
        'Amount (e.g., Rs. 5000.00)',
        'Purpose',
        'Payment Method',
        'Date (DD/MM/YYYY)'
      ]
    },
    RECEIPT_PARTIAL_PAYMENT: {
      name: 'receipt_partial_payment',
      category: 'UTILITY',
      language: 'en_us',
      components: [
        {
          type: 'BODY',
          text: `Thank you for your donation, {{1}}!

📊 Payment Summary:
💰 Total Amount: {{2}}
💵 Amount Paid: {{3}}
⚖️ Remaining Balance: {{4}}
🎯 Purpose: {{5}}
💳 Payment Method: {{6}}
📅 Date: {{7}}

A formal receipt has been emailed to you. Please complete the remaining payment at your earliest convenience.`
        },
        {
          type: 'FOOTER',
          text: 'For payment inquiries: +91 XXXX XXXX XX'
        }
      ],
      variables: [
        'Donor Name',
        'Total Amount',
        'Paid Amount',
        'Remaining Amount',
        'Purpose',
        'Payment Method',
        'Date'
      ]
    },
    PAYMENT_REMINDER: {
      name: 'payment_reminder',
      category: 'UTILITY',
      language: 'en_us',
      components: [
        {
          type: 'BODY',
          text: `Dear {{1}},

This is a friendly reminder regarding your donation for {{2}}.

💳 Payment Details:
💰 Total Amount: {{3}}
💵 Amount Paid: {{4}}
⚖️ Remaining Balance: {{5}}
📋 Receipt ID: {{6}}

Please complete your payment at your earliest convenience. Your support makes a difference!`
        },
        {
          type: 'FOOTER',
          text: 'Contact us for payment options: +91 XXXX XXXX XX'
        }
      ],
      variables: [
        'Donor Name',
        'Purpose',
        'Total Amount',
        'Paid Amount',
        'Remaining Amount',
        'Receipt/Donation ID'
      ]
    }
  };
}

// Export configuration
export const getReminderConfig = () => ({
  whatsapp: {
    isConfigured: !!(WHATSAPP_CONFIG.ACCESS_TOKEN && WHATSAPP_CONFIG.PHONE_NUMBER_ID),
    templates: WHATSAPP_CONFIG.TEMPLATES,
    hasAllTemplates: async () => {
      const verification = await verifyWhatsAppTemplates();
      if (!verification.configured) return false;
      
      const templates = verification.templates;
      return Object.values(templates).every(t => t.exists && t.status === 'APPROVED');
    }
  },
  email: {
    isConfigured: !!process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || 'donations@yourorg.com'
  }
});