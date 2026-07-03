/**
 * Converts Jira Atlassian Document Format (ADF) into readable plain text while
 * retaining paragraph/list boundaries used for acceptance-criteria parsing.
 * @param {*} node ADF node, array, string, or null.
 * @returns {string} Plain-text representation.
 */
function adfToPlainText(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(adfToPlainText).join('');

  const content = adfToPlainText(node.content || []);
  if (node.type === 'hardBreak') return '\n';
  if (node.type === 'text') return node.text || '';
  if (node.type === 'listItem') return `- ${content.trim()}\n`;
  if (['paragraph', 'heading', 'blockquote', 'codeBlock'].includes(node.type)) {
    return `${content.trim()}\n`;
  }
  return content;
}

/**
 * Produces a short Zephyr-safe entity name.
 * @param {string} value Desired test case name.
 * @returns {string} Name limited to Zephyr's 255-character maximum.
 */
function entityName(value) {
  const normalized = String(value).replace(/\s+/g, ' ').trim();
  return normalized.length <= 255 ? normalized : `${normalized.slice(0, 252)}...`;
}

/**
 * Parses Gherkin-like Scenario/Given/When/Then blocks from story text.
 * @param {string} text Combined Jira and caller-supplied description.
 * @returns {Array<{name:string,lines:string[]}>} Parsed scenarios.
 */
function parseGherkinScenarios(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const scenarios = [];
  let current;
  for (const line of lines) {
    const header = line.match(/^scenario(?: outline)?:\s*(.+)$/i);
    if (header) {
      current = { name: header[1], lines: [] };
      scenarios.push(current);
      continue;
    }
    if (current && /^(given|when|then|and|but)\s+/i.test(line)) current.lines.push(line);
  }

  if (scenarios.length === 0 && lines.some((line) => /^given\s+/i.test(line))) {
    const steps = lines.filter((line) => /^(given|when|then|and|but)\s+/i.test(line));
    if (steps.length) scenarios.push({ name: 'Acceptance criteria', lines: steps });
  }
  return scenarios.filter((scenario) => scenario.lines.length > 0);
}

/**
 * Converts Gherkin lines into Zephyr inline steps without inventing business
 * values that are absent from the user story.
 * @param {string[]} lines Given/When/Then lines.
 * @returns {Array<{description:string,testData:string,expectedResult:string}>} Steps.
 */
function gherkinToSteps(lines) {
  let phase = 'given';
  return lines.map((line) => {
    const match = line.match(/^(given|when|then|and|but)\s+(.+)$/i);
    const keyword = match[1].toLowerCase();
    const statement = match[2];
    if (keyword !== 'and' && keyword !== 'but') phase = keyword;

    if (phase === 'then') {
      return {
        description: `Verify: ${statement}`,
        testData: '',
        expectedResult: statement
      };
    }
    return {
      description: phase === 'given' ? `Establish: ${statement}` : statement,
      testData: '',
      expectedResult: phase === 'given' ? 'Precondition is established.' : 'Action completes.'
    };
  });
}

/**
 * Extracts bullet/numbered acceptance criteria when no Gherkin exists.
 * @param {string} text Story description.
 * @returns {string[]} Candidate acceptance criteria.
 */
function extractCriteria(text) {
  const ignored = /^(acceptance criteria|description|as an?\b|i want\b|so that\b)/i;
  const criteria = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^([-*•]|\d+[.)])\s+/.test(line))
    .map((line) => line.replace(/^([-*•]|\d+[.)])\s+/, '').trim())
    .filter((line) => line && !ignored.test(line));
  return [...new Set(criteria)];
}

/**
 * Deterministically generates Zephyr cases from explicit Jira story content.
 * This generator does not call an LLM or invent application behavior. Gherkin
 * scenarios are preferred; otherwise each acceptance-criteria bullet becomes
 * a case, with one traceability case as the final fallback.
 */
class UserStoryTestCaseGenerator {
  /**
   * @param {object} input Generation input.
   * @param {object} input.issue Jira REST issue.
   * @param {string} [input.additionalDescription] Caller-provided story detail.
   * @param {string} input.projectKey Zephyr/Jira project key.
   * @param {object} [input.defaults] Optional Zephyr field defaults.
   * @returns {Array<object>} Zephyr case payloads including inline steps.
   */
  static generate({ issue, additionalDescription = '', projectKey, defaults = {} }) {
    const summary = issue.fields?.summary || `Story ${issue.key}`;
    const jiraDescription = adfToPlainText(issue.fields?.description).trim();
    const combined = [jiraDescription, additionalDescription.trim()].filter(Boolean).join('\n\n');
    if (!combined) {
      throw new Error(
        `Jira issue ${issue.key} has no description and no --description input was supplied.`
      );
    }

    const base = {
      projectKey,
      objective: `Cover Jira story ${issue.key}: ${summary}\n\n${combined}`,
      precondition: defaults.precondition || `The test environment and data for ${issue.key} are available.`,
      priorityName: defaults.priorityName,
      statusName: defaults.statusName,
      folderId: defaults.folderId,
      ownerId: defaults.ownerId,
      labels: [...new Set(['generated-from-jira', issue.key, ...(issue.fields?.labels || []), ...(defaults.labels || [])])].slice(0, 50),
      customFields: defaults.customFields
    };
    const withoutEmptyFields = (value) =>
      Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
    const scenarios = parseGherkinScenarios(combined);
    if (scenarios.length) {
      return scenarios.map((scenario) =>
        withoutEmptyFields({
          ...base,
          name: entityName(`[${issue.key}] ${scenario.name}`),
          steps: gherkinToSteps(scenario.lines)
        })
      );
    }

    const criteria = extractCriteria(combined);
    if (criteria.length) {
      return criteria.map((criterion, index) =>
        withoutEmptyFields({
          ...base,
          name: entityName(`[${issue.key}] AC${index + 1}: ${criterion}`),
          steps: [
            {
              description: `Validate acceptance criterion: ${criterion}`,
              testData: 'Use approved data for the Jira story.',
              expectedResult: criterion
            }
          ]
        })
      );
    }

    return [
      withoutEmptyFields({
        ...base,
        name: entityName(`[${issue.key}] Validate ${summary}`),
        steps: [
          {
            description: `Execute the behavior described by Jira story ${issue.key}.`,
            testData: combined,
            expectedResult: `The outcome described by '${summary}' is satisfied.`
          }
        ]
      })
    ];
  }
}

module.exports = {
  UserStoryTestCaseGenerator,
  adfToPlainText,
  extractCriteria,
  parseGherkinScenarios
};
