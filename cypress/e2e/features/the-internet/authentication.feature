# Notes:
# Validates the public demo credentials and a negative login path.
# Production credentials must come from .env rather than committed feature data.
@the-internet @authentication
Feature: The Internet form authentication
  As an SDET
  I want reusable authentication coverage
  So that successful and rejected logins are validated consistently

  @smoke
  Scenario: Log in with the published valid demo account
    Given I open The Internet page "login"
    When I log in to The Internet using "validUsername" and "validPassword"
    Then The Internet "secureArea" message should contain login data "successMessage"
    And The Internet secure heading should equal login data "secureHeading"

  @regression
  Scenario: Reject an invalid username
    Given I open The Internet page "login"
    When I log in to The Internet using "invalidUsername" and "invalidPassword"
    Then The Internet "login" message should contain login data "invalidUsernameMessage"
