const { Then } = require('@badeball/cypress-cucumber-preprocessor');
const { DataRepository } = require('../../support/data/data-repository');
const { PageRegistry } = require('../../support/pages/page-registry');
const { OriginService } = require('../../support/services/origin-service');

/**
 * Opens a secondary origin and verifies exact text using only serialized URL,
 * selector, and expected-value strings. OriginService owns the cy.origin
 * boundary so cross-domain restrictions do not leak into feature steps.
 * @param {string} urlKey Dot-delimited data key containing the target URL.
 * @param {string} pageName Registered page object containing the locator.
 * @param {string} elementName Logical locator name on the page object.
 * @param {string} expectedDataKey Data key containing the expected text.
 */
Then(
  'on origin at data URL {string} page {string} element {string} should equal data {string}',
  (urlKey, pageName, elementName, expectedDataKey) => {
    const targetUrl = DataRepository.get(urlKey);
    const selector = PageRegistry.get(pageName).selector(elementName);
    const expected = DataRepository.get(expectedDataKey);

    OriginService.visitAndAssertText(targetUrl, selector, expected);
  }
);
