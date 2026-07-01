const { Then } = require('@badeball/cypress-cucumber-preprocessor');
const { DataRepository } = require('../../support/data/data-repository');
const { PageRegistry } = require('../../support/pages/page-registry');
const { OriginService } = require('../../support/services/origin-service');

Then(
  'on origin at data URL {string} page {string} element {string} should equal data {string}',
  (urlKey, pageName, elementName, expectedDataKey) => {
    const targetUrl = DataRepository.get(urlKey);
    const selector = PageRegistry.get(pageName).selector(elementName);
    const expected = DataRepository.get(expectedDataKey);

    OriginService.visitAndAssertText(targetUrl, selector, expected);
  }
);
