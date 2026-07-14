// utils/email.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Enhanced email template renderer
export function renderDonationEmail({
    donorName,
    amount,
    purpose,
    paymentMethod,
    donationId,
    date,
    customMessage = '',
    receiptNumber = ''
}) {
    const formattedDate = new Date(date).toLocaleDateString('en-PK', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const paymentMethodMap = {
        CASH: 'Cash',
        CARD: 'Credit/Debit Card',
        BANK_TRANSFER: 'Bank Transfer',
        UPI: 'UPI Payment',
        CHEQUE: 'Cheque'
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Donation Receipt - Khanqah Foundation</title>
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
        .header {
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            border-radius: 10px 10px 0 0;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .receipt-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: 600;
            color: #495057;
        }
        .value {
            color: #1e3c72;
            font-weight: 500;
        }
        .amount {
            font-size: 28px;
            font-weight: bold;
            color: #28a745;
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            border-radius: 8px;
            border: 2px solid #c3e6cb;
        }
        .quran-verse {
            font-style: italic;
            color: #666;
            border-left: 4px solid #1e3c72;
            padding-left: 15px;
            margin: 25px 0;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 0 8px 8px 0;
        }
        .urdu {
            direction: rtl;
            text-align: right;
            font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif;
            font-size: 16px;
            margin: 15px 0;
            padding: 15px;
            background: #f0f8ff;
            border-radius: 8px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e9ecef;
            color: #666;
            font-size: 14px;
        }
        .contact-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .badge {
            display: inline-block;
            padding: 5px 10px;
            background: #1e3c72;
            color: white;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        @media (max-width: 600px) {
            .content {
                padding: 15px;
            }
            .amount {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤲 JazakAllah Khair! 🌙</h1>
        <p>Donation Receipt - Khanqah Aliya</p>
    </div>
    
    <div class="content">
        <p>Assalamu Alaikum <strong>${donorName}</strong>,</p>
        
        <p>We have successfully received your generous donation. May Allah accept it from you and multiply its reward.</p>
        
        <div class="amount">
            Rs ${amount.toLocaleString('en-PK')}
        </div>
        
        <div class="receipt-details">
            <div class="detail-row">
                <span class="label">Receipt Number:</span>
                <span class="value">${receiptNumber || donationId.substring(0, 8).toUpperCase()}</span>
            </div>
            <div class="detail-row">
                <span class="label">Purpose:</span>
                <span class="value">${purpose}</span>
            </div>
            <div class="detail-row">
                <span class="label">Payment Method:</span>
                <span class="value">${paymentMethodMap[paymentMethod] || paymentMethod}</span>
            </div>
            <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${formattedDate}</span>
            </div>
            ${receiptNumber ? `<div class="detail-row">
                <span class="label">Transaction ID:</span>
                <span class="value">${receiptNumber}</span>
            </div>` : ''}
        </div>
        
        ${customMessage ? `
        <div class="custom-message">
            <strong>Note from Khanqah Aliya:</strong>
            <p>${customMessage}</p>
        </div>
        ` : ''}

        <div class="quran-verse" style="background:#eef6ff; border-left-color:#1e3c72;">
    <p><strong>📌 Important Note:</strong></p>
    <p>
        Your Sadaqat and Khairat are spent, with your permission, on the Khanqah, Jamia,
        and related Shariah-compliant, righteous, and welfare activities.
    </p>
</div>

<div class="urdu">
    <p><strong>📌 اہم وضاحت:</strong></p>
    <p>
        آپ کے صدقات و خیرات آپ کی اجازت سے خانقاہ، جامعہ اور ان سے متعلق
        (نیک اور جائز) شرعی و فلاحی امور پر خرچ کیے جاتے ہیں۔
    </p>
</div>

        
        <div class="quran-verse">
            <p><strong>📖 Allah says in the Qur'an:</strong></p>
            <p>"The example of those who spend their wealth in the way of Allah is like a seed which grows seven ears; in every ear there are a hundred grains. And Allah multiplies [His reward] for whom He wills. And Allah is all-Encompassing and Knowing."</p>
            <p><em>(Surah Al-Baqarah 2:261)</em></p>
        </div>
        
        <div class="urdu">
            <p><strong>📖 اردو ترجمہ:</strong></p>
            <p>جو لوگ اللہ کی راہ میں اپنا مال خرچ کرتے ہیں ان کی مثال اس دانے کی سی ہے جس سے سات بالیاں اگیں اور ہر بالی میں سو دانے ہوں۔ اور اللہ جس کے لئے چاہے اس میں اضافہ فرماتا ہے۔ اور اللہ بڑی وسعت والا، بڑا علم والا ہے۔</p>
            <p><em>(سورۃ البقرہ 2:261)</em></p>
        </div>
        
        <div class="contact-info">
            <p><strong>📍 Khanqah Saifia Murshidabad Shreef</strong></p>
            <p>Khanqah Saifia & Jamia Abi Bakr</p>
            <p>Faisalabad, Pakistan</p>
            <p>📞 Phone: +92-321-7677062</p>
            <p>🌐 Website: www.khanqahsaifia.com</p>
        </div>
        
        <div class="quran-verse" style="background: #fff3cd; border-left-color: #856404;">
            <p><strong>💫 A Reminder:</strong></p>
            <p>"Who is it that would loan Allah a goodly loan so He may multiply it for him many times over? And it is Allah who withholds and grants abundance, and to Him you will be returned."</p>
            <p><em>(Surah Al-Baqarah 2:245)</em></p>
        </div>
        
        <div class="footer">
            <p>This is an automated receipt. Please keep this email for your records.</p>
            <p>© ${new Date().getFullYear()} Khanqah Saifia Murshidabad. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
}

// Function to send donation receipt email
export async function sendDonationReceipt({
    to,
    donationData,
    customMessage = ''
}) {
    try {
        const html = renderDonationEmail({
            donorName: donationData.donorName,
            amount: donationData.amount,
            purpose: donationData.purpose,
            paymentMethod: donationData.paymentMethod,
            donationId: donationData.id,
            date: donationData.date,
            customMessage,
            receiptNumber: donationData.receiptNumber
        });

        const text = `
JazakAllah Khair for Your Donation

Dear ${donationData.donorName},

We have received your donation of Rs ${donationData.amount} towards "${donationData.purpose}".

Payment Method: ${donationData.paymentMethod}
Date: ${new Date(donationData.date).toLocaleDateString()}
Receipt ID: ${donationData.id.substring(0, 8).toUpperCase()}

Quranic Reminder:
"The example of those who spend their wealth in the way of Allah is like a seed which grows seven ears; in every ear there are a hundred grains." (2:261)

May Allah accept your contribution and multiply its reward for you. Ameen.

Astana Foundation
Khanqah Saifia & Jamia Abi Bakr
Faisalabad, Pakistan
`;

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Astana Foundation <donations@astanafoundation.org>',
            to,
            subject: `JazakAllah Khair for Your Donation - Rs ${donationData.amount} - Astana Foundation`,
            html,
            text
        });

        if (error) {
            console.error('Email sending error:', error);
            throw error;
        }

        return {
            success: true,
            messageId: data.id,
            timestamp: new Date()
        };
    } catch (error) {
        console.error('Failed to send donation receipt:', error);
        throw error;
    }
}

// Function to send WhatsApp notification
export async function sendWhatsAppNotification({ to, message }) {
    // Implementation remains the same as your existing function
    // ... (your existing WhatsApp code)
}