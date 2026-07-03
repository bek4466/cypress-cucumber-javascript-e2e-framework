const { getRequiredValue } = require('../utils/object-utils');

const SENSITIVE_KEY = /authorization|cookie|password|secret|token|api[-_]?key/i;

/**
 * Redacts sensitive query parameters while preserving the endpoint identity.
 * @param {string} value Absolute URL.
 * @returns {string} Sanitized URL.
 */
function sanitizeUrl(value) {
  const url = new URL(value);
  for (const key of url.searchParams.keys()) {
    if (SENSITIVE_KEY.test(key)) url.searchParams.set(key, '[redacted]');
  }
  return url.toString();
}

/**
 * Recursively redacts credentials before an API response is attached to a
 * report. Large values are truncated to keep artifacts usable.
 * @param {*} value Arbitrary request/response value.
 * @param {number} depth Current recursion depth.
 * @returns {*} Sanitized copy.
 */
function sanitize(value, depth = 0) {
  if (depth > 5) return '[depth limit]';
  if (typeof value === 'string') {
    return value.length > 2000 ? `${value.slice(0, 2000)}...[truncated]` : value;
  }
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitize(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        SENSITIVE_KEY.test(key) ? '[redacted]' : sanitize(item, depth + 1)
      ])
    );
  }
  return value;
}

/**
 * Compares a third-party API response with a scenario contract and produces a
 * report-ready diagnostic instead of a generic status-code failure.
 * @param {object} input Comparison input.
 * @param {string} input.name Human-readable API call name.
 * @param {string} input.method HTTP method.
 * @param {string} input.url Sanitized request URL.
 * @param {object} input.response Cypress-style response.
 * @param {object} input.contract Expected status, fields, headers, and duration.
 * @returns {{passed:boolean, summary:string, diagnostic:object}} Comparison result.
 */
function compareApiContract({ name, method, url, response, contract }) {
  const failures = [];
  const expectedStatuses = Array.isArray(contract.expectedStatus)
    ? contract.expectedStatus
    : [contract.expectedStatus ?? 200];
  if (!expectedStatuses.includes(response.status)) {
    failures.push(`status expected ${expectedStatuses.join(' or ')}, received ${response.status}`);
  }

  for (const propertyPath of contract.requiredBodyProperties || []) {
    try {
      getRequiredValue(response.body, propertyPath);
    } catch {
      failures.push(`missing response property '${propertyPath}'`);
    }
  }

  for (const [propertyPath, expected] of Object.entries(contract.expectedBodyProperties || {})) {
    let actual;
    try {
      actual = getRequiredValue(response.body, propertyPath);
    } catch {
      failures.push(`missing response property '${propertyPath}'`);
      continue;
    }
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      failures.push(
        `property '${propertyPath}' expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`
      );
    }
  }

  const headers = Object.fromEntries(
    Object.entries(response.headers || {}).map(([key, value]) => [key.toLowerCase(), value])
  );
  for (const [nameKey, expected] of Object.entries(contract.expectedHeaders || {})) {
    const actual = headers[nameKey.toLowerCase()];
    if (!String(actual ?? '').includes(String(expected))) {
      failures.push(`header '${nameKey}' expected to contain '${expected}', received '${actual}'`);
    }
  }

  if (contract.maximumDurationMs && response.duration > contract.maximumDurationMs) {
    failures.push(
      `duration expected below ${contract.maximumDurationMs}ms, received ${response.duration}ms`
    );
  }

  const correlationHeaders = ['x-request-id', 'x-correlation-id', 'traceparent'];
  const correlation = Object.fromEntries(
    correlationHeaders.filter((key) => headers[key]).map((key) => [key, headers[key]])
  );
  const diagnostic = sanitize({
    call: { name, method: method.toUpperCase(), url: sanitizeUrl(url) },
    expected: contract,
    actual: {
      status: response.status,
      durationMs: response.duration,
      correlation,
      body: response.body
    },
    failures
  });

  return {
    passed: failures.length === 0,
    summary: failures.length
      ? `${name} contract failed: ${failures.join('; ')}`
      : `${name} contract passed`,
    diagnostic
  };
}

module.exports = { compareApiContract, sanitize, sanitizeUrl };
