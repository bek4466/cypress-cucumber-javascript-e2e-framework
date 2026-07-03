# Notes:
# These scenarios verify real IBM Db2 and Snowflake connectivity and a minimal
# read-only query. They require environment-specific secrets from .env or CI.
# The @requires-external-services tag keeps them out of every normal test run.
@database @requires-external-services
Feature: Enterprise database connectivity
  As an SDET
  I want to verify database connectivity through Cypress Node tasks
  So that test setup and backend validation can fail with a clear provider error

  @db2
  Scenario: Connect to IBM Db2 and execute a health query
    When I execute the configured IBM Db2 health query
    Then the database health result should equal the configured expected value

  @snowflake
  Scenario: Connect to Snowflake and execute a health query
    When I execute the configured Snowflake health query
    Then the database health result should equal the configured expected value
