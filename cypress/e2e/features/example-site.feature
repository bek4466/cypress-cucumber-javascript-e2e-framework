@smoke @regression
Feature: Centralized page objects and test data
  As an SDET
  I want selectors and expected values resolved by logical names
  So that UI changes require updates in one location

  Scenario: Validate the example domain using centralized values
    Given I open data URL "sites.exampleCom.url"
    Then element "heading" on page "example" should equal data "sites.exampleCom.heading"
    And element "description" on page "example" should contain data "sites.exampleCom.description"
    And element "moreInformationLink" on page "example" should be visible
