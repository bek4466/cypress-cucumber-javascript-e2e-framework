const test = require('node:test');
const assert = require('node:assert/strict');
const { Db2Client } = require('../../cypress/support/database/db2-client');
const { SnowflakeClient } = require('../../cypress/support/database/snowflake-client');
const { DatabaseService } = require('../../cypress/support/database/database-service');
const { assertQueryAllowed } = require('../../cypress/support/database/database-safety');
const { resolveDatabaseConfig } = require('../../cypress/support/database/database-config');

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

test('Db2 configuration selects local and cloud profiles without exposing both', () => {
  const source = {
    DB2_CONNECTION_PROFILE: 'cloud',
    DB2_DEV_LOCAL_CONNECTION_STRING: 'local-db2',
    DB2_DEV_CLOUD_CONNECTION_STRING: 'cloud-db2'
  };
  assert.deepEqual(resolveDatabaseConfig('db2', 'dev', source), {
    connectionString: 'cloud-db2',
    profile: 'cloud'
  });

  source.DB2_CONNECTION_PROFILE = 'local';
  assert.deepEqual(resolveDatabaseConfig('db2', 'dev', source), {
    connectionString: 'local-db2',
    profile: 'local'
  });
});

test('Db2 configuration rejects an unknown connection profile', () => {
  assert.throws(
    () =>
      resolveDatabaseConfig('db2', 'dev', {
        DB2_CONNECTION_PROFILE: 'shared'
      }),
    /Expected 'local' or 'cloud'/
  );
});
