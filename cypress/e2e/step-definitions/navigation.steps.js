const {
  Given,
  When
} = require('@badeball/cypress-cucumber-preprocessor');
const { DataRepository } = require('../../support/data/data-repository');
const { NavigationActions } = require('../../support/actions/navigation-actions');

Given('I open data URL {string}', (urlKey) => {
  NavigationActions.visit(DataRepository.get(urlKey));
});

Given('I open URL {string}', (url) => {
  NavigationActions.visit(url);
});

When('I refresh the page', () => {
  NavigationActions.refresh();
});

When('I force refresh the page', () => {
  NavigationActions.refresh(true);
});

When('I navigate back', () => {
  NavigationActions.back();
});

When('I navigate forward', () => {
  NavigationActions.forward();
});
