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

export async function sendWhatsAppNotification({ to, message }) {
  try {
    // Using WhatsApp Business API (example implementation)
    const response = await axios.post(
      'https://graph.facebook.com/v17.0/' + process.env.WHATSAPP_PHONE_NUMBER_ID + '/messages',
      {
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('WhatsApp sending error:', error.response?.data || error.message);
    throw error;
  }
}