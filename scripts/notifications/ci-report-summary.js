const fs = require('node:fs');

const FAILURE_STATUSES = new Set(['failed', 'ambiguous', 'undefined', 'unknown']);

/**
 * Loads a Cucumber JSON report without exposing embedded screenshots/videos.
 * @param {string} reportPath Absolute or repository-relative report path.
 * @returns {Array<object>} Parsed feature records.
 */
function loadCucumberReport(reportPath) {
  if (!fs.existsSync(reportPath)) return [];
  const parsed = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  if (!Array.isArray(parsed)) throw new Error('Cucumber JSON report must contain an array.');
  return parsed;
}

/**
 * Determines one scenario status using the most severe step/hook result.
 * @param {object} scenario Cucumber scenario/element.
 * @returns {string} Normalized status.
 */
function scenarioStatus(scenario) {
  const statuses = (scenario.steps || [])
    .map((step) => String(step.result?.status || 'unknown').toLowerCase());
  if (statuses.some((status) => FAILURE_STATUSES.has(status))) return 'failed';
  if (statuses.includes('pending')) return 'pending';
  if (statuses.includes('skipped')) return 'skipped';
  return statuses.length && statuses.every((status) => status === 'passed')
    ? 'passed'
    : 'unknown';
}

/**
 * Extracts the first failed step without copying report embeddings.
 * @param {object} scenario Cucumber scenario.
 * @returns {object|null} Sanitized failure detail.
 */
function failureDetail(scenario) {
  const step = (scenario.steps || []).find((item) =>
    FAILURE_STATUSES.has(String(item.result?.status || '').toLowerCase())
  );
  if (!step) return null;
  return {
    step: `${step.keyword || ''}${step.name || 'Hook'}`.trim(),
    message: String(step.result?.error_message || 'No error message was recorded.').slice(0, 2000)
  };
}

/**
 * Builds a small channel-neutral result from the potentially large Cucumber
 * report. CI metadata supplies stable artifact and pipeline links.
 * @param {object} input Summary input.
 * @param {Array<object>} input.report Parsed Cucumber features.
 * @param {NodeJS.ProcessEnv} [input.environmentVariables] CI/local variables.
 * @returns {object} Serializable report summary.
 */
function createCiReportSummary({ report, environmentVariables = process.env }) {
  const scenarios = [];
  let durationNanoseconds = 0;
  for (const feature of report) {
    for (const scenario of feature.elements || []) {
      if (!['Scenario', 'Scenario Outline'].includes(scenario.keyword)) continue;
      for (const step of scenario.steps || []) {
        durationNanoseconds += Number(step.result?.duration || 0);
      }
      const status = scenarioStatus(scenario);
      scenarios.push({
        feature: feature.name || feature.uri || 'Unnamed feature',
        scenario: scenario.name || 'Unnamed scenario',
        status,
        failure: status === 'failed' ? failureDetail(scenario) : null
      });
    }
  }

  const counts = {
    total: scenarios.length,
    passed: scenarios.filter((item) => item.status === 'passed').length,
    failed: scenarios.filter((item) => item.status === 'failed').length,
    skipped: scenarios.filter((item) => item.status === 'skipped').length,
    pending: scenarios.filter((item) => item.status === 'pending').length,
    unknown: scenarios.filter((item) => item.status === 'unknown').length
  };
  const ciStatus = String(environmentVariables.CI_JOB_STATUS || '').toLowerCase();
  const outcome = counts.failed > 0 || ['failed', 'canceled'].includes(ciStatus)
    ? 'FAILED'
    : counts.total > 0 && counts.passed === counts.total
      ? 'PASSED'
      : ciStatus === 'success'
        ? 'PASSED'
        : 'INCOMPLETE';
  const jobUrl = environmentVariables.CI_JOB_URL || '';

  return {
    generatedAt: new Date().toISOString(),
    outcome,
    counts,
    durationSeconds: Math.round(durationNanoseconds / 1_000_000_000),
    project: environmentVariables.CI_PROJECT_PATH || environmentVariables.npm_package_name || 'E2E Framework',
    environment: environmentVariables.CYPRESS_environment || 'dev',
    branch: environmentVariables.CI_COMMIT_REF_NAME || environmentVariables.GIT_BRANCH || 'local',
    commit: String(environmentVariables.CI_COMMIT_SHA || '').slice(0, 8),
    pipelineUrl: environmentVariables.CI_PIPELINE_URL || '',
    jobUrl,
    reportUrl: environmentVariables.CI_REPORT_URL || (jobUrl ? `${jobUrl}/artifacts/browse/reports/` : ''),
    reportAvailable: report.length > 0,
    failedScenarios: scenarios.filter((item) => item.status === 'failed').slice(0, 20)
  };
}

module.exports = { createCiReportSummary, loadCucumberReport, scenarioStatus };
