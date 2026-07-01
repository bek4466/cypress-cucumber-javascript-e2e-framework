const {
  Given,
  When
} = require('@badeball/cypress-cucumber-preprocessor');
const { DataRepository } = require('../../support/data/data-repository');
const { NavigationActions } = require('../../support/actions/navigation-actions');

/**
 * Opens a URL resolved from centralized test data.
 * @param {string} urlKey Dot-delimited data key containing an absolute URL.
 */
Given('I open data URL {string}', (urlKey) => {
  NavigationActions.visit(DataRepository.get(urlKey));
});

/**
 * Opens a URL supplied directly by the feature scenario.
 * Prefer the data-key step when a URL is shared across multiple scenarios.
 * @param {string} url Absolute URL or path relative to Cypress baseUrl.
 */
Given('I open URL {string}', (url) => {
  NavigationActions.visit(url);
});

/**
 * Reloads the current document using normal browser cache behavior.
 */
When('I refresh the page', () => {
  NavigationActions.refresh();
});

/**
 * Reloads the current document while requesting a server refresh.
 */
When('I force refresh the page', () => {
  NavigationActions.refresh(true);
});

/**
 * Moves one entry backward in the active browser history.
 */
When('I navigate back', () => {
  NavigationActions.back();
});

/**
 * Moves one entry forward in the active browser history.
 */
When('I navigate forward', () => {
  NavigationActions.forward();
});
