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
 * Resolves whether Db2 uses a developer-local or cloud-hosted connection.
 * @param {NodeJS.ProcessEnv} source Injectable environment map for tests.
 * @returns {'local'|'cloud'} Validated connection profile.
 */
function db2ConnectionProfile(source = process.env) {
  const profile = String(source.DB2_CONNECTION_PROFILE || 'local').toLowerCase();
  if (!['local', 'cloud'].includes(profile)) {
    throw new Error(
      `Unsupported DB2_CONNECTION_PROFILE '${source.DB2_CONNECTION_PROFILE}'. ` +
        "Expected 'local' or 'cloud'."
    );
  }
  return profile;
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
    const profile = db2ConnectionProfile(source);
    const profileVariable = `DB2_${prefix}_${profile.toUpperCase()}_CONNECTION_STRING`;
    const legacyVariable = `DB2_${prefix}_CONNECTION_STRING`;
    const connectionString = source[profileVariable] || source[legacyVariable];
    if (!connectionString) {
      throw new Error(
        `Required database variable '${profileVariable}' is not configured. ` +
          `The legacy fallback '${legacyVariable}' is also empty.`
      );
    }
    return { connectionString, profile };
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

module.exports = { db2ConnectionProfile, resolveDatabaseConfig };
