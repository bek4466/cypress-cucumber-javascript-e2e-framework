const { Then } = require('@badeball/cypress-cucumber-preprocessor');
const { DataRepository } = require('../../support/data/data-repository');
const { PageRegistry } = require('../../support/pages/page-registry');
const { AssertionActions } = require('../../support/actions/assertion-actions');

/**
 * Deliberately compares the login heading with the secure-area heading value.
 * This step exists only to demonstrate failed-test screenshots, video, retries,
 * and report evidence. Use it exclusively with the @artifact-failure tag.
 */
Then('I intentionally fail The Internet artifact validation', () => {
  AssertionActions.shouldHaveText(
    PageRegistry.get('theInternetLogin'),
    'pageHeading',
    DataRepository.get('theInternet.login.secureHeading')
  );
});
