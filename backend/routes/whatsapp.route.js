import express from 'express';
import axios from 'axios';

const router = express.Router();

// ========== WHATSAPP SETUP ENDPOINTS ==========

// Endpoint 1: Enable Two-Step Verification
router.post('/enable-two-step-verification', async (req, res) => {
  console.log('\n========================================');
  console.log('🔐 TWO-STEP VERIFICATION REQUEST');
  console.log('========================================');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('🆔 Request ID:', req.id);
  console.log('📱 Phone Number ID:', process.env.WHATSAPP_PHONE_NUMBER_ID);
  
  try {
    const { pin } = req.body;
    
    // Validate PIN
    if (!pin) {
      console.log('❌ Validation Failed: PIN is missing');
      return res.status(400).json({ 
        success: false,
        error: 'PIN is required' 
      });
    }
    
    if (pin.length !== 6) {
      console.log('❌ Validation Failed: PIN length is', pin.length, '(expected 6)');
      return res.status(400).json({ 
        success: false,
        error: 'PIN must be exactly 6 digits' 
      });
    }
    
    if (!/^\d{6}$/.test(pin)) {
      console.log('❌ Validation Failed: PIN contains non-numeric characters');
      return res.status(400).json({ 
        success: false,
        error: 'PIN must contain only numbers (0-9)' 
      });
    }

    console.log('✅ PIN validated successfully');
    console.log('🔢 PIN:', pin);
    
    // Check if credentials are configured
    if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      console.log('❌ WhatsApp credentials not configured');
      return res.status(500).json({
        success: false,
        error: 'WhatsApp not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env'
      });
    }

    console.log('📤 Sending request to Meta API...');
    const url = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/register`;
    console.log('🌐 API URL:', url);
    
    const payload = {
      messaging_product: 'whatsapp',
      pin: pin
    };
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ SUCCESS! Two-step verification enabled');
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Data:', JSON.stringify(response.data, null, 2));
    console.log('========================================\n');

    res.json({ 
      success: true, 
      message: 'Two-step verification enabled successfully!',
      data: response.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ FAILED to enable two-step verification');
    console.error('📥 Error Status:', error.response?.status);
    console.error('📥 Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('🔍 Error Message:', error.message);
    
    if (error.response?.data?.error) {
      const metaError = error.response.data.error;
      console.error('🚨 Meta Error Details:');
      console.error('   Code:', metaError.code);
      console.error('   Type:', metaError.type);
      console.error('   Message:', metaError.message);
      console.error('   Trace ID:', metaError.fbtrace_id);
    }
    console.log('========================================\n');

    res.status(error.response?.status || 500).json({ 
      success: false,
      error: error.response?.data?.error?.message || error.message,
      errorCode: error.response?.data?.error?.code,
      errorType: error.response?.data?.error?.type,
      details: error.response?.data,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint 2: Check Phone Number Status
router.get('/check-phone-status', async (req, res) => {
  console.log('\n========================================');
  console.log('📊 PHONE STATUS CHECK REQUEST');
  console.log('========================================');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('🆔 Request ID:', req.id);
  console.log('📱 Phone Number ID:', process.env.WHATSAPP_PHONE_NUMBER_ID);
  
  try {
    if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      console.log('❌ WhatsApp credentials not configured');
      return res.status(500).json({
        success: false,
        error: 'WhatsApp not configured'
      });
    }

    console.log('📤 Fetching phone number details from Meta API...');
    const url = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`;
    console.log('🌐 API URL:', url);
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
      },
      params: {
        fields: 'verified_name,display_phone_number,code_verification_status,quality_rating,is_pin_enabled'
      }
    });

    console.log('✅ SUCCESS! Phone status retrieved');
    console.log('📥 Response Status:', response.status);
    console.log('📥 Phone Details:', JSON.stringify(response.data, null, 2));
    
    const isRegistered = response.data.code_verification_status === 'VERIFIED';
    console.log('🔍 Registration Status:', isRegistered ? '✅ REGISTERED' : '⚠️ NOT REGISTERED');
    console.log('🔍 Verification Status:', response.data.code_verification_status || 'PENDING');
    console.log('🔍 Display Name:', response.data.verified_name || 'Not set');
    console.log('🔍 Phone Number:', response.data.display_phone_number || 'Not available');
    console.log('========================================\n');

    res.json({
      success: true,
      status: response.data,
      isRegistered: isRegistered,
      message: isRegistered 
        ? '✅ Phone is registered and ready to send messages!' 
        : '⚠️ Phone is not fully registered yet. Try enabling two-step verification.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ FAILED to check phone status');
    console.error('📥 Error Status:', error.response?.status);
    console.error('📥 Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('🔍 Error Message:', error.message);
    
    if (error.response?.data?.error?.code === 100) {
      console.log('⚠️ This error means the phone is not registered yet.');
      console.log('⚠️ Try enabling two-step verification to complete registration.');
    }
    
    console.log('========================================\n');
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
      errorCode: error.response?.data?.error?.code,
      details: error.response?.data,
      hint: error.response?.data?.error?.code === 100 
        ? 'Phone not registered yet. Try: Enable Two-Step Verification'
        : null,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint 3: Request Verification Code
router.post('/request-verification-code', async (req, res) => {
  console.log('\n========================================');
  console.log('📨 VERIFICATION CODE REQUEST');
  console.log('========================================');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('🆔 Request ID:', req.id);
  
  try {
    const { method } = req.body;
    const codeMethod = method || 'SMS';
    
    console.log('📱 Method:', codeMethod);
    console.log('📱 Phone Number ID:', process.env.WHATSAPP_PHONE_NUMBER_ID);
    
    if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      console.log('❌ WhatsApp credentials not configured');
      return res.status(500).json({
        success: false,
        error: 'WhatsApp not configured'
      });
    }

    console.log('📤 Requesting verification code...');
    const url = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/request_code`;
    
    const response = await axios.post(url, {
      code_method: codeMethod,
      language: 'en'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ SUCCESS! Verification code requested');
    console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    console.log('📨 Check your phone for the code!');
    console.log('========================================\n');

    res.json({ 
      success: true, 
      message: `Verification code sent via ${codeMethod}. Check your phone!`,
      data: response.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ FAILED to request verification code');
    console.error('📥 Error:', JSON.stringify(error.response?.data, null, 2));
    console.log('========================================\n');
    
    res.status(error.response?.status || 500).json({ 
      success: false,
      error: error.response?.data?.error?.message || error.message,
      details: error.response?.data,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint 4: Verify Code
router.post('/verify-code', async (req, res) => {
  console.log('\n========================================');
  console.log('✅ CODE VERIFICATION REQUEST');
  console.log('========================================');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('🆔 Request ID:', req.id);
  
  try {
    const { code } = req.body;
    
    if (!code || !/^\d{6}$/.test(code)) {
      console.log('❌ Invalid code format');
      return res.status(400).json({ 
        success: false,
        error: 'Code must be 6 digits' 
      });
    }

    console.log('🔢 Code:', code);
    console.log('📱 Phone Number ID:', process.env.WHATSAPP_PHONE_NUMBER_ID);
    
    if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      console.log('❌ WhatsApp credentials not configured');
      return res.status(500).json({
        success: false,
        error: 'WhatsApp not configured'
      });
    }

    console.log('📤 Verifying code...');
    const url = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/verify_code`;
    
    const response = await axios.post(url, {
      code: code
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ SUCCESS! Code verified');
    console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    console.log('========================================\n');

    res.json({ 
      success: true, 
      message: 'Code verified successfully!',
      data: response.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ FAILED to verify code');
    console.error('📥 Error:', JSON.stringify(error.response?.data, null, 2));
    console.log('========================================\n');
    
    res.status(error.response?.status || 500).json({ 
      success: false,
      error: error.response?.data?.error?.message || error.message,
      details: error.response?.data,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint 5: Get WhatsApp Configuration
router.get('/config', (req, res) => {
  console.log('\n========================================');
  console.log('⚙️ CONFIGURATION CHECK');
  console.log('========================================');
  console.log('📅 Timestamp:', new Date().toISOString());
  
  const hasToken = !!process.env.WHATSAPP_ACCESS_TOKEN;
  const hasPhoneId = !!process.env.WHATSAPP_PHONE_NUMBER_ID;
  const isConfigured = hasToken && hasPhoneId;
  
  console.log('🔑 Access Token:', hasToken ? '✅ SET' : '❌ NOT SET');
  console.log('📱 Phone Number ID:', hasPhoneId ? '✅ SET' : '❌ NOT SET');
  console.log('⚙️ Configured:', isConfigured ? '✅ YES' : '❌ NO');
  
  if (hasPhoneId) {
    console.log('📱 Phone Number ID Value:', process.env.WHATSAPP_PHONE_NUMBER_ID);
  }
  console.log('========================================\n');
  
  res.json({
    success: true,
    configured: isConfigured,
    hasAccessToken: hasToken,
    hasPhoneNumberId: hasPhoneId,
    phoneNumberId: hasPhoneId ? process.env.WHATSAPP_PHONE_NUMBER_ID : null,
    message: isConfigured 
      ? '✅ WhatsApp is configured' 
      : '❌ WhatsApp is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env',
    timestamp: new Date().toISOString()
  });
});

// Endpoint 6: Get Template Details
router.get('/template-details', async (req, res) => {
  try {
    // Get account ID
    const phoneUrl = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`;
    const phoneResponse = await axios.get(phoneUrl, {
      headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
      params: { fields: 'account_id' }
    });

    const wabaId = phoneResponse.data.account_id;

    // Get templates
    const templatesUrl = `https://graph.facebook.com/v22.0/${wabaId}/message_templates`;
    const templatesResponse = await axios.get(templatesUrl, {
      headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
      params: { 
        name: 'donation_confirmation',
        fields: 'name,status,language,components'
      }
    });

    const template = templatesResponse.data.data[0];

    if (!template) {
      return res.json({
        success: false,
        error: 'Template "donation_confirmation" not found',
        allTemplates: templatesResponse.data.data.map(t => t.name)
      });
    }

    // Count parameters
    const bodyComponent = template.components?.find(c => c.type === 'BODY');
    const bodyText = bodyComponent?.text || '';
    const paramCount = (bodyText.match(/\{\{\d+\}\}/g) || []).length;

    console.log('\n========================================');
    console.log('📋 TEMPLATE DETAILS');
    console.log('========================================');
    console.log('Template Name:', template.name);
    console.log('Status:', template.status);
    console.log('Language:', template.language);
    console.log('Body Text:', bodyText);
    console.log('Parameter Count:', paramCount);
    console.log('Components:', JSON.stringify(template.components, null, 2));
    console.log('========================================\n');

    res.json({
      success: true,
      template: {
        name: template.name,
        status: template.status,
        language: template.language,
        bodyText: bodyText,
        parameterCount: paramCount,
        components: template.components
      }
    });

  } catch (error) {
    console.error('Error:', error.response?.data);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data 
    });
  }
});

// Endpoint 7: List All Templates
router.get('/templates', async (req, res) => {
  try {
    // Get account ID
    const phoneUrl = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`;
    const phoneResponse = await axios.get(phoneUrl, {
      headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
      params: { fields: 'account_id' }
    });

    const wabaId = phoneResponse.data.account_id;

    // Get templates
    const templatesUrl = `https://graph.facebook.com/v22.0/${wabaId}/message_templates`;
    const templatesResponse = await axios.get(templatesUrl, {
      headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
    });

    console.log('📋 Templates:', templatesResponse.data.data);

    res.json({
      success: true,
      templates: templatesResponse.data.data,
      count: templatesResponse.data.data.length
    });

  } catch (error) {
    console.error('❌ Failed to get templates:', error.response?.data);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data 
    });
  }
});

// Endpoint 8: Send Test Message
router.post('/send-test', async (req, res) => {
  console.log('\n========================================');
  console.log('📤 SENDING TEST WHATSAPP MESSAGE');
  console.log('========================================');
  
  try {
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number required in "to" field (e.g., "923001234567")' 
      });
    }

    const url = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    console.log('📱 Sending to:', to);
    console.log('📝 Template: donation_confirmation');
    
    const payload = {
      messaging_product: 'whatsapp',
      to: to.replace(/[\s\-\+]/g, ''),
      type: 'template',
      template: {
        name: 'donation_confirmation',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'Test Donor' },
              { type: 'text', text: '5000' },
              { type: 'text', text: 'Zakat' },
              { type: 'text', text: 'Bank Transfer' },
              { type: 'text', text: new Date().toLocaleDateString('en-PK') }
            ]
          }
        ]
      }
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Message sent successfully!');
    console.log('📥 Message ID:', response.data.messages[0].id);
    console.log('========================================\n');

    res.json({ 
      success: true,
      messageId: response.data.messages[0].id,
      data: response.data 
    });

  } catch (error) {
    console.error('❌ Failed to send message');
    console.error('📥 Error:', error.response?.data);
    console.log('========================================\n');
    
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.error?.message || error.message,
      details: error.response?.data
    });
  }
});

export default router;