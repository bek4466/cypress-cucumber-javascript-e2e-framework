const {
  UserStoryTestCaseGenerator
} = require('./user-story-test-case-generator');

/**
 * Coordinates Jira story reading, deterministic case generation, duplicate
 * protection, Zephyr creation, step replacement, and Jira coverage links.
 */
class ZephyrStoryService {
  /**
   * @param {object} dependencies Service dependencies.
   * @param {import('./jira-cloud-client').JiraCloudClient} dependencies.jiraClient Jira reader.
   * @param {import('./zephyr-scale-client').ZephyrScaleClient} [dependencies.zephyrClient] Zephyr writer.
   */
  constructor({ jiraClient, zephyrClient }) {
    this.jiraClient = jiraClient;
    this.zephyrClient = zephyrClient;
  }

  /**
   * Reads one Jira story and builds a preview without writing to Zephyr.
   * @param {object} options Generation options.
   * @returns {Promise<{issue:object,testCases:Array<object>}>} Story and cases.
   */
  async preview({ issueIdOrKey, description, projectKey, defaults, maximumTestCases = 20 }) {
    const issue = await this.jiraClient.getIssue(issueIdOrKey);
    const resolvedProjectKey = projectKey || issue.fields?.project?.key;
    if (!resolvedProjectKey) {
      throw new Error('A Zephyr project key is required and Jira did not return one.');
    }
    const testCases = UserStoryTestCaseGenerator.generate({
      issue,
      additionalDescription: description,
      projectKey: resolvedProjectKey,
      defaults
    });
    if (testCases.length > maximumTestCases) {
      throw new Error(
        `Generation produced ${testCases.length} cases, above the configured limit ` +
          `${maximumTestCases}. Refine the story or increase ZEPHYR_MAX_TEST_CASES deliberately.`
      );
    }
    return { issue, testCases };
  }

  /**
   * Creates previewed cases sequentially and links them to the Jira story.
   * Existing links stop the operation unless explicitly allowed.
   * @param {object} options Preview/create options.
   * @param {boolean} [options.allowExisting=false] Permit adding to existing coverage.
   * @returns {Promise<{issueKey:string,created:Array<object>}>} Created cases.
   */
  async create(options) {
    if (!this.zephyrClient) throw new Error('A Zephyr Scale client is required for creation.');
    const { issue, testCases } = await this.preview(options);
    const numericIssueId = Number(issue.id);
    if (!Number.isInteger(numericIssueId) || numericIssueId < 1) {
      throw new Error(`Jira returned an invalid numeric issue ID '${issue.id}'.`);
    }
    const existing = (await this.zephyrClient.getLinkedTestCases(issue.key)) || [];
    if (existing.length && !options.allowExisting) {
      throw new Error(
        `Jira issue ${issue.key} already has linked Zephyr cases: ` +
          `${existing.map((item) => item.key).join(', ')}. ` +
          'Use --allow-existing only after reviewing duplicate coverage.'
      );
    }

    const created = [];
    for (const testCase of testCases) {
      created.push(
        await this.zephyrClient.createLinkedTestCase(testCase, numericIssueId)
      );
    }
    return { issueKey: issue.key, created };
  }
}

module.exports = { ZephyrStoryService };
