const {
  Before,
  When,
  Then
} = require('@badeball/cypress-cucumber-preprocessor');
const { DataRepository } = require('../../support/data/data-repository');
const { StepLogger } = require('../../support/core/step-logger');

let databaseRows;

/**
 * Clears module-scoped query results before each database scenario so a failed
 * query can never reuse rows from an earlier scenario.
 */
Before({ tags: '@database' }, () => {
  databaseRows = undefined;
});

/**
 * Runs the centrally configured, read-only IBM Db2 health query through the
 * private db2Query Cypress task. Connection details remain in Node/.env.
 */
When('I execute the configured IBM Db2 health query', () => {
  const sql = DataRepository.get('database.healthQueries.db2');
  StepLogger.action('Execute the IBM Db2 health query');
  cy.db2Query(sql).then((rows) => {
    databaseRows = rows;
  });
});

/**
 * Runs the centrally configured, read-only Snowflake health query through the
 * private snowflakeQuery Cypress task. Connection details remain in Node/.env.
 */
When('I execute the configured Snowflake health query', () => {
  const sql = DataRepository.get('database.healthQueries.snowflake');
  StepLogger.action('Execute the Snowflake health query');
  cy.snowflakeQuery(sql).then((rows) => {
    databaseRows = rows;
  });
});

/**
 * Verifies that a database returned one row with the expected HEALTH value.
 * IBM Db2 and Snowflake both normalize the unquoted alias to uppercase.
 */
Then('the database health result should equal the configured expected value', () => {
  const expected = DataRepository.get('database.expectedHealthValue');
  expect(databaseRows, 'database result rows').to.be.an('array').and.not.be.empty;
  expect(databaseRows[0].HEALTH, 'database HEALTH value').to.equal(expected);
  StepLogger.attachJson(
    { rowCount: databaseRows.length, expectedHealth: expected, actualHealth: databaseRows[0].HEALTH },
    'database-health-result.json'
  );
});
