# CI Report Notifications

## Outcome

The notification workflow runs after Cypress and turns the primary Cucumber JSON report into a channel-neutral result. It creates a downloadable bundle, then optionally posts to Microsoft Teams, Slack, and SMTP email distribution lists.

Generated files:

```text
reports/notification-bundle/ci-test-summary.json
reports/notification-bundle/ci-test-summary.md
reports/notification-bundle/ci-test-summary.html
```

The summary contains pass/fail/incomplete outcome, scenario counts, duration, environment, branch, commit, pipeline/job/report links, and up to 20 failed scenarios with their failed step. It intentionally excludes screenshot/video embeddings and does not print webhook URLs, SMTP passwords, or report secrets.

## Local bundle test

No external destination is needed:

```powershell
$env:CI_NOTIFICATIONS_ENABLED = "false"
npm run report:notify
```

Open `reports/notification-bundle/ci-test-summary.html`. The command reads `reports/cucumber-json/cucumber-report.json`; override it with `CUCUMBER_JSON_PATH` only when a pipeline stores Cucumber JSON elsewhere.

## Master and delivery behavior

```text
CI_NOTIFICATIONS_ENABLED=false
NOTIFICATION_FAIL_ON_ERROR=false
```

The bundle is always generated. External sending occurs only when the master switch is true. Each destination also has its own switch. Delivery attempts are independent and use `Promise.allSettled`, so a Slack failure does not prevent Teams/email delivery.

With `NOTIFICATION_FAIL_ON_ERROR=false`, delivery errors are logged but do not fail the notification command. Set it to true only when notification delivery is a required pipeline control. Keep test failures and delivery failures conceptually separate.

## Slack

Create a Slack app incoming webhook and store its URL as a protected/masked variable:

```text
CI_NOTIFICATIONS_ENABLED=true
SLACK_NOTIFICATIONS_ENABLED=true
SLACK_WEBHOOK_URL=<secret incoming-webhook URL>
```

The script posts a Block Kit summary and full-report link. Slack webhooks do not upload the report artifacts; GitLab remains the artifact host.

## Microsoft Teams

Create a Teams Workflows webhook using the “When a Teams webhook request is received” trigger, then store the generated URL:

```text
CI_NOTIFICATIONS_ENABLED=true
TEAMS_NOTIFICATIONS_ENABLED=true
TEAMS_WEBHOOK_URL=<secret workflow/incoming-webhook URL>
```

The payload is an Adaptive Card containing metrics and an `Open complete test report` action. The webhook URL is a credential and must be masked/protected.

## Email distribution bundle

Configure an approved SMTP relay:

```text
CI_NOTIFICATIONS_ENABLED=true
EMAIL_NOTIFICATIONS_ENABLED=true
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<relay-user>
SMTP_PASSWORD=<relay-password>
REPORT_EMAIL_FROM=e2e-reports@example.com
REPORT_EMAIL_TO=qa-team@example.com;developers@example.com
REPORT_EMAIL_CC=engineering-lead@example.com
REPORT_EMAIL_BCC=audit@example.com
REPORT_EMAIL_SUBJECT_PREFIX=[E2E]
```

Recipient fields accept comma or semicolon separators and remove duplicates inside each list. Each email contains text and HTML bodies and attaches JSON, Markdown, and HTML summaries. The body links to the complete GitLab artifacts, which contain Cucumber/Allure reports, screenshots, and videos.

Typical SMTP settings:

- Port 587 with `SMTP_SECURE=false` for STARTTLS-capable relays.
- Port 465 with `SMTP_SECURE=true` for implicit TLS.
- Leave `SMTP_USER` empty only when the approved internal relay does not require authentication.

Do not use personal mailbox passwords. Use a service account, application password, or relay credential approved by the organization.

## GitLab setup

The template defines three stages: quality, E2E, and notify. The notification job uses `when: always`, downloads the E2E job artifacts, publishes the small notification bundle, and runs even when tests fail.

Configure these in GitLab **Settings > CI/CD > Variables**:

1. Set `CI_NOTIFICATIONS_ENABLED=true`.
2. Enable one or more destination switches.
3. Add webhook/SMTP secrets as masked and protected variables.
4. Add email recipient lists as normal or protected variables based on organizational policy.
5. Optionally set `CI_REPORT_URL`; otherwise the script derives an artifact browser link from `CI_JOB_URL`.

The complete reports remain GitLab artifacts with `when: always`; they are never committed to Git.

## Failure behavior

- Failed Cucumber step: outcome `FAILED` with scenario/step details.
- CI job failed/canceled and report exists: outcome `FAILED`.
- Missing/empty Cucumber report: outcome `INCOMPLETE` unless CI explicitly reports success/failure.
- One destination fails: other enabled destinations still run.
- Webhook response is non-2xx: sanitized channel/status error; secret URL omitted.
- SMTP configuration is incomplete: explicit variable error; password omitted.

## Implementation map

| File | Responsibility |
| --- | --- |
| `ci-report-summary.js` | Parses Cucumber JSON and aggregates scenarios. |
| `notification-renderer.js` | Builds Markdown, HTML, Slack, and Teams payloads. |
| `webhook-notifier.js` | Sends Slack/Teams JSON without logging webhook URLs. |
| `email-notifier.js` | Sends To/CC/BCC HTML/text mail with attachments. |
| `publish-ci-report.js` | Writes the bundle and orchestrates destinations. |
| `ci-report-notifications.test.js` | Mock verification with no external messages. |

## Official references

- [Slack incoming webhooks](https://api.slack.com/messaging/webhooks)
- [Microsoft Teams incoming webhooks and Workflows](https://learn.microsoft.com/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook)
- [GitLab job execution and artifact order](https://docs.gitlab.com/ci/jobs/job_execution/)
- [Nodemailer SMTP usage](https://nodemailer.com/smtp)
