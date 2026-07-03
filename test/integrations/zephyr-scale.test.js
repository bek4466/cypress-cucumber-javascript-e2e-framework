const test = require('node:test');
const assert = require('node:assert/strict');
const { ZephyrScaleClient } = require('../../cypress/support/integrations/zephyr-scale-client');
const { ZephyrStoryService } = require('../../cypress/support/integrations/zephyr-story-service');
const {
  UserStoryTestCaseGenerator,
  adfToPlainText
} = require('../../cypress/support/integrations/user-story-test-case-generator');
const {
  optionalPositiveInteger,
  parseArguments,
  parseOptionalJson
} = require('../../scripts/create-zephyr-tests-from-jira');

const jiraIssue = {
  id: '10123',
  key: 'QA-123',
  fields: {
    summary: 'Customer signs in',
    project: { key: 'QA' },
    labels: ['authentication'],
    description: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Scenario: Valid sign-in' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Given an active customer' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'When valid credentials are submitted' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Then the account page is displayed' }]
        }
      ]
    }
  }
};

/** Verifies Jira ADF is converted into parseable story text. */
test('ADF conversion preserves scenario and step line boundaries', () => {
  const text = adfToPlainText(jiraIssue.fields.description);
  assert.match(text, /Scenario: Valid sign-in\n/);
  assert.match(text, /Then the account page is displayed/);
});

/** Verifies explicit Gherkin becomes ordered Zephyr steps and traceability. */
test('story generator creates a Zephyr case from Jira Gherkin', () => {
  const cases = UserStoryTestCaseGenerator.generate({
    issue: jiraIssue,
    projectKey: 'QA'
  });
  assert.equal(cases.length, 1);
  assert.equal(cases[0].name, '[QA-123] Valid sign-in');
  assert.equal(cases[0].steps.length, 3);
  assert.equal(cases[0].steps[2].expectedResult, 'the account page is displayed');
  assert.deepEqual(cases[0].labels, ['generated-from-jira', 'QA-123', 'authentication']);
});

/** Verifies case creation, step overwrite, and Jira coverage link payloads. */
test('Zephyr client creates, configures, and links a test case', async () => {
  const calls = [];
  const responses = [
    { status: 201, body: { id: 7, key: 'QA-T7' } },
    { status: 201, body: { id: 8 } },
    { status: 201, body: { id: 9 } }
  ];
  const fetchImplementation = async (url, options) => {
    calls.push({ url, options });
    const next = responses.shift();
    return new Response(JSON.stringify(next.body), { status: next.status });
  };
  const client = new ZephyrScaleClient({
    apiToken: 'test-token',
    fetchImplementation
  });
  const created = await client.createLinkedTestCase(
    {
      projectKey: 'QA',
      name: '[QA-123] Valid sign-in',
      steps: [{ description: 'Sign in', testData: '', expectedResult: 'Success' }]
    },
    10123
  );

  assert.equal(created.key, 'QA-T7');
  assert.match(calls[0].url, /\/testcases$/);
  assert.match(calls[1].url, /\/testcases\/QA-T7\/teststeps$/);
  assert.match(calls[1].options.body, /"mode":"OVERWRITE"/);
  assert.match(calls[2].url, /\/testcases\/QA-T7\/links\/issues$/);
  assert.deepEqual(JSON.parse(calls[2].options.body), { issueId: 10123 });
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-token');
});

/** Verifies duplicate linked coverage blocks accidental case recreation. */
test('story service refuses existing Zephyr coverage by default', async () => {
  const service = new ZephyrStoryService({
    jiraClient: { getIssue: async () => jiraIssue },
    zephyrClient: {
      getLinkedTestCases: async () => [{ key: 'QA-T1' }]
    }
  });
  await assert.rejects(
    () => service.create({ issueIdOrKey: 'QA-123' }),
    /already has linked Zephyr cases: QA-T1/
  );
});

/** Verifies the documented CLI accepts story ID/text and safety switches. */
test('Zephyr script parses Jira ID, description, and confirmation options', () => {
  assert.deepEqual(
    parseArguments([
      '--jira-id',
      'QA-123',
      '--description',
      'Additional acceptance criterion',
      '--confirm',
      '--allow-existing'
    ]),
    {
      'jira-id': 'QA-123',
      description: 'Additional acceptance criterion',
      confirm: true,
      'allow-existing': true
    }
  );
});

/** Verifies malformed limits/custom fields fail before an external API call. */
test('Zephyr script validates numeric limits and custom-field JSON', () => {
  assert.equal(optionalPositiveInteger('20', 'LIMIT'), 20);
  assert.throws(() => optionalPositiveInteger('0', 'LIMIT'), /positive integer/);
  assert.deepEqual(parseOptionalJson('{"Type":"Functional"}', 'FIELDS'), {
    Type: 'Functional'
  });
  assert.throws(() => parseOptionalJson('[]', 'FIELDS'), /JSON object/);
});
