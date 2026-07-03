/**
 * Promise wrapper around the callback-based ibm_db driver. A new connection is
 * opened per task and closed in finally so parallel Cypress workers do not
 * share mutable connection state.
 */
class Db2Client {
  /**
   * @param {object} driver Imported ibm_db module or a compatible test double.
   * @param {string} connectionString Full IBM Db2 connection string.
   */
  constructor(driver, connectionString) {
    this.driver = driver;
    this.connectionString = connectionString;
  }

  /**
   * Executes one parameterized statement and always closes the connection.
   * @param {string} sql Single SQL statement.
   * @param {Array<*>} params Positional ibm_db bind values.
   * @returns {Promise<Array<object>|object>} Driver result.
   */
  async query(sql, params = []) {
    const connection = await new Promise((resolve, reject) => {
      this.driver.open(this.connectionString, (error, openedConnection) =>
        error ? reject(error) : resolve(openedConnection)
      );
    });

    try {
      return await new Promise((resolve, reject) => {
        connection.query(sql, params, (error, result) =>
          error ? reject(error) : resolve(result)
        );
      });
    } finally {
      await new Promise((resolve, reject) => {
        connection.close((error) => (error ? reject(error) : resolve()));
      });
    }
  }
}

module.exports = { Db2Client };
