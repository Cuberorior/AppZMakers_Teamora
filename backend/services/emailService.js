import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send an email using Nodemailer
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body of the email
 * @returns {Promise} - Resolves when sent
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"WorkForge" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(info);
        }
      });
    });

    console.log('Email sent successfully via Nodemailer: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error occurred while sending email via Nodemailer:', error.message);
    throw error;
  }
};
