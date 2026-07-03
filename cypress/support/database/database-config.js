/**
 * Reads a required operating-system variable without exposing it through
 * Cypress browser configuration.
 * @param {string} name Environment variable name.
 * @param {NodeJS.ProcessEnv} source Injectable environment map for tests.
 * @returns {string} Configured value.
 */
function requiredVariable(name, source = process.env) {
  const value = source[name];
  if (!value) throw new Error(`Required database variable '${name}' is not configured.`);
  return value;
}

/**
 * Converts a logical environment to the variable prefix used in .env.
 * @param {string} environment dev, staging, or prod.
 * @returns {string} Uppercase prefix.
 */
function environmentPrefix(environment) {
  const normalized = String(environment || '').toLowerCase();
  if (!['dev', 'staging', 'prod'].includes(normalized)) {
    throw new Error(`Unsupported database environment '${environment}'.`);
  }
  return normalized.toUpperCase();
}

/**
 * Builds private driver configuration for the active environment.
 * @param {'db2'|'snowflake'} database Database provider.
 * @param {string} environment Logical environment.
 * @param {NodeJS.ProcessEnv} source Injectable environment map for tests.
 * @returns {object} Driver-specific connection configuration.
 */
function resolveDatabaseConfig(database, environment, source = process.env) {
  const prefix = environmentPrefix(environment);
  if (database === 'db2') {
    return { connectionString: requiredVariable(`DB2_${prefix}_CONNECTION_STRING`, source) };
  }
  if (database === 'snowflake') {
    const variable = (suffix) => requiredVariable(`SNOWFLAKE_${prefix}_${suffix}`, source);
    return {
      account: variable('ACCOUNT'),
      username: variable('USERNAME'),
      password: variable('PASSWORD'),
      warehouse: variable('WAREHOUSE'),
      database: variable('DATABASE'),
      schema: variable('SCHEMA'),
      role: variable('ROLE')
    };
  }
  throw new Error(`Unsupported database provider '${database}'.`);
}

module.exports = { resolveDatabaseConfig };
