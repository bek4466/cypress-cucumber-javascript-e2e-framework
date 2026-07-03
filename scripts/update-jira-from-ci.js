const path = require('node:path');
const dotenv = require('dotenv');
const { JiraCloudClient } = require('../cypress/support/integrations/jira-cloud-client');

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

/**
 * Updates Jira only when explicitly enabled. CI_JOB_STATUS is supplied by
 * GitLab after_script; the template preserves the test status separately.
 */
async function main() {
  if (process.env.JIRA_ENABLED !== 'true') {
    console.log('Jira Cloud update skipped because JIRA_ENABLED is not true.');
    return;
  }

  const issueKey = process.env.JIRA_ISSUE_KEY;
  if (!issueKey) throw new Error('JIRA_ISSUE_KEY is required when Jira updates are enabled.');
  const client = new JiraCloudClient({
    baseUrl: process.env.JIRA_BASE_URL,
    email: process.env.JIRA_EMAIL,
    apiToken: process.env.JIRA_API_TOKEN
  });
  await client.updateFromCi({
    issueKey,
    passed: process.env.CI_JOB_STATUS === 'success',
    passTransition: process.env.JIRA_PASS_TRANSITION,
    failTransition: process.env.JIRA_FAIL_TRANSITION,
    buildUrl: process.env.CI_JOB_URL || process.env.CI_PIPELINE_URL
  });
  console.log(`Jira Cloud issue ${issueKey} updated.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
