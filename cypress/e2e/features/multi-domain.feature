@smoke @regression @multi-domain
Feature: Multiple domains in one scenario
  As an SDET
  I want one scenario to interact with independent origins
  So that federated user journeys can be tested safely

  Scenario: Validate three independent domains during one test
    Given I open data URL "sites.exampleCom.url"
    Then element "heading" on page "example" should equal data "sites.exampleCom.heading"
    And on origin at data URL "sites.exampleOrg.url" page "example" element "heading" should equal data "sites.exampleOrg.heading"
    And on origin at data URL "sites.exampleNet.url" page "example" element "heading" should equal data "sites.exampleNet.heading"
