# Notes:
# Demonstrates row-level table validation without positional column assertions.
# Expected row identifiers and values remain in centralized test data.
@the-internet @regression @data-tables
Feature: The Internet sortable data tables
  As an SDET
  I want semantic row validation
  So that related values are confirmed within the same table record

  Scenario: Validate the Smith record and total row count
    Given I open The Internet page "tables"
    Then The Internet first table row data "smithLastName" should contain data "smithEmail"
    And The Internet first table row data "smithLastName" should contain data "smithBalance"
    And The Internet first table should have row count data "expectedRowCount"
