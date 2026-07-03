const test = require('node:test');
const assert = require('node:assert/strict');
const { Db2Client } = require('../../cypress/support/database/db2-client');
const { SnowflakeClient } = require('../../cypress/support/database/snowflake-client');
const { DatabaseService } = require('../../cypress/support/database/database-service');
const { assertQueryAllowed } = require('../../cypress/support/database/database-safety');

/**
 * These tests use driver-compatible mock databases. They verify binds,
 * results, connection cleanup, environment routing, and production safety
 * without requiring IBM Db2 or Snowflake credentials on a developer machine.
 */
test('Db2 client binds parameters, returns rows, and closes the connection', async () => {
  let closed = false;
  const driver = {
    open(connectionString, callback) {
      assert.equal(connectionString, 'db2-connection');
      callback(null, {
        query(sql, params, done) {
          assert.equal(sql, 'SELECT * FROM USERS WHERE ID = ?');
          assert.deepEqual(params, [7]);
          done(null, [{ ID: 7, NAME: 'Mock User' }]);
        },
        close(done) {
          closed = true;
          done(null);
        }
      });
    }
  };

  const rows = await new Db2Client(driver, 'db2-connection').query(
    'SELECT * FROM USERS WHERE ID = ?',
    [7]
  );
  assert.deepEqual(rows, [{ ID: 7, NAME: 'Mock User' }]);
  assert.equal(closed, true);
});

test('Snowflake client binds parameters, returns rows, and destroys the connection', async () => {
  let destroyed = false;
  const driver = {
    createConnection(options) {
      assert.equal(options.account, 'mock-account');
      return {
        connect(done) {
          done(null, this);
        },
        execute({ sqlText, binds, complete }) {
          assert.equal(sqlText, 'SELECT * FROM EVENTS WHERE EVENT_ID = ?');
          assert.deepEqual(binds, [42]);
          complete(null, {}, [{ EVENT_ID: 42 }]);
        },
        destroy(done) {
          destroyed = true;
          done(null);
        }
      };
    }
  };

  const rows = await new SnowflakeClient(driver, { account: 'mock-account' }).query(
    'SELECT * FROM EVENTS WHERE EVENT_ID = ?',
    [42]
  );
  assert.deepEqual(rows, [{ EVENT_ID: 42 }]);
  assert.equal(destroyed, true);
});

test('production allows reads but blocks writes and statement batches', () => {
  assert.equal(
    assertQueryAllowed({ sql: 'SELECT 1;', environment: 'prod' }),
    'SELECT 1;'
  );
  assert.throws(
    () => assertQueryAllowed({ sql: 'UPDATE USERS SET ACTIVE = 0', environment: 'prod' }),
    /Production mutation blocked/
  );
  assert.throws(
    () =>
      assertQueryAllowed({
        sql: 'WITH TARGET AS (SELECT 7 AS ID) DELETE FROM USERS WHERE ID IN (SELECT ID FROM TARGET)',
        environment: 'prod'
      }),
    /Production mutation blocked/
  );
  assert.throws(
    () => assertQueryAllowed({ sql: 'SELECT 1; DELETE FROM USERS', environment: 'dev' }),
    /Multiple SQL statements/
  );
});

test('database service routes an environment-specific mocked Db2 query', async () => {
  const environmentVariables = {
    DB2_STAGING_CONNECTION_STRING: 'staging-db2',
    DATABASE_ALLOW_PROD_MUTATIONS: 'false'
  };
  const driver = {
    open(connectionString, callback) {
      assert.equal(connectionString, 'staging-db2');
      callback(null, {
        query(_sql, _params, done) {
          done(null, [{ HEALTH: 1 }]);
        },
        close(done) {
          done(null);
        }
      });
    }
  };
  const service = new DatabaseService({
    environmentVariables,
    loadDb2Driver: () => driver
  });

  const rows = await service.query({
    database: 'db2',
    environment: 'staging',
    sql: 'SELECT 1 AS HEALTH'
  });
  assert.deepEqual(rows, [{ HEALTH: 1 }]);
});
