import nodemailer from 'nodemailer';

const accounts = JSON.parse(process.env.SMTP_ACCOUNTS_JSON || '[]');

let index = 0;
export async function sendEmailRotating(to, subject, html, text, attachment = null) {
  const sender = accounts[index];
  index = (index + 1) % accounts.length;

  const transporter = nodemailer.createTransport({
    host: sender.host,
    port: sender.port,
    secure: true,
    auth: {
      user: sender.user,
      pass: sender.pass
    }
  });

  const mail = {
    from: sender.from,
    to,
    subject,
    html,
    text
  };

  if (attachment) {
    mail.attachments = [attachment];
  }

  await transporter.sendMail(mail);
}
