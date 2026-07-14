import express from 'express';
import prisma from '../config/prisma.js';
import { createAuditLog } from '../utils/auditLogger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Log the actual token being used on startup
console.log('🔐 Webhook Verify Token:', process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'khanqah-saifia-webhook-2024');

// ==================== STATUS ENDPOINT ====================
router.get('/status', async (req, res) => {
  console.log('📊 Webhook status requested');
  console.log('Headers:', req.headers);
  console.log('Query:', req.query);
  
  // Disable caching for this endpoint
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  try {
    console.log('Attempting to fetch donations...');
    
    // Get recent webhook activity
    const recentDonations = await prisma.donation.findMany({
      where: {
        whatsappMessageId: { not: null }
      },
      orderBy: {
        whatsappStatusUpdatedAt: 'desc'
      },
      take: 20,
      select: {
        id: true,
        donorName: true,
        donorPhone: true,
        amount: true,
        purpose: true,
        paymentMethod: true,
        date: true,
        createdAt: true,
        whatsappMessageId: true,
        whatsappStatus: true,
        whatsappStatusUpdatedAt: true,
        whatsappSent: true,
        whatsappSentAt: true,
        whatsappError: true,
        whatsappDeliveryDetails: true,
        templateUsed: true,
        templateType: true
      }
    });

    console.log(`Found ${recentDonations.length} donations with WhatsApp messages`);

    // Get statistics with safe defaults
    console.log('Fetching statistics...');
    const [
      pendingCount,
      sentCount,
      deliveredCount,
      readCount,
      failedCount,
      totalCount
    ] = await Promise.all([
      prisma.donation.count({ where: { whatsappStatus: 'PENDING' } }).catch(e => { console.error('Error counting PENDING:', e); return 0; }),
      prisma.donation.count({ where: { whatsappStatus: 'SENT' } }).catch(e => { console.error('Error counting SENT:', e); return 0; }),
      prisma.donation.count({ where: { whatsappStatus: 'DELIVERED' } }).catch(e => { console.error('Error counting DELIVERED:', e); return 0; }),
      prisma.donation.count({ where: { whatsappStatus: 'READ' } }).catch(e => { console.error('Error counting READ:', e); return 0; }),
      prisma.donation.count({ where: { whatsappStatus: 'FAILED' } }).catch(e => { console.error('Error counting FAILED:', e); return 0; }),
      prisma.donation.count({ where: { whatsappMessageId: { not: null } } }).catch(e => { console.error('Error counting total:', e); return 0; })
    ]);

    console.log('Statistics:', { pendingCount, sentCount, deliveredCount, readCount, failedCount, totalCount });

    // Format the recent activity
    const formattedActivity = recentDonations.map(d => ({
      id: d.id,
      donorName: d.donorName || 'Unknown',
      donorPhone: d.donorPhone || 'N/A',
      amount: d.amount ? parseFloat(d.amount.toString()) : 0,
      purpose: d.purpose || 'N/A',
      paymentMethod: d.paymentMethod || 'N/A',
      date: d.date,
      createdAt: d.createdAt,
      whatsappMessageId: d.whatsappMessageId,
      whatsappStatus: d.whatsappStatus || 'PENDING',
      whatsappStatusUpdatedAt: d.whatsappStatusUpdatedAt,
      whatsappSent: d.whatsappSent || false,
      whatsappSentAt: d.whatsappSentAt,
      whatsappError: d.whatsappError,
      whatsappDeliveryDetails: d.whatsappDeliveryDetails,
      templateUsed: d.templateUsed || 'Donation Confirmation',
      templateType: d.templateType || 'Donation Confirmation'
    }));

    const lastWebhookTime = await getLastWebhookTime();
    console.log('Last webhook time:', lastWebhookTime);

    const responseData = {
      success: true,
      webhook: {
        url: '/webhook/whatsapp',
        verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ? '✅ Configured' : '❌ Not configured',
        isActive: true,
        lastWebhook: lastWebhookTime
      },
      stats: {
        pending: pendingCount || 0,
        sent: sentCount || 0,
        delivered: deliveredCount || 0,
        read: readCount || 0,
        failed: failedCount || 0,
        total: totalCount || 0
      },
      recentActivity: formattedActivity
    };

    console.log('Sending response with stats:', responseData.stats);
    
    // Send response with no-cache headers
    res.json(responseData);

  } catch (error) {
    console.error('❌ Error in /status endpoint:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      webhook: {
        url: '/webhook/whatsapp',
        verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ? '✅ Configured' : '❌ Not configured',
        isActive: true
      },
      stats: {
        pending: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        total: 0
      },
      recentActivity: []
    });
  }
});

// ==================== MESSAGE DETAILS ENDPOINT ====================
router.get('/message/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const donation = await prisma.donation.findFirst({
      where: { whatsappMessageId: messageId },
      include: {
        operator: {
          select: { name: true, email: true }
        }
      }
    });

    if (!donation) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Get audit logs for this message
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'DONATION',
        entityId: donation.id,
        action: {
          in: ['WHATSAPP_SENT', 'WHATSAPP_DELIVERED', 'WHATSAPP_READ', 'WHATSAPP_FAILED', 'WHATSAPP_STATUS_UPDATE']
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      message: {
        id: donation.whatsappMessageId,
        status: donation.whatsappStatus,
        sentAt: donation.whatsappSentAt,
        updatedAt: donation.whatsappStatusUpdatedAt,
        error: donation.whatsappError,
        deliveryDetails: donation.whatsappDeliveryDetails
      },
      donation: {
        id: donation.id,
        donorName: donation.donorName,
        donorPhone: donation.donorPhone,
        amount: donation.amount,
        purpose: donation.purpose,
        paymentMethod: donation.paymentMethod
      },
      timeline: auditLogs
    });

  } catch (error) {
    console.error('❌ Error fetching message details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== WHATSAPP WEBHOOK VERIFICATION ====================
router.get('/whatsapp', (req, res) => {
  console.log('🔍 WhatsApp Webhook Verification Request:', {
    query: req.query,
    timestamp: new Date().toISOString()
  });
  
  const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'khanqah-saifia-webhook-2024';
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Verification params:', { mode, token, challenge });

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    res.set('Content-Type', 'text/plain');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Verification failed');
    console.log('Expected token:', VERIFY_TOKEN);
    console.log('Received token:', token);
    res.status(403).send('Verification failed');
  }
});

// ==================== WHATSAPP WEBHOOK POST ====================
router.post('/whatsapp', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('📩 WhatsApp Webhook POST Received');
  
  let body;
  try {
    body = JSON.parse(req.body.toString());
    console.log('Webhook body received');
  } catch (e) {
    console.log('Raw body:', req.body.toString());
    return res.sendStatus(200);
  }
  
  try {
    const { entry, object } = body;
    
    if (object !== 'whatsapp_business_account') {
      console.log('⚠️ Not a WhatsApp business account webhook');
      return res.sendStatus(200);
    }
    
    if (!entry || !Array.isArray(entry)) {
      console.log('⚠️ No entries in webhook payload');
      return res.sendStatus(200);
    }

    for (const entryItem of entry) {
      const changes = entryItem.changes;
      
      if (!changes || !Array.isArray(changes)) continue;
      
      for (const change of changes) {
        const value = change.value;
        
        if (value.statuses && Array.isArray(value.statuses)) {
          for (const status of value.statuses) {
            await handleMessageStatus(status);
          }
        }

        if (value.messages && Array.isArray(value.messages)) {
          for (const message of value.messages) {
            await handleIncomingMessage(message, value.contacts?.[0]);
          }
        }
      }
    }

    res.sendStatus(200);
    
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    await logWebhookFailure({
      error: error.message,
      stack: error.stack,
      body: body
    });
    res.sendStatus(200);
  }
});

// Helper function to get last webhook time
async function getLastWebhookTime() {
  try {
    const lastDonation = await prisma.donation.findFirst({
      where: { whatsappStatusUpdatedAt: { not: null } },
      orderBy: { whatsappStatusUpdatedAt: 'desc' },
      select: { whatsappStatusUpdatedAt: true }
    });
    return lastDonation?.whatsappStatusUpdatedAt || null;
  } catch (error) {
    console.error('Error getting last webhook time:', error);
    return null;
  }
}

// Handle message status updates
async function handleMessageStatus(status) {
  const messageId = status.id;
  const messageStatus = status.status;
  const recipientId = status.recipient_id;
  const timestamp = status.timestamp;
  const conversation = status.conversation;
  const pricing = status.pricing;
  const errors = status.errors || [];
  
  console.log(`📊 Message Status Update:
    Message ID: ${messageId}
    Status: ${messageStatus}
    Recipient: ${recipientId}
    Timestamp: ${new Date(timestamp * 1000).toISOString()}
    Errors: ${errors.length ? JSON.stringify(errors) : 'None'}
  `);

  try {
    const donation = await prisma.donation.findFirst({
      where: { whatsappMessageId: messageId }
    });

    if (!donation) {
      console.log(`⚠️ Donation not found for message ID: ${messageId}`);
      await logWebhookFailure({
        messageId,
        status: messageStatus,
        error: 'Donation not found',
        payload: { status }
      });
      return;
    }

    const updateData = {
      whatsappStatus: messageStatus.toUpperCase(),
      whatsappStatusUpdatedAt: new Date(timestamp * 1000),
      whatsappDeliveryDetails: {
        conversation,
        pricing,
        recipientId,
        timestamp,
        errors: errors.length ? errors : undefined
      }
    };

    switch (messageStatus) {
      case 'delivered':
        updateData.whatsappSent = true;
        updateData.whatsappSentAt = new Date(timestamp * 1000);
        updateData.whatsappError = null;
        break;
        
      case 'read':
        updateData.whatsappReadAt = new Date(timestamp * 1000);
        break;
        
      case 'failed':
        updateData.whatsappError = JSON.stringify({
          errors,
          timestamp: new Date(timestamp * 1000)
        });
        console.error('❌ Message failed:', {
          messageId,
          errors,
          recipientId,
          donationId: donation.id
        });
        break;
        
      case 'sent':
        updateData.whatsappSentAt = new Date(timestamp * 1000);
        break;
    }

    await prisma.donation.update({
      where: { id: donation.id },
      data: updateData
    });

    let action = 'WHATSAPP_STATUS_UPDATE';
    if (messageStatus === 'failed') action = 'WHATSAPP_FAILED';
    if (messageStatus === 'delivered') action = 'WHATSAPP_DELIVERED';
    if (messageStatus === 'read') action = 'WHATSAPP_READ';
    
    await createAuditLog({
      action: action,
      userId: 'system',
      userRole: 'SYSTEM',
      entityType: 'DONATION',
      entityId: donation.id,
      description: `WhatsApp message ${messageStatus}`,
      metadata: {
        messageId,
        status: messageStatus,
        recipientId,
        conversation,
        pricing,
        errors: errors.length ? errors : undefined
      }
    });

    console.log(`✅ Donation ${donation.id} updated with status: ${messageStatus}`);

  } catch (error) {
    console.error('❌ Error updating donation status:', error);
    await logWebhookFailure({
      messageId,
      status: messageStatus,
      error: error.message,
      stack: error.stack,
      payload: { status }
    });
  }
}

// Handle incoming messages
async function handleIncomingMessage(message, contact) {
  console.log('📨 Incoming message:', {
    from: message.from,
    type: message.type,
    text: message.text?.body,
    timestamp: message.timestamp,
    contact: contact
  });

  try {
    await logWebhookFailure({
      type: 'incoming_message',
      message: message,
      contact: contact,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error handling incoming message:', error);
  }
}

// Helper to log webhook failures
async function logWebhookFailure(data) {
  try {
    const logDir = path.join(__dirname, '../../logs');
    
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, 'webhook-failures.log');
    const logEntry = `${new Date().toISOString()} - ${JSON.stringify(data)}\n`;
    
    await fs.appendFile(logFile, logEntry);
    console.error('Webhook Failure logged:', data.error || 'Unknown error');
    
  } catch (error) {
    console.error('Error logging webhook failure:', error);
  }
}

export default router;