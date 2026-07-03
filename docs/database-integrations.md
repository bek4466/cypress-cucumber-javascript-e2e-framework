# IBM Db2 and Snowflake Integration

## Purpose and boundary

Database checks support setup, focused validation, and cleanup when no safer service interface exists. Drivers and credentials remain in Cypress's Node process. Browser code receives only serialized query results.

Use API-based setup/validation when possible. Never use shared production customer data as automation data. Database utilities do not replace database permissions, audit controls, backups, or change approval.

## Components

| File | Responsibility |
| --- | --- |
| `database-config.js` | Resolves private dev/staging/prod variables. |
| `database-safety.js` | Rejects batches and blocks production mutations by default. |
| `db2-client.js` | Opens, queries, and closes `ibm_db` connections. |
| `snowflake-client.js` | Connects, executes, and destroys Snowflake connections. |
| `database-service.js` | Loads drivers lazily and routes providers. |
| `register-database-tasks.js` | Registers `db2Query` and `snowflakeQuery` Node tasks. |
| `commands.js` | Exposes `cy.db2Query` and `cy.snowflakeQuery`. |
| `test/database/database.test.js` | Proves bind/result/cleanup/safety behavior with mock drivers. |
| `cypress/e2e/features/database/database-connections.feature` | Live, explicitly tagged Db2 and Snowflake connection examples. |
| `cypress/e2e/step-definitions/database.steps.js` | Cucumber-to-database task integration and health assertion. |
| `cypress/test-data/database/health-checks.json` | Central read-only health queries and expected value. |

## Configure environments

Copy `.env.example` to ignored `.env`. Configure only the environments used locally. CI values belong in protected/masked variables.

Db2 has two endpoint profiles selected by `DB2_CONNECTION_PROFILE=local|cloud`. The resolved variable format is `DB2_<ENVIRONMENT>_<PROFILE>_CONNECTION_STRING`.

Local/developer connection format:

```text
DB2_CONNECTION_PROFILE=local
DB2_DEV_LOCAL_CONNECTION_STRING=DATABASE=SAMPLE;HOSTNAME=localhost;PORT=50000;PROTOCOL=TCPIP;UID=test_user;PWD=secret;
```

IBM Db2 on Cloud connection format:

```text
DB2_CONNECTION_PROFILE=cloud
DB2_DEV_CLOUD_CONNECTION_STRING=DATABASE=BLUDB;HOSTNAME=<service-hostname>;PORT=<service-port>;PROTOCOL=TCPIP;UID=<service-user>;PWD=<service-password>;SECURITY=SSL;
```

Use the hostname, port, database, user ID, and password supplied in IBM Cloud service credentials. IBM Db2 on Cloud uses SSL connections, so retain `SECURITY=SSL` and apply any certificate properties required by your organization. Configure the same local/cloud pair for staging or prod by replacing `DEV` in the variable name. The older `DB2_<ENVIRONMENT>_CONNECTION_STRING` remains a compatibility fallback but should not be used for new setup.

Snowflake uses seven variables per environment:

```text
SNOWFLAKE_DEV_ACCOUNT
SNOWFLAKE_DEV_USERNAME
SNOWFLAKE_DEV_PASSWORD
SNOWFLAKE_DEV_WAREHOUSE
SNOWFLAKE_DEV_DATABASE
SNOWFLAKE_DEV_SCHEMA
SNOWFLAKE_DEV_ROLE
```

Replace `DEV` with `STAGING` or `PROD`. Prefer key-pair or OAuth authentication when organizational standards require it; extend `database-config.js` in one place rather than embedding auth in tests.

Select the environment with:

```powershell
npx cypress run --env environment=staging,tags="@database"
```

The normal suites exclude `@requires-external-services`. After configuring the selected environment, run one live provider explicitly:

```powershell
$env:CYPRESS_environment = "dev"
npm run test:database:db2

$env:CYPRESS_environment = "staging"
npm run test:database:snowflake
```

Each scenario opens the provider connection, runs its centralized read-only health query, attaches the row-count/expected/actual result, and closes the connection. A missing variable, network failure, authentication error, permission error, SQL error, or unexpected value fails the scenario.

### Local execution versus cloud execution

The connection profile chooses the Db2 endpoint; the test command chooses where Cypress results are recorded.

Local PowerShell against developer Db2:

```powershell
$env:CYPRESS_environment = "dev"
$env:DB2_CONNECTION_PROFILE = "local"
npm run test:database:db2
```

Local PowerShell against IBM Db2 on Cloud:

```powershell
$env:CYPRESS_environment = "dev"
$env:DB2_CONNECTION_PROFILE = "cloud"
npm run test:database:db2
```

Recorded in Cypress Cloud against IBM Db2 on Cloud:

```powershell
$env:CYPRESS_environment = "dev"
$env:DB2_CONNECTION_PROFILE = "cloud"
$env:CYPRESS_PROJECT_ID = "configured-project-id"
$env:CYPRESS_RECORD_KEY = "configured-record-key"
npm run test:database:db2:record
```

For GitLab, store `DB2_CONNECTION_PROFILE=cloud`, `CYPRESS_environment=dev`, and `DB2_DEV_CLOUD_CONNECTION_STRING` as protected CI/CD variables. Never write the connection string into `.gitlab-ci.yml` or job output. The runner also needs DNS/firewall access to the IBM Cloud hostname and port.

## Query from Cypress

Db2 positional binds:

```javascript
cy.db2Query(
  'SELECT ACCOUNT_ID, STATUS FROM ACCOUNTS WHERE ACCOUNT_ID = ?',
  [accountId]
).then((rows) => {
  expect(rows).to.have.length(1);
  expect(rows[0].STATUS).to.equal('ACTIVE');
});
```

Snowflake positional binds:

```javascript
cy.snowflakeQuery(
  'SELECT EVENT_ID, EVENT_TYPE FROM AUDIT_EVENTS WHERE EVENT_ID = ?',
  [eventId]
).then((rows) => {
  expect(rows[0].EVENT_TYPE).to.equal('ACCOUNT_CREATED');
});
```

Non-production setup and cleanup:

```javascript
cy.db2Query(
  'INSERT INTO TEST_ACCOUNTS (ACCOUNT_ID, STATUS) VALUES (?, ?)',
  [accountId, 'ACTIVE']
);

// Register cleanup even when a later assertion may fail.
afterEach(() => {
  cy.db2Query('DELETE FROM TEST_ACCOUNTS WHERE ACCOUNT_ID = ?', [accountId]);
});
```

Do not interpolate values into SQL. Binds reduce injection risk and preserve driver type handling.

## Production safety

When `environment=prod`, the guard accepts statements beginning with `SELECT`, `WITH`, `SHOW`, `DESCRIBE`, `DESC`, or `EXPLAIN`. It rejects INSERT, UPDATE, DELETE, MERGE, DDL, calls, grants, and other commands. It also rejects multiple semicolon-separated statements in every environment.

`DATABASE_ALLOW_PROD_MUTATIONS=true` is a break-glass override. If governance ever permits it, use a separately approved pipeline, protected variable, dedicated account, audit trail, and narrow SQL. The safest production account is read-only; application-side classification alone is not a security boundary.

## Mock verification

Run:

```powershell
npm run test:unit
```

The tests inject driver-compatible in-memory mocks. They verify:

- Db2 SQL/parameters, returned rows, and connection close;
- Snowflake SQL/binds, returned rows, and connection destroy;
- dev/staging/prod configuration routing;
- production read acceptance and mutation rejection;
- statement-batch rejection.

Mocks prove the framework contract, not network reachability or credentials. Add a separately tagged, access-controlled integration smoke test for each real database when endpoints become available.

## Installation and troubleshooting

`ibm_db` 4 uses N-API and supports Windows x64 precompiled binaries. Its installation also obtains an IBM CLI driver unless `IBM_DB_HOME` points to an approved existing client. On Windows, source compilation requires Visual Studio 2022 Build Tools and Python 3.8+. A Db2 Connect license may be required depending on the target and selected CLI driver version.

Snowflake's driver is pure Node.js. For connection failures, check account identifier, role grants, warehouse/database/schema access, proxy/TLS policy, and whether the configured user is permitted from the runner network.

Both clients close connections in `finally`. An execution error followed by a close error may surface the close failure; inspect database/server logs using the original query time and correlation data.

## Extending authentication or providers

Add fields only in `database-config.js`, preserve lazy driver loading in `database-service.js`, implement one client with `query(sql, params)` semantics, register a Node task, add a thin Cypress command, and prove the adapter with a mock. Do not return driver connection/statement objects through `cy.task`; they are not serializable.

## Vendor references

- [IBM node-ibm_db repository and installation guidance](https://github.com/ibmdb/node-ibm_db)
- [Snowflake Node.js driver connection options](https://docs.snowflake.com/en/developer-guide/node-js/nodejs-driver-connect)
- [Snowflake statement execution and binds](https://docs.snowflake.com/en/developer-guide/node-js/nodejs-driver-execute)
