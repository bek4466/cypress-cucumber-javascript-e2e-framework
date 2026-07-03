/** Converts comma/semicolon-separated distribution lists to arrays. */
function recipientList(value = '') {
  return [...new Set(value.split(/[;,]/).map((item) => item.trim()).filter(Boolean))];
}

/**
 * SMTP email adapter. Nodemailer is injected in tests so verification cannot
 * contact a real mail server.
 */
class EmailNotifier {
  /**
   * @param {object} options Email configuration.
   * @param {object} options.smtp Nodemailer SMTP transport configuration.
   * @param {string} options.from Sender address.
   * @param {string[]} options.to Primary recipients.
   * @param {string[]} [options.cc] Carbon-copy recipients.
   * @param {string[]} [options.bcc] Blind-carbon-copy recipients.
   * @param {object} nodemailerImplementation Injectable Nodemailer module.
   */
  constructor(options, nodemailerImplementation = require('nodemailer')) {
    if (!options.smtp?.host || !options.from || !options.to?.length) {
      throw new Error('Email requires SMTP_HOST, REPORT_EMAIL_FROM, and REPORT_EMAIL_TO.');
    }
    this.options = options;
    this.transport = nodemailerImplementation.createTransport(options.smtp);
  }

  /**
   * Sends one HTML/text email with the generated summary bundle attached.
   * @param {object} message Message content.
   * @returns {Promise<object>} Nodemailer result.
   */
  async send({ subject, text, html, attachments }) {
    return this.transport.sendMail({
      from: this.options.from,
      to: this.options.to,
      cc: this.options.cc,
      bcc: this.options.bcc,
      subject,
      text,
      html,
      attachments
    });
  }
}

module.exports = { EmailNotifier, recipientList };
