const { When, Then } = require('@badeball/cypress-cucumber-preprocessor');
const { PageRegistry } = require('../../support/pages/page-registry');
const { DataRepository } = require('../../support/data/data-repository');
const { ElementActions } = require('../../support/actions/element-actions');
const { InputActions } = require('../../support/actions/input-actions');
const {
  KeyboardMouseActions
} = require('../../support/actions/keyboard-mouse-actions');
const { TableActions } = require('../../support/actions/table-actions');

When('I click element {string} on page {string}', (element, page) => {
  ElementActions.click(PageRegistry.get(page), element);
});

When('I force click element {string} on page {string}', (element, page) => {
  ElementActions.forceClick(PageRegistry.get(page), element);
});

When('I double click element {string} on page {string}', (element, page) => {
  ElementActions.doubleClick(PageRegistry.get(page), element);
});

When(
  'I type data {string} into element {string} on page {string}',
  (dataKey, element, page) => {
    InputActions.type(PageRegistry.get(page), element, DataRepository.get(dataKey));
  }
);

When('I clear element {string} on page {string}', (element, page) => {
  InputActions.clear(PageRegistry.get(page), element);
});

When(
  'I select data {string} from element {string} on page {string}',
  (dataKey, element, page) => {
    InputActions.selectDropdown(
      PageRegistry.get(page),
      element,
      DataRepository.get(dataKey)
    );
  }
);

When('I check element {string} on page {string}', (element, page) => {
  ElementActions.select(PageRegistry.get(page), element);
});

When('I uncheck element {string} on page {string}', (element, page) => {
  ElementActions.unselect(PageRegistry.get(page), element);
});

When('I scroll to element {string} on page {string}', (element, page) => {
  ElementActions.scrollIntoView(PageRegistry.get(page), element);
});

When(
  'I send keys {string} to element {string} on page {string}',
  (keys, element, page) => {
    KeyboardMouseActions.keys(PageRegistry.get(page), element, keys);
  }
);

When('I hover over element {string} on page {string}', (element, page) => {
  KeyboardMouseActions.hover(PageRegistry.get(page), element);
});

Then(
  'table {string} on page {string} row {string} should contain {string}',
  (table, page, row, expected) => {
    TableActions.rowShouldContain(PageRegistry.get(page), table, row, expected);
  }
);
