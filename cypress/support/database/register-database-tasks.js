const { DatabaseService } = require('./database-service');

/**
 * Registers database tasks in Cypress's private Node process.
 * @param {Function} on Cypress event registration function.
 * @param {string} environment Active logical environment.
 * @param {DatabaseService} service Injectable service for tests.
 */
function registerDatabaseTasks(on, environment, service = new DatabaseService()) {
  on('task', {
    db2Query({ sql, params = [] }) {
      return service.query({ database: 'db2', environment, sql, params });
    },
    snowflakeQuery({ sql, binds = [] }) {
      return service.query({
        database: 'snowflake',
        environment,
        sql,
        params: binds
      });
    }
  });
}

module.exports = { registerDatabaseTasks };
