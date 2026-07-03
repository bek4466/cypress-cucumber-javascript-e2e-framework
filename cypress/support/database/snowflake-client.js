/**
 * Promise wrapper around Snowflake's Node.js driver. Connections are isolated
 * per Cypress task and destroyed after each statement.
 */
class SnowflakeClient {
  /**
   * @param {object} driver Imported snowflake-sdk module or a test double.
   * @param {object} connectionOptions Snowflake createConnection options.
   */
  constructor(driver, connectionOptions) {
    this.driver = driver;
    this.connectionOptions = connectionOptions;
  }

  /**
   * Executes one statement with positional binds.
   * @param {string} sql Single SQL statement.
   * @param {Array<*>} binds Values for ? placeholders.
   * @returns {Promise<Array<object>>} Returned rows.
   */
  async query(sql, binds = []) {
    const connection = this.driver.createConnection(this.connectionOptions);
    await new Promise((resolve, reject) => {
      connection.connect((error) => (error ? reject(error) : resolve()));
    });

    try {
      return await new Promise((resolve, reject) => {
        connection.execute({
          sqlText: sql,
          binds,
          complete(error, _statement, rows) {
            if (error) reject(error);
            else resolve(rows);
          }
        });
      });
    } finally {
      await new Promise((resolve, reject) => {
        connection.destroy((error) => (error ? reject(error) : resolve()));
      });
    }
  }
}

module.exports = { SnowflakeClient };
