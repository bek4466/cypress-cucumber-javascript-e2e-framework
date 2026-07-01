const { Then } = require('@badeball/cypress-cucumber-preprocessor');
const { PageRegistry } = require('../../support/pages/page-registry');
const { DataRepository } = require('../../support/data/data-repository');
const { AssertionActions } = require('../../support/actions/assertion-actions');

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

Then('element {string} on page {string} should be visible', (element, page) => {
  AssertionActions.shouldBeVisible(PageRegistry.get(page), element);
});
