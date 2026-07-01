# Notes:
# Verifies an asynchronous control transition using retryable state assertions.
# No fixed wait is used; the test proceeds as soon as the input becomes enabled.
@the-internet @regression @dynamic-controls
Feature: The Internet dynamic controls
  As an SDET
  I want state-based synchronization
  So that asynchronous controls can be tested without fixed delays

  Scenario: Enable and use the dynamic text input
    Given I open The Internet page "dynamicControls"
    When I enable The Internet dynamic text input
    And I enter data "dynamicInputText" after the dynamic input is enabled
    Then The Internet dynamic input should equal data "dynamicInputText"
    And The Internet dynamic message should equal data "enabledMessage"
