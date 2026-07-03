/**
 * Minimal Jira Cloud REST v3 client for CI result updates. It uses Basic auth
 * with an Atlassian account email and API token supplied only through secrets.
 */
class JiraCloudClient {
  /**
   * @param {object} options Client configuration.
   * @param {string} options.baseUrl Jira site URL.
   * @param {string} options.email Atlassian account email.
   * @param {string} options.apiToken Jira Cloud API token.
   * @param {Function} options.fetchImplementation Injectable fetch for tests.
   */
  constructor({ baseUrl, email, apiToken, fetchImplementation = fetch }) {
    if (!baseUrl || !email || !apiToken) {
      throw new Error('Jira Cloud requires JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN.');
    }
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetch = fetchImplementation;
    this.headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`
    };
  }

  /**
   * Calls Jira and converts non-success responses into sanitized errors.
   * @param {string} path REST path.
   * @param {object} options Fetch options.
   * @returns {Promise<object|null>} Parsed JSON, or null for 204 responses.
   */
  async request(path, options = {}) {
    const response = await this.fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: { ...this.headers, ...(options.headers || {}) }
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Jira Cloud ${options.method || 'GET'} ${path} failed with HTTP ${response.status}: ${text.slice(0, 500)}`);
    }
    return text ? JSON.parse(text) : null;
  }

  /**
   * Resolves an available issue transition by ID or case-insensitive name.
   * @param {string} issueKey Jira issue key.
   * @param {string} transitionNameOrId Configured transition.
   * @returns {Promise<string>} Jira transition ID.
   */
  async resolveTransitionId(issueKey, transitionNameOrId) {
    const result = await this.request(
      `/rest/api/3/issue/${encodeURIComponent(issueKey)}/transitions`
    );
    const transition = result.transitions.find(
      (item) =>
        item.id === String(transitionNameOrId) ||
        item.name.toLowerCase() === String(transitionNameOrId).toLowerCase()
    );
    if (!transition) {
      const available = result.transitions.map((item) => `${item.name} (${item.id})`).join(', ');
      throw new Error(`Jira transition '${transitionNameOrId}' is unavailable for ${issueKey}. Available: ${available}`);
    }
    return transition.id;
  }

  /**
   * Moves an issue using its currently available workflow transition.
   * @param {string} issueKey Jira issue key.
   * @param {string} transitionNameOrId Target transition name or ID.
   */
  async transitionIssue(issueKey, transitionNameOrId) {
    const transitionId = await this.resolveTransitionId(issueKey, transitionNameOrId);
    await this.request(`/rest/api/3/issue/${encodeURIComponent(issueKey)}/transitions`, {
      method: 'POST',
      body: JSON.stringify({ transition: { id: transitionId } })
    });
  }

  /**
   * Adds a plain-text result comment using Atlassian Document Format.
   * @param {string} issueKey Jira issue key.
   * @param {string} message Sanitized CI result text.
   */
  async addComment(issueKey, message) {
    await this.request(`/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`, {
      method: 'POST',
      body: JSON.stringify({
        body: {
          type: 'doc',
          version: 1,
          content: [{ type: 'paragraph', content: [{ type: 'text', text: message }] }]
        }
      })
    });
  }

  /**
   * Comments on and transitions the issue after a CI test job.
   * @param {object} result CI result.
   * @param {string} result.issueKey Jira issue key.
   * @param {boolean} result.passed Whether the suite passed.
   * @param {string} result.passTransition Transition for success.
   * @param {string} result.failTransition Transition for failure.
   * @param {string} [result.buildUrl] Pipeline/job link.
   */
  async updateFromCi({ issueKey, passed, passTransition, failTransition, buildUrl }) {
    const outcome = passed ? 'PASSED' : 'FAILED';
    const safeBuildUrl = buildUrl || 'not provided';
    await this.addComment(issueKey, `Automated Cypress result: ${outcome}. Build: ${safeBuildUrl}`);
    await this.transitionIssue(issueKey, passed ? passTransition : failTransition);
  }
}

module.exports = { JiraCloudClient };
