const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { JiraCloudClient } = require('../cypress/support/integrations/jira-cloud-client');
const { ZephyrScaleClient } = require('../cypress/support/integrations/zephyr-scale-client');
const { ZephyrStoryService } = require('../cypress/support/integrations/zephyr-story-service');

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

/**
 * Parses the script's intentionally small CLI surface without another package.
 * @param {string[]} values Arguments after node/script.
 * @returns {object} Named options and boolean switches.
 */
function parseArguments(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    const argument = values[index];
    if (!argument.startsWith('--')) throw new Error(`Unexpected argument '${argument}'.`);
    const name = argument.slice(2);
    if (['confirm', 'allow-existing'].includes(name)) {
      result[name] = true;
      continue;
    }
    const value = values[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Option '--${name}' requires a value.`);
    result[name] = value;
    index += 1;
  }
  return result;
}

/**
 * Reads optional JSON configuration with a useful variable-specific error.
 * @param {string|undefined} value JSON environment value.
 * @param {string} name Variable name.
 * @returns {object|undefined} Parsed object.
 */
function parseOptionalJson(value, name) {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new Error('value must be a JSON object');
    }
    return parsed;
  } catch (error) {
    throw new Error(`${name} must contain valid JSON: ${error.message}`);
  }
}

/**
 * Parses an optional positive-integer environment setting.
 * @param {string|undefined} value Raw environment value.
 * @param {string} name Variable name used in errors.
 * @param {number|undefined} fallback Value used when input is empty.
 * @returns {number|undefined} Validated integer.
 */
function optionalPositiveInteger(value, name, fallback) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}

/**
 * Returns optional caller text from a CLI string or UTF-8 file.
 * @param {object} argumentsMap Parsed CLI arguments.
 * @returns {string} Additional story description.
 */
function readDescription(argumentsMap) {
  if (argumentsMap.description && argumentsMap['description-file']) {
    throw new Error('Use either --description or --description-file, not both.');
  }
  if (argumentsMap['description-file']) {
    return fs.readFileSync(path.resolve(argumentsMap['description-file']), 'utf8');
  }
  return argumentsMap.description || '';
}

/** Runs preview or confirmed Zephyr Scale creation. */
async function main() {
  const argumentsMap = parseArguments(process.argv.slice(2));
  const issueIdOrKey = argumentsMap['jira-id'];
  if (!issueIdOrKey) {
    throw new Error(
      'Required input: --jira-id <Jira issue key or ID>. Add --description or --description-file when needed.'
    );
  }

  const jiraClient = new JiraCloudClient({
    baseUrl: process.env.JIRA_BASE_URL,
    email: process.env.JIRA_EMAIL,
    apiToken: process.env.JIRA_API_TOKEN
  });
  const commonOptions = {
    issueIdOrKey,
    description: readDescription(argumentsMap),
    projectKey: argumentsMap['project-key'] || process.env.ZEPHYR_PROJECT_KEY,
    maximumTestCases: optionalPositiveInteger(
      process.env.ZEPHYR_MAX_TEST_CASES,
      'ZEPHYR_MAX_TEST_CASES',
      20
    ),
    defaults: {
      folderId: optionalPositiveInteger(
        process.env.ZEPHYR_FOLDER_ID,
        'ZEPHYR_FOLDER_ID'
      ),
      priorityName: process.env.ZEPHYR_PRIORITY_NAME || undefined,
      statusName: process.env.ZEPHYR_STATUS_NAME || undefined,
      ownerId: process.env.ZEPHYR_OWNER_ACCOUNT_ID || undefined,
      labels: process.env.ZEPHYR_LABELS
        ? process.env.ZEPHYR_LABELS.split(',').map((label) => label.trim()).filter(Boolean)
        : undefined,
      customFields: parseOptionalJson(
        process.env.ZEPHYR_CUSTOM_FIELDS_JSON,
        'ZEPHYR_CUSTOM_FIELDS_JSON'
      )
    }
  };

  if (!argumentsMap.confirm) {
    const service = new ZephyrStoryService({ jiraClient });
    const preview = await service.preview(commonOptions);
    console.log(JSON.stringify({
      mode: 'preview',
      jiraIssue: preview.issue.key,
      generatedTestCases: preview.testCases
    }, null, 2));
    console.log('No Zephyr data was changed. Review the preview, then repeat with --confirm.');
    return;
  }

  if (process.env.ZEPHYR_ENABLED !== 'true') {
    throw new Error('Creation is blocked until ZEPHYR_ENABLED=true.');
  }
  const zephyrClient = new ZephyrScaleClient({
    apiToken: process.env.ZEPHYR_SCALE_API_TOKEN,
    baseUrl: process.env.ZEPHYR_SCALE_BASE_URL
  });
  const service = new ZephyrStoryService({ jiraClient, zephyrClient });
  const result = await service.create({
    ...commonOptions,
    allowExisting: Boolean(argumentsMap['allow-existing'])
  });
  console.log(
    `Created and linked ${result.created.length} Zephyr test case(s) for ${result.issueKey}: ` +
      result.created.map((item) => item.key).join(', ')
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  optionalPositiveInteger,
  parseArguments,
  parseOptionalJson,
  readDescription
};
