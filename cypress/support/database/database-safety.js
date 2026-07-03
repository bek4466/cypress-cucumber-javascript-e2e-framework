/**
 * Removes SQL comments before safety classification. This is not a SQL parser;
 * it is a conservative guardrail that complements database-side permissions.
 * @param {string} sql SQL statement supplied by a test.
 * @returns {string} Normalized statement without comments.
 */
function normalizeSql(sql) {
  if (typeof sql !== 'string' || !sql.trim()) {
    throw new Error('Database query must be a non-empty SQL string.');
  }

  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--.*$/gm, ' ')
    .trim();
}

/**
 * Rejects statement batches because they can hide an unsafe second command.
 * One optional trailing semicolon is accepted.
 * @param {string} sql Normalized SQL statement.
 */
function assertSingleStatement(sql) {
  const withoutTrailingSemicolon = sql.replace(/;\s*$/, '');
  if (withoutTrailingSemicolon.includes(';')) {
    throw new Error('Multiple SQL statements are not allowed in one Cypress task.');
  }
}

/**
 * Applies the framework production write policy before a driver is loaded.
 * Production accepts read-oriented statements unless the explicit mutation
 * switch is enabled. Database accounts must still enforce least privilege.
 * @param {object} input Safety inputs.
 * @param {string} input.sql SQL statement to classify.
 * @param {string} input.environment Active environment name.
 * @param {boolean} input.allowProductionMutations Explicit production override.
 * @returns {string} Normalized SQL passed to the database client.
 */
function assertQueryAllowed({ sql, environment, allowProductionMutations = false }) {
  const normalized = normalizeSql(sql);
  assertSingleStatement(normalized);

  if (String(environment).toLowerCase() !== 'prod' || allowProductionMutations) {
    return normalized;
  }

  const firstKeyword = normalized.match(/^([a-z]+)/i)?.[1]?.toUpperCase();
  const readOnlyKeywords = new Set(['SELECT', 'WITH', 'SHOW', 'DESCRIBE', 'DESC', 'EXPLAIN']);
  const mutationKeyword = normalized.match(
    /\b(INSERT|UPDATE|DELETE|MERGE|CREATE|ALTER|DROP|TRUNCATE|CALL|EXECUTE|GRANT|REVOKE|COPY|PUT|REMOVE|UNDROP)\b/i
  )?.[1];
  if (!readOnlyKeywords.has(firstKeyword) || mutationKeyword) {
    throw new Error(
      `Production mutation blocked: '${mutationKeyword?.toUpperCase() || firstKeyword || 'UNKNOWN'}'. ` +
        'Use a read-only query or explicitly set DATABASE_ALLOW_PROD_MUTATIONS=true.'
    );
  }

  return normalized;
}

module.exports = { assertQueryAllowed, normalizeSql };
