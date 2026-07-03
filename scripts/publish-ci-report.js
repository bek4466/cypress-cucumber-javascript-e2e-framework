const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const {
  createCiReportSummary,
  loadCucumberReport
} = require('./notifications/ci-report-summary');
const {
  renderHtml,
  renderMarkdown,
  renderSlackPayload,
  renderTeamsPayload
} = require('./notifications/notification-renderer');
const { WebhookNotifier } = require('./notifications/webhook-notifier');
const { EmailNotifier, recipientList } = require('./notifications/email-notifier');

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

/** Converts conventional true/false environment values. */
function enabled(value) {
  return String(value).toLowerCase() === 'true';
}

/**
 * Creates SMTP configuration without logging credentials.
 * @param {NodeJS.ProcessEnv} source Environment variables.
 * @returns {object} Nodemailer SMTP transport options.
 */
function smtpConfiguration(source) {
  const port = Number(source.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1) throw new Error('SMTP_PORT must be a positive integer.');
  if (source.SMTP_USER && !source.SMTP_PASSWORD) {
    throw new Error('SMTP_PASSWORD is required when SMTP_USER is configured.');
  }
  return {
    host: source.SMTP_HOST,
    port,
    secure: enabled(source.SMTP_SECURE),
    auth: source.SMTP_USER
      ? { user: source.SMTP_USER, pass: source.SMTP_PASSWORD }
      : undefined
  };
}

/** Writes JSON, Markdown, and HTML summaries under ignored report output. */
function writeNotificationBundle(summary, bundleDirectory) {
  fs.mkdirSync(bundleDirectory, { recursive: true });
  const files = {
    json: path.join(bundleDirectory, 'ci-test-summary.json'),
    markdown: path.join(bundleDirectory, 'ci-test-summary.md'),
    html: path.join(bundleDirectory, 'ci-test-summary.html')
  };
  fs.writeFileSync(files.json, `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(files.markdown, renderMarkdown(summary));
  fs.writeFileSync(files.html, renderHtml(summary));
  return files;
}

/** Generates the bundle and publishes enabled notifications. */
async function main() {
  const root = path.resolve(__dirname, '..');
  const reportPath = path.resolve(
    root,
    process.env.CUCUMBER_JSON_PATH || 'reports/cucumber-json/cucumber-report.json'
  );
  const bundleDirectory = path.resolve(root, 'reports', 'notification-bundle');
  const report = loadCucumberReport(reportPath);
  const summary = createCiReportSummary({ report });
  const files = writeNotificationBundle(summary, bundleDirectory);
  console.log(`CI notification bundle created at ${bundleDirectory}`);

  if (!enabled(process.env.CI_NOTIFICATIONS_ENABLED)) {
    console.log('External notifications skipped because CI_NOTIFICATIONS_ENABLED is not true.');
    return;
  }

  const tasks = [];
  const webhookNotifier = new WebhookNotifier();
  if (enabled(process.env.SLACK_NOTIFICATIONS_ENABLED)) {
    tasks.push({
      name: 'Slack',
      promise: webhookNotifier.send({
        channel: 'Slack',
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        payload: renderSlackPayload(summary)
      })
    });
  }
  if (enabled(process.env.TEAMS_NOTIFICATIONS_ENABLED)) {
    tasks.push({
      name: 'Teams',
      promise: webhookNotifier.send({
        channel: 'Teams',
        webhookUrl: process.env.TEAMS_WEBHOOK_URL,
        payload: renderTeamsPayload(summary)
      })
    });
  }
  if (enabled(process.env.EMAIL_NOTIFICATIONS_ENABLED)) {
    const emailNotifier = new EmailNotifier({
      smtp: smtpConfiguration(process.env),
      from: process.env.REPORT_EMAIL_FROM,
      to: recipientList(process.env.REPORT_EMAIL_TO),
      cc: recipientList(process.env.REPORT_EMAIL_CC),
      bcc: recipientList(process.env.REPORT_EMAIL_BCC)
    });
    const prefix = process.env.REPORT_EMAIL_SUBJECT_PREFIX || '[E2E]';
    tasks.push({
      name: 'Email',
      promise: emailNotifier.send({
        subject: `${prefix} ${summary.outcome} - ${summary.project} - ${summary.environment}`,
        text: renderMarkdown(summary),
        html: renderHtml(summary),
        attachments: [
          { filename: path.basename(files.json), path: files.json },
          { filename: path.basename(files.markdown), path: files.markdown },
          { filename: path.basename(files.html), path: files.html }
        ]
      })
    });
  }

  if (!tasks.length) {
    console.log('No notification destination is enabled.');
    return;
  }
  const settled = await Promise.allSettled(tasks.map((task) => task.promise));
  const failures = [];
  settled.forEach((result, index) => {
    const name = tasks[index].name;
    if (result.status === 'fulfilled') console.log(`${name} notification sent.`);
    else {
      failures.push(`${name}: ${result.reason.message}`);
      console.error(`${name} notification failed: ${result.reason.message}`);
    }
  });
  if (failures.length && enabled(process.env.NOTIFICATION_FAIL_ON_ERROR)) {
    throw new Error(`Required notifications failed: ${failures.join(' | ')}`);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { enabled, smtpConfiguration, writeNotificationBundle };
