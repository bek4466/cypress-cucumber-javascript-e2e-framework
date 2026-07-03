const { assertQueryAllowed } = require('./database-safety');
const { resolveDatabaseConfig } = require('./database-config');
const { Db2Client } = require('./db2-client');
const { SnowflakeClient } = require('./snowflake-client');

/**
 * Node-process database boundary used by Cypress tasks. Drivers are required
 * lazily, so ordinary UI/API suites do not initialize native DB dependencies.
 */
class DatabaseService {
  /**
   * @param {object} dependencies Injectable dependencies for mock verification.
   * @param {NodeJS.ProcessEnv} dependencies.environmentVariables Private variables.
   * @param {Function} dependencies.loadDb2Driver Lazy ibm_db loader.
   * @param {Function} dependencies.loadSnowflakeDriver Lazy Snowflake loader.
   */
  constructor({
    environmentVariables = process.env,
    loadDb2Driver = () => require('ibm_db'),
    loadSnowflakeDriver = () => require('snowflake-sdk')
  } = {}) {
    this.environmentVariables = environmentVariables;
    this.loadDb2Driver = loadDb2Driver;
    this.loadSnowflakeDriver = loadSnowflakeDriver;
  }

  /**
   * Executes a guarded query for one provider and environment.
   * @param {object} request Serialized Cypress task input.
   * @param {'db2'|'snowflake'} request.database Database provider.
   * @param {string} request.environment dev, staging, or prod.
   * @param {string} request.sql Single SQL statement.
   * @param {Array<*>} [request.params=[]] Parameter bind values.
   * @returns {Promise<Array<object>|object>} JSON-serializable result.
   */
  async query({ database, environment, sql, params = [] }) {
    const allowProductionMutations =
      this.environmentVariables.DATABASE_ALLOW_PROD_MUTATIONS === 'true';
    const guardedSql = assertQueryAllowed({
      sql,
      environment,
      allowProductionMutations
    });
    const config = resolveDatabaseConfig(
      database,
      environment,
      this.environmentVariables
    );

    if (database === 'db2') {
      return new Db2Client(this.loadDb2Driver(), config.connectionString).query(
        guardedSql,
        params
      );
    }
    if (database === 'snowflake') {
      return new SnowflakeClient(this.loadSnowflakeDriver(), config).query(
        guardedSql,
        params
      );
    }
    throw new Error(`Unsupported database provider '${database}'.`);
  }
}

module.exports = { DatabaseService };
