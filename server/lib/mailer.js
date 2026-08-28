const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

function createSmtpTransporter(config) {
  return nodemailer.createTransport({
    host: config.host,
    port: Number(config.port),
    secure: Number(config.port) === 465,
    auth: {
      user: config.user,
      pass: config.password,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000
  });
}

async function testSmtp(config, testRecipient) {
  try {
    const transporter = createSmtpTransporter(config);
    await transporter.verify();

    if (testRecipient) {
      const info = await transporter.sendMail({
        from: `"${config.name}" <${config.email}>`,
        to: testRecipient,
        subject: 'Prueba SMTP - MassMail Pro',
        html: '<p>La configuracion SMTP funciona correctamente.</p>'
      });
      return { success: true, messageId: info.messageId };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendEmail(config, to, subject, html) {
  try {
    const transporter = createSmtpTransporter(config);

    // Local-path CID embedding, ported from the Electron main process. On a
    // hosted server the "local path" refers to the server's own filesystem
    // (not the sender's machine), so this will normally find nothing and
    // no-op harmlessly — kept for parity with the original behavior.
    const attachments = [];
    let processedHtml = html;
    const imgSrcRegex = /<img[^>]+src="([^">]+)"/g;
    let match;

    while ((match = imgSrcRegex.exec(html)) !== null) {
      const originalSrc = match[1];

      if (!originalSrc.startsWith('http') && !originalSrc.startsWith('data:') && !originalSrc.startsWith('app-file:')) {
        let absolutePath = originalSrc;

        if (!path.isAbsolute(absolutePath)) {
          try {
            absolutePath = path.resolve(absolutePath);
          } catch {
            continue;
          }
        }

        if (fs.existsSync(absolutePath)) {
          const fileName = path.basename(absolutePath);
          const cid = `img_${Math.random().toString(36).substring(2, 9)}`;

          attachments.push({ filename: fileName, path: absolutePath, cid });
          processedHtml = processedHtml.replace(originalSrc, `cid:${cid}`);
        }
      }
    }

    const info = await transporter.sendMail({
      from: `"${config.name}" <${config.email}>`,
      to,
      subject,
      html: processedHtml,
      attachments
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { testSmtp, sendEmail };
