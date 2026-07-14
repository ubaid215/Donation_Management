import express from 'express';
import axios from 'axios';

const router = express.Router();

// WhatsApp Configuration
const WHATSAPP_CONFIG = {
  PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
  API_VERSION: 'v22.0',
  TEMPLATE_NAME: 'donation_confirmation',
  LANGUAGE_CODE: 'en'
};

/**
 * Format phone number to E.164 standard (without +)
 */
function formatPhoneNumber(phone) {
  if (!phone) {
    return { success: false, error: 'Phone number is required' };
  }
  
  // Remove all non-digits except leading +
  let clean = phone.replace(/[^\d+]/g, '');
  
  // If it starts with +, remove it
  if (clean.startsWith('+')) {
    clean = clean.substring(1);
  }
  
  // Remove leading zeros
  clean = clean.replace(/^0+/, '');
  
  // Validate length
  if (clean.length < 10 || clean.length > 15) {
    return { 
      success: false, 
      error: `Invalid phone number length: ${clean.length} digits` 
    };
  }
  
  return { success: true, number: clean };
}

/**
 * Get country info from phone number
 */
function getCountryInfo(phoneNumber) {
  const countryCodes = {
    '1': { code: 'US/CA', name: 'United States/Canada', language: 'en_US' },
    '44': { code: 'GB', name: 'United Kingdom', language: 'en_GB' },
    '91': { code: 'IN', name: 'India', language: 'en_IN' },
    '971': { code: 'AE', name: 'United Arab Emirates', language: 'en' },
    '966': { code: 'SA', name: 'Saudi Arabia', language: 'ar' },
    '92': { code: 'PK', name: 'Pakistan', language: 'en' },
    '61': { code: 'AU', name: 'Australia', language: 'en_AU' },
    '64': { code: 'NZ', name: 'New Zealand', language: 'en_NZ' },
    '65': { code: 'SG', name: 'Singapore', language: 'en_SG' },
    '60': { code: 'MY', name: 'Malaysia', language: 'en_MY' },
    '33': { code: 'FR', name: 'France', language: 'fr_FR' },
    '49': { code: 'DE', name: 'Germany', language: 'de_DE' },
    '34': { code: 'ES', name: 'Spain', language: 'es_ES' },
    '39': { code: 'IT', name: 'Italy', language: 'it_IT' },
    '81': { code: 'JP', name: 'Japan', language: 'ja_JP' },
    '82': { code: 'KR', name: 'South Korea', language: 'ko_KR' },
    '86': { code: 'CN', name: 'China', language: 'zh_CN' },
    '886': { code: 'TW', name: 'Taiwan', language: 'zh_TW' },
  };
  
  // Find matching country code
  for (const [code, info] of Object.entries(countryCodes)) {
    if (phoneNumber.startsWith(code)) {
      return info;
    }
  }
  
  return {
    code: 'UNKNOWN',
    name: 'Unknown Country',
    language: 'en'
  };
}

/**
 * Endpoint 1: Test International Number Delivery
 */
router.post('/test-international', async (req, res) => {
  console.log('\n========================================');
  console.log('🌍 TESTING INTERNATIONAL WHATSAPP DELIVERY');
  console.log('========================================');
  
  try {
    const { phone, testType = 'template' } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required (e.g., +14155550123, +447911123456)'
      });
    }
    
    // Validate credentials
    if (!WHATSAPP_CONFIG.ACCESS_TOKEN || !WHATSAPP_CONFIG.PHONE_NUMBER_ID) {
      console.log('❌ WhatsApp not configured');
      return res.status(500).json({
        success: false,
        error: 'WhatsApp not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID',
        configured: false
      });
    }
    
    // Format phone number
    const formattedPhone = formatPhoneNumber(phone);
    if (!formattedPhone.success) {
      return res.status(400).json({
        success: false,
        error: formattedPhone.error
      });
    }
    
    const recipientPhone = formattedPhone.number;
    const countryInfo = getCountryInfo(recipientPhone);
    
    console.log('📱 Testing number:', phone);
    console.log('📞 Formatted:', recipientPhone);
    console.log('🌍 Country:', countryInfo.name);
    console.log('🗣️ Language:', countryInfo.language);
    console.log('🔤 Test Type:', testType);
    
    let result;
    
    if (testType === 'template') {
      // Test with template message
      result = await testTemplateMessage(recipientPhone, countryInfo);
    } else if (testType === 'session') {
      // Test with session message
      result = await testSessionMessage(recipientPhone, countryInfo);
    } else if (testType === 'hello_world') {
      // Test with hello_world template
      result = await testHelloWorldTemplate(recipientPhone, countryInfo);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid test type. Use: template, session, or hello_world'
      });
    }
    
    console.log('✅ Test completed');
    console.log('📊 Result:', result);
    console.log('========================================\n');
    
    res.json({
      success: result.success,
      testType,
      phoneNumber: {
        original: phone,
        formatted: recipientPhone,
        country: countryInfo
      },
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('📥 Error details:', error.response?.data || error.message);
    console.log('========================================\n');
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Test with template message
 */
async function testTemplateMessage(phoneNumber, countryInfo) {
  console.log('📤 Sending template message...');
  
  const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}/messages`;
  
  const payload = {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: 'template',
    template: {
      name: WHATSAPP_CONFIG.TEMPLATE_NAME,
      language: {
        code: countryInfo.language
      },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Test Donor' },
            { type: 'text', text: '5000' },
            { type: 'text', text: 'Educational Support' },
            { type: 'text', text: 'Bank Transfer' },
            { type: 'text', text: new Date().toLocaleDateString('en-PK') }
          ]
        }
      ]
    }
  };
  
  console.log('📦 Template payload:', JSON.stringify(payload, null, 2));
  
  const response = await axios.post(url, payload, {
    headers: {
      'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });
  
  console.log('✅ Template message accepted');
  console.log('📨 Message ID:', response.data.messages[0].id);
  
  return {
    success: true,
    messageId: response.data.messages[0].id,
    status: response.data.messages[0].message_status,
    type: 'template',
    templateName: WHATSAPP_CONFIG.TEMPLATE_NAME
  };
}

/**
 * Test with session message
 */
async function testSessionMessage(phoneNumber, countryInfo) {
  console.log('📤 Sending session message...');
  
  const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}/messages`;
  
  const messageText = `Hello from Donation Management System!\n\n` +
                     `This is a test message to verify WhatsApp delivery to ${countryInfo.name}.\n` +
                     `Number: ${phoneNumber}\n` +
                     `Time: ${new Date().toISOString()}\n\n` +
                     `Please reply if you received this message.`;
  
  const payload = {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: 'text',
    text: {
      preview_url: false,
      body: messageText
    }
  };
  
  console.log('📦 Session payload:', JSON.stringify(payload, null, 2));
  
  const response = await axios.post(url, payload, {
    headers: {
      'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });
  
  console.log('✅ Session message accepted');
  console.log('📨 Message ID:', response.data.messages[0].id);
  
  return {
    success: true,
    messageId: response.data.messages[0].id,
    status: response.data.messages[0].message_status,
    type: 'session',
    messageLength: messageText.length
  };
}

/**
 * Test with hello_world template (no approval needed)
 */
async function testHelloWorldTemplate(phoneNumber, countryInfo) {
  console.log('📤 Sending hello_world template...');
  
  const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}/messages`;
  
  const payload = {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: 'template',
    template: {
      name: 'hello_world',
      language: {
        code: 'en_US'
      }
    }
  };
  
  console.log('📦 Hello World payload:', JSON.stringify(payload, null, 2));
  
  const response = await axios.post(url, payload, {
    headers: {
      'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });
  
  console.log('✅ Hello World template accepted');
  console.log('📨 Message ID:', response.data.messages[0].id);
  
  return {
    success: true,
    messageId: response.data.messages[0].id,
    status: response.data.messages[0].message_status,
    type: 'hello_world_template'
  };
}

/**
 * Endpoint 2: Check WhatsApp API Health
 */
router.get('/health', async (req, res) => {
  console.log('\n========================================');
  console.log('🏥 WHATSAPP API HEALTH CHECK');
  console.log('========================================');
  
  try {
    if (!WHATSAPP_CONFIG.ACCESS_TOKEN || !WHATSAPP_CONFIG.PHONE_NUMBER_ID) {
      console.log('❌ WhatsApp not configured');
      return res.json({
        success: false,
        configured: false,
        error: 'WhatsApp credentials not set',
        hasAccessToken: !!WHATSAPP_CONFIG.ACCESS_TOKEN,
        hasPhoneNumberId: !!WHATSAPP_CONFIG.PHONE_NUMBER_ID
      });
    }
    
    console.log('📱 Checking phone number status...');
    const url = `https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`
      },
      params: {
        fields: 'verified_name,display_phone_number,code_verification_status,quality_rating,is_official_business_account'
      }
    });
    
    console.log('✅ WhatsApp API is healthy');
    console.log('📊 Status:', response.data);
    
    const isRegistered = response.data.code_verification_status === 'VERIFIED';
    const isOfficial = response.data.is_official_business_account === true;
    
    res.json({
      success: true,
      configured: true,
      isRegistered,
      isOfficial,
      phoneNumber: response.data.display_phone_number,
      verifiedName: response.data.verified_name,
      verificationStatus: response.data.code_verification_status,
      qualityRating: response.data.quality_rating,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ WhatsApp API health check failed:', error.message);
    console.log('📥 Error:', error.response?.data);
    
    res.status(500).json({
      success: false,
      configured: true,
      error: error.message,
      errorCode: error.response?.data?.error?.code,
      errorType: error.response?.data?.error?.type,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Endpoint 3: Batch Test International Numbers
 */
router.post('/batch-test', async (req, res) => {
  console.log('\n========================================');
  console.log('🔬 BATCH TESTING INTERNATIONAL NUMBERS');
  console.log('========================================');
  
  try {
    const { numbers, testType = 'template' } = req.body;
    
    if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Numbers array is required with at least one phone number'
      });
    }
    
    if (numbers.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 numbers per batch test'
      });
    }
    
    console.log(`📋 Testing ${numbers.length} numbers...`);
    
    const results = [];
    
    for (const phone of numbers) {
      console.log(`\n🔍 Testing: ${phone}`);
      
      try {
        const formattedPhone = formatPhoneNumber(phone);
        
        if (!formattedPhone.success) {
          results.push({
            phone,
            success: false,
            error: formattedPhone.error
          });
          continue;
        }
        
        const countryInfo = getCountryInfo(formattedPhone.number);
        
        let testResult;
        if (testType === 'session') {
          testResult = await testSessionMessage(formattedPhone.number, countryInfo);
        } else {
          testResult = await testTemplateMessage(formattedPhone.number, countryInfo);
        }
        
        results.push({
          phone,
          formatted: formattedPhone.number,
          country: countryInfo.name,
          success: true,
          messageId: testResult.messageId,
          type: testResult.type
        });
        
        // Delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Failed for ${phone}:`, error.message);
        
        results.push({
          phone,
          success: false,
          error: error.response?.data?.error?.message || error.message,
          errorCode: error.response?.data?.error?.code,
          errorType: error.response?.data?.error?.type
        });
        
        // Continue with next number
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log('📊 Batch test completed');
    console.log(`✅ Successful: ${results.filter(r => r.success).length}`);
    console.log(`❌ Failed: ${results.filter(r => !r.success).length}`);
    console.log('========================================\n');
    
    res.json({
      success: true,
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Batch test failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Endpoint 4: Get WhatsApp Configuration Status
 */
router.get('/config', (req, res) => {
  console.log('\n========================================');
  console.log('⚙️ WHATSAPP CONFIGURATION STATUS');
  console.log('========================================');
  
  const hasToken = !!WHATSAPP_CONFIG.ACCESS_TOKEN;
  const hasPhoneId = !!WHATSAPP_CONFIG.PHONE_NUMBER_ID;
  const isConfigured = hasToken && hasPhoneId;
  
  console.log('🔑 Access Token:', hasToken ? '✅ SET' : '❌ NOT SET');
  console.log('📱 Phone Number ID:', hasPhoneId ? '✅ SET' : '❌ NOT SET');
  console.log('⚙️ Configured:', isConfigured ? '✅ YES' : '❌ NO');
  console.log('🌐 API Version:', WHATSAPP_CONFIG.API_VERSION);
  console.log('📋 Template Name:', WHATSAPP_CONFIG.TEMPLATE_NAME);
  console.log('========================================\n');
  
  res.json({
    success: true,
    configured: isConfigured,
    hasAccessToken: hasToken,
    hasPhoneNumberId: hasPhoneId,
    phoneNumberId: hasPhoneId ? WHATSAPP_CONFIG.PHONE_NUMBER_ID : null,
    templateName: WHATSAPP_CONFIG.TEMPLATE_NAME,
    apiVersion: WHATSAPP_CONFIG.API_VERSION,
    message: isConfigured 
      ? '✅ WhatsApp is configured' 
      : '❌ WhatsApp is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env',
    timestamp: new Date().toISOString()
  });
});

export default router;