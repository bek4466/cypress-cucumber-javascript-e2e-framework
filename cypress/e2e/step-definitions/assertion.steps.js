const { Then } = require('@badeball/cypress-cucumber-preprocessor');
const { PageRegistry } = require('../../support/pages/page-registry');
const { DataRepository } = require('../../support/data/data-repository');
const { AssertionActions } = require('../../support/actions/assertion-actions');

/**
 * Verifies normalized exact element text using an expected value from test data.
 * @param {string} elementName Logical locator name stored on the page object.
 * @param {string} pageName Page/component name registered in PageRegistry.
 * @param {string} dataKey Dot-delimited key containing the expected value.
 */
Then(
  'element {string} on page {string} should equal data {string}',
  (elementName, pageName, dataKey) => {
    AssertionActions.shouldHaveText(
      PageRegistry.get(pageName),
      elementName,
      DataRepository.get(dataKey)
    );
  }
);

/**
 * Verifies an element contains a value resolved from centralized test data.
 * @param {string} elementName Logical locator name stored on the page object.
 * @param {string} pageName Page/component name registered in PageRegistry.
 * @param {string} dataKey Dot-delimited key containing the expected text.
 */
Then(
  'element {string} on page {string} should contain data {string}',
  (elementName, pageName, dataKey) => {
    AssertionActions.shouldContainText(
      PageRegistry.get(pageName),
      elementName,
      DataRepository.get(dataKey)
    );
  }
);

/**
 * Verifies that a page-object element is rendered and visible to the user.
 * @param {string} element Logical locator name stored on the page object.
 * @param {string} page Page/component name registered in PageRegistry.
 */
Then('element {string} on page {string} should be visible', (element, page) => {
  AssertionActions.shouldBeVisible(PageRegistry.get(page), element);
});
