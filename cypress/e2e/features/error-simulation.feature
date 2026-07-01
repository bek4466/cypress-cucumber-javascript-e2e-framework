@error-simulation
Feature: Refresh-triggered error simulation
  As an SDET
  I want to register a named error before refreshing
  So that error states requiring reload can be tested predictably

  Scenario: Display a service unavailable response after refresh
    Given I open data URL "sites.exampleCom.url"
    When I enable error simulation "serviceUnavailable" and refresh
    Then element "body" on page "example" should contain data "errors.serviceUnavailable.expectedMessage"
