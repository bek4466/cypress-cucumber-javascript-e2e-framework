/** Escapes untrusted report text before placing it in HTML email. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Prevents Slack mrkdwn mentions/links from untrusted branch/project text. */
function escapeSlack(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Produces a compact plain-text/Markdown summary for files and email fallback.
 * @param {object} summary Channel-neutral CI summary.
 * @returns {string} Markdown text.
 */
function renderMarkdown(summary) {
  const lines = [
    `# E2E Test Result: ${summary.outcome}`,
    '',
    `- Project: ${summary.project}`,
    `- Environment: ${summary.environment}`,
    `- Branch: ${summary.branch}`,
    `- Commit: ${summary.commit || 'not available'}`,
    `- Scenarios: ${summary.counts.total}`,
    `- Passed: ${summary.counts.passed}`,
    `- Failed: ${summary.counts.failed}`,
    `- Skipped/Pending: ${summary.counts.skipped + summary.counts.pending}`,
    `- Duration: ${summary.durationSeconds}s`
  ];
  if (summary.reportUrl) lines.push(`- Full report: ${summary.reportUrl}`);
  if (!summary.reportAvailable) lines.push('- Warning: Cucumber JSON was unavailable.');
  if (summary.failedScenarios.length) {
    lines.push('', '## Failed scenarios');
    for (const item of summary.failedScenarios) {
      lines.push(`- ${item.feature} / ${item.scenario}: ${item.failure?.step || 'failed'}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Produces a self-contained HTML email/report summary.
 * @param {object} summary Channel-neutral CI summary.
 * @returns {string} Safe HTML document.
 */
function renderHtml(summary) {
  const color = summary.outcome === 'PASSED' ? '#147d3f' : summary.outcome === 'FAILED' ? '#b42318' : '#8a6116';
  const failures = summary.failedScenarios.length
    ? `<h2>Failed scenarios</h2><ul>${summary.failedScenarios.map((item) =>
      `<li><strong>${escapeHtml(item.feature)} / ${escapeHtml(item.scenario)}</strong><br>${escapeHtml(item.failure?.step || 'Failed')}</li>`
    ).join('')}</ul>`
    : '';
  const reportLink = summary.reportUrl
    ? `<p><a href="${escapeHtml(summary.reportUrl)}">Open complete CI test artifacts</a></p>`
    : '';
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#242424">
<h1 style="color:${color}">E2E Test Result: ${escapeHtml(summary.outcome)}</h1>
<table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse">
<tr><td>Project</td><td>${escapeHtml(summary.project)}</td></tr>
<tr><td>Environment</td><td>${escapeHtml(summary.environment)}</td></tr>
<tr><td>Branch / commit</td><td>${escapeHtml(summary.branch)} / ${escapeHtml(summary.commit || 'not available')}</td></tr>
<tr><td>Total</td><td>${summary.counts.total}</td></tr>
<tr><td>Passed</td><td>${summary.counts.passed}</td></tr>
<tr><td>Failed</td><td>${summary.counts.failed}</td></tr>
<tr><td>Skipped / pending</td><td>${summary.counts.skipped + summary.counts.pending}</td></tr>
<tr><td>Duration</td><td>${summary.durationSeconds}s</td></tr>
</table>${reportLink}${failures}</body></html>`;
}

/** Creates a Slack Block Kit incoming-webhook payload. */
function renderSlackPayload(summary) {
  const icon = summary.outcome === 'PASSED' ? ':white_check_mark:' : summary.outcome === 'FAILED' ? ':x:' : ':warning:';
  return {
    text: `${icon} E2E test result: ${summary.outcome}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `E2E Test Result: ${summary.outcome}` }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Project*\n${escapeSlack(summary.project)}` },
          { type: 'mrkdwn', text: `*Environment*\n${escapeSlack(summary.environment)}` },
          { type: 'mrkdwn', text: `*Passed*\n${summary.counts.passed}` },
          { type: 'mrkdwn', text: `*Failed*\n${summary.counts.failed}` },
          { type: 'mrkdwn', text: `*Branch*\n${escapeSlack(summary.branch)}` },
          { type: 'mrkdwn', text: `*Duration*\n${summary.durationSeconds}s` }
        ]
      },
      ...(summary.reportUrl
        ? [{ type: 'section', text: { type: 'mrkdwn', text: `<${summary.reportUrl}|Open complete test report>` } }]
        : [])
    ]
  };
}

/** Creates a Teams incoming-webhook Adaptive Card payload. */
function renderTeamsPayload(summary) {
  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            { type: 'TextBlock', size: 'Large', weight: 'Bolder', text: `E2E Test Result: ${summary.outcome}` },
            {
              type: 'FactSet',
              facts: [
                { title: 'Project', value: summary.project },
                { title: 'Environment', value: summary.environment },
                { title: 'Branch', value: summary.branch },
                { title: 'Passed', value: String(summary.counts.passed) },
                { title: 'Failed', value: String(summary.counts.failed) },
                { title: 'Duration', value: `${summary.durationSeconds}s` }
              ]
            }
          ],
          actions: summary.reportUrl
            ? [{ type: 'Action.OpenUrl', title: 'Open complete test report', url: summary.reportUrl }]
            : []
        }
      }
    ]
  };
}

module.exports = {
  renderHtml,
  renderMarkdown,
  renderSlackPayload,
  renderTeamsPayload
};
