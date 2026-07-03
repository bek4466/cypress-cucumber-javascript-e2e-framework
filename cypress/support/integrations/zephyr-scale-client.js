/**
 * Zephyr Scale Cloud REST v2 client. Its bearer token is independent from Jira
 * authentication and must remain in .env or protected CI secret storage.
 */
class ZephyrScaleClient {
  /**
   * @param {object} options Client options.
   * @param {string} options.apiToken Zephyr Scale Cloud API access token.
   * @param {string} [options.baseUrl] Zephyr Scale API base URL.
   * @param {Function} [options.fetchImplementation] Injectable fetch for tests.
   */
  constructor({
    apiToken,
    baseUrl = 'https://api.zephyrscale.smartbear.com/v2',
    fetchImplementation = fetch
  }) {
    if (!apiToken) throw new Error('Zephyr Scale requires ZEPHYR_SCALE_API_TOKEN.');
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetch = fetchImplementation;
    this.headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`
    };
  }

  /**
   * Calls Zephyr Scale and converts non-success responses to sanitized errors.
   * @param {string} path REST v2 path.
   * @param {object} [options] Fetch options.
   * @returns {Promise<object|null>} Parsed JSON response or null.
   */
  async request(path, options = {}) {
    const response = await this.fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: { ...this.headers, ...(options.headers || {}) }
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(
        `Zephyr Scale ${options.method || 'GET'} ${path} failed with HTTP ` +
          `${response.status}: ${text.slice(0, 500)}`
      );
    }
    return text ? JSON.parse(text) : null;
  }

  /**
   * Returns test cases already linked to a Jira issue key.
   * @param {string} issueKey Jira issue key.
   * @returns {Promise<Array<object>>} Linked test case keys/versions.
   */
  async getLinkedTestCases(issueKey) {
    return this.request(`/issuelinks/${encodeURIComponent(issueKey)}/testcases`);
  }

  /**
   * Creates the Zephyr test-case shell.
   * @param {object} testCase Zephyr Test Case Input payload.
   * @returns {Promise<object>} Created test case including its key.
   */
  async createTestCase(testCase) {
    return this.request('/testcases', {
      method: 'POST',
      body: JSON.stringify(testCase)
    });
  }

  /**
   * Replaces Zephyr's automatically created empty step with generated steps.
   * @param {string} testCaseKey Zephyr test case key.
   * @param {Array<object>} steps Inline test steps.
   * @returns {Promise<object|null>} API response.
   */
  async overwriteTestSteps(testCaseKey, steps) {
    return this.request(`/testcases/${encodeURIComponent(testCaseKey)}/teststeps`, {
      method: 'POST',
      body: JSON.stringify({
        mode: 'OVERWRITE',
        items: steps.map((inline) => ({ inline }))
      })
    });
  }

  /**
   * Adds Zephyr coverage between a test case and numeric Jira issue ID.
   * @param {string} testCaseKey Zephyr test case key.
   * @param {number} jiraIssueId Numeric Jira issue ID returned by Jira REST.
   * @returns {Promise<object>} Created issue link.
   */
  async linkToJiraIssue(testCaseKey, jiraIssueId) {
    return this.request(`/testcases/${encodeURIComponent(testCaseKey)}/links/issues`, {
      method: 'POST',
      body: JSON.stringify({ issueId: jiraIssueId })
    });
  }

  /**
   * Creates one case, writes its ordered steps, and links it to Jira.
   * @param {object} testCase Generated case with Zephyr fields and steps.
   * @param {number} jiraIssueId Numeric Jira issue ID.
   * @returns {Promise<object>} Created Zephyr case.
   */
  async createLinkedTestCase(testCase, jiraIssueId) {
    const { steps, ...testCaseInput } = testCase;
    const created = await this.createTestCase(testCaseInput);
    if (!created?.key) throw new Error('Zephyr Scale did not return a test case key.');
    try {
      await this.overwriteTestSteps(created.key, steps);
      await this.linkToJiraIssue(created.key, jiraIssueId);
      return created;
    } catch (error) {
      throw new Error(
        `Zephyr test case ${created.key} was created but not fully configured/linked: ${error.message}`
      );
    }
  }
}

module.exports = { ZephyrScaleClient };
