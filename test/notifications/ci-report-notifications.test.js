const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  createCiReportSummary,
  scenarioStatus
} = require('../../scripts/notifications/ci-report-summary');
const {
  renderHtml,
  renderMarkdown,
  renderSlackPayload,
  renderTeamsPayload
} = require('../../scripts/notifications/notification-renderer');
const { WebhookNotifier } = require('../../scripts/notifications/webhook-notifier');
const {
  EmailNotifier,
  recipientList
} = require('../../scripts/notifications/email-notifier');
const {
  smtpConfiguration,
  writeNotificationBundle
} = require('../../scripts/publish-ci-report');

const cucumberReport = [
  {
    name: 'Account access',
    elements: [
      {
        keyword: 'Scenario',
        name: 'Valid customer signs in',
        steps: [{ name: 'sign in', result: { status: 'passed', duration: 1_000_000_000 } }]
      },
      {
        keyword: 'Scenario',
        name: 'Locked customer is rejected',
        steps: [
          {
            keyword: 'Then ',
            name: 'access is denied',
            result: {
              status: 'failed',
              duration: 500_000_000,
              error_message: 'Expected access denied but received account page'
            }
          }
        ]
      }
    ]
  }
];

/** Verifies report aggregation and sanitized failure extraction. */
test('Cucumber JSON becomes a channel-neutral failed CI summary', () => {
  const summary = createCiReportSummary({
    report: cucumberReport,
    environmentVariables: {
      CI_JOB_STATUS: 'failed',
      CI_PROJECT_PATH: 'quality/e2e',
      CYPRESS_environment: 'staging',
      CI_COMMIT_REF_NAME: 'feature/login',
      CI_COMMIT_SHA: '1234567890',
      CI_JOB_URL: 'https://gitlab.example/jobs/10'
    }
  });
  assert.equal(summary.outcome, 'FAILED');
  assert.deepEqual(summary.counts, {
    total: 2,
    passed: 1,
    failed: 1,
    skipped: 0,
    pending: 0,
    unknown: 0
  });
  assert.equal(summary.durationSeconds, 2);
  assert.equal(summary.failedScenarios[0].failure.step, 'Then access is denied');
  assert.match(summary.reportUrl, /artifacts\/browse\/reports/);
});

/** Verifies hooks/undefined steps correctly fail a scenario. */
test('scenario status treats undefined steps as failures', () => {
  assert.equal(
    scenarioStatus({ steps: [{ result: { status: 'undefined' } }] }),
    'failed'
  );
});

/** Verifies all output formats contain metrics and report navigation. */
test('renderers create Markdown, HTML, Slack, and Teams messages', () => {
  const summary = createCiReportSummary({ report: cucumberReport });
  summary.reportUrl = 'https://gitlab.example/report';
  summary.project = '<!channel>';
  assert.match(renderMarkdown(summary), /Failed: 1/);
  assert.match(renderHtml(summary), /Open complete CI test artifacts/);
  const slack = renderSlackPayload(summary);
  assert.doesNotMatch(JSON.stringify(slack), /<!channel>/);
  assert.match(JSON.stringify(slack), /Open complete test report/);
  const teams = renderTeamsPayload(summary);
  assert.equal(teams.attachments[0].content.type, 'AdaptiveCard');
  assert.equal(teams.attachments[0].content.actions[0].url, summary.reportUrl);
});

/** Verifies webhook delivery and errors never expose the secret webhook URL. */
test('webhook notifier sends JSON and sanitizes delivery errors', async () => {
  let request;
  const notifier = new WebhookNotifier(async (url, options) => {
    request = { url, options };
    return new Response('invalid payload', { status: 400 });
  });
  await assert.rejects(
    () => notifier.send({ channel: 'Slack', webhookUrl: 'https://secret.example/hook', payload: { text: 'result' } }),
    (error) => {
      assert.match(error.message, /Slack notification failed with HTTP 400/);
      assert.doesNotMatch(error.message, /secret\.example/);
      return true;
    }
  );
  assert.equal(request.options.method, 'POST');
  assert.deepEqual(JSON.parse(request.options.body), { text: 'result' });
});

/** Verifies email distribution lists and SMTP payload without a mail server. */
test('email notifier sends one message to To, CC, and BCC bundles', async () => {
  let sentMessage;
  const nodemailerMock = {
    createTransport(configuration) {
      assert.equal(configuration.host, 'smtp.example.com');
      return {
        async sendMail(message) {
          sentMessage = message;
          return { messageId: 'mock-message' };
        }
      };
    }
  };
  const notifier = new EmailNotifier(
    {
      smtp: { host: 'smtp.example.com', port: 587 },
      from: 'reports@example.com',
      to: recipientList('qa@example.com;dev@example.com'),
      cc: recipientList('lead@example.com'),
      bcc: []
    },
    nodemailerMock
  );
  await notifier.send({ subject: 'Passed', text: 'text', html: '<p>text</p>', attachments: [] });
  assert.deepEqual(sentMessage.to, ['qa@example.com', 'dev@example.com']);
  assert.deepEqual(sentMessage.cc, ['lead@example.com']);
});

/** Verifies the downloadable notification bundle and SMTP validation. */
test('notification bundle writes JSON, Markdown, and HTML files', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-notification-'));
  try {
    const summary = createCiReportSummary({ report: cucumberReport });
    const files = writeNotificationBundle(summary, directory);
    assert.equal(fs.existsSync(files.json), true);
    assert.equal(fs.existsSync(files.markdown), true);
    assert.equal(fs.existsSync(files.html), true);
    assert.throws(
      () => smtpConfiguration({ SMTP_HOST: 'smtp.example.com', SMTP_USER: 'user' }),
      /SMTP_PASSWORD/
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
