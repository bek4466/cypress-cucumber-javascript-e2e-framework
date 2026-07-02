# Notes:
# This scenario fails by design so engineers can inspect failure screenshots,
# videos, retries, Cucumber attachments, and Allure evidence.
# It is excluded from normal runs and executes only with @artifact-failure.
@artifact-failure
Feature: Reporting artifact failure demonstration
  As an SDET
  I want one controlled failing scenario
  So that the framework's diagnostic artifacts can be verified

  Scenario: Capture evidence for an intentional assertion failure
    Given I open The Internet page "login"
    Then I intentionally fail The Internet artifact validation
