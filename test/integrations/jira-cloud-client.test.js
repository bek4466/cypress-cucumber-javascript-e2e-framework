const test = require('node:test');
const assert = require('node:assert/strict');
const { JiraCloudClient } = require('../../cypress/support/integrations/jira-cloud-client');

/**
 * Verifies the Jira Cloud template with an injected HTTP mock. No Jira project
 * or API token is needed, and no external issue can be changed by this test.
 */
test('Jira client comments and performs the configured passing transition', async () => {
  const calls = [];
  const fetchImplementation = async (url, options) => {
    calls.push({ url, options });
    if ((options.method || 'GET') === 'GET') {
      return new Response(JSON.stringify({ transitions: [{ id: '31', name: 'Done' }] }), {
        status: 200
      });
    }
    return new Response(null, { status: 204 });
  };
  const client = new JiraCloudClient({
    baseUrl: 'https://example.atlassian.net',
    email: 'sdet@example.com',
    apiToken: 'test-token',
    fetchImplementation
  });

  await client.updateFromCi({
    issueKey: 'QA-42',
    passed: true,
    passTransition: 'Done',
    failTransition: 'Failed',
    buildUrl: 'https://gitlab.example/job/42'
  });

  assert.equal(calls.length, 3);
  assert.match(calls[0].url, /QA-42\/comment$/);
  assert.match(calls[2].options.body, /"id":"31"/);
  assert.match(calls[0].options.headers.Authorization, /^Basic /);
});

/** Verifies Zephyr generation reads only the required Jira story fields. */
test('Jira client reads a user story by issue key', async () => {
  let requestedUrl;
  const client = new JiraCloudClient({
    baseUrl: 'https://example.atlassian.net',
    email: 'sdet@example.com',
    apiToken: 'test-token',
    fetchImplementation: async (url) => {
      requestedUrl = url;
      return new Response(
        JSON.stringify({
          id: '10123',
          key: 'QA-123',
          fields: { summary: 'Customer signs in', description: null }
        }),
        { status: 200 }
      );
    }
  });

  const issue = await client.getIssue('QA-123');
  assert.equal(issue.id, '10123');
  assert.match(requestedUrl, /\/rest\/api\/3\/issue\/QA-123\?fields=/);
  assert.match(requestedUrl, /summary/);
  assert.match(requestedUrl, /description/);
});
