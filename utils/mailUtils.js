const nodemailer = require('nodemailer');

// Configure the transporter
// For development, we'll use a local Ethereal account if possible, 
// or just log to console if no SMTP is provided.
// Configure the transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER || 'jess.satterfield21@ethereal.email',
        pass: process.env.EMAIL_PASS || '6m2fUK6C1B6dCcN9S7'
    },
    connectionTimeout: 10000, // 10 seconds timeout (Gmail handshake is slow)
    greetingTimeout: 10000 // 10 seconds timeout
});

/**
 * Sends a verification code to a user's email.
 */
async function sendVerificationEmail(targetEmail, code) {
    const mailOptions = {
        from: '"Great Library of Astra" <verify@astra-archive.com>',
        to: targetEmail,
        subject: 'Your Archive Access Code',
        html: `
            <div style="font-family: 'Georgia', serif; background-color: #f4e4bc; padding: 40px; border: 5px solid #c5a059; border-radius: 10px; color: #4a2c2a;">
                <h1 style="color: #8b0000; text-align: center; border-bottom: 2px solid #c5a059; padding-bottom: 20px;">GRAND ARCHIVE OF ASTRA</h1>
                <p style="font-size: 1.2rem;">Greetings, Seekers of the Scroll,</p>
                <p>Your request to join the Great Library has been heard. To seal your registration and gain access to the Artist's Cave, you must present this sacred code:</p>
                <div style="background-color: #4a2c2a; color: #c5a059; padding: 20px; text-align: center; font-size: 3rem; font-weight: bold; letter-spacing: 12px; margin: 30px 0; border-radius: 5px;">
                    ${code}
                </div>
                <p style="font-style: italic;">"May your ink never dry and your scrolls remain eternal."</p>
                <hr style="border: none; border-top: 1px solid #c5a059; margin: 30px 0;">
                <p style="font-size: 0.8rem; text-align: center; color: #888;">If you did not request this code, simply dissolve this message into the ether.</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Verification Email Sent: %s', info.messageId);

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log('📬 Preview URL: %s', previewUrl);
        }
        return true;
    } catch (error) {
        console.error('❌ Email Sending Failed:', error.message);
        if (error.code === 'EAUTH') {
            console.error('🔑 Authentication failed. Check your EMAIL_USER and EMAIL_PASS.');
        } else if (error.code === 'ESOCKET') {
            console.error('🌐 Connection failed. Check your EMAIL_HOST and EMAIL_PORT.');
        }
        return false;
    }
}

module.exports = {
    sendVerificationEmail
};
