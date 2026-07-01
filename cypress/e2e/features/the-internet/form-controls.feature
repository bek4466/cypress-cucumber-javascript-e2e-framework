# Notes:
# Exercises the shared checkbox and dropdown actions against native form controls.
# Checkbox positions are isolated in the page object because the demo has no IDs.
@the-internet @form-controls
Feature: The Internet form controls
  As an SDET
  I want reusable control interactions
  So that selections can be changed and verified by logical locator names

  @smoke
  Scenario: Change both checkbox states
    Given I open The Internet page "checkboxes"
    When I select the "first" checkbox on The Internet
    And I unselect the "second" checkbox on The Internet
    Then the "first" checkbox should be selected
    And the "second" checkbox should be unselected

  @regression
  Scenario: Select a dropdown option from centralized data
    Given I open The Internet page "dropdown"
    When I choose The Internet dropdown data "dropdownOptionText"
    Then The Internet dropdown value should equal data "dropdownOptionValue"
