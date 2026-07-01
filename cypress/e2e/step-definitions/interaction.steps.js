const { When, Then } = require('@badeball/cypress-cucumber-preprocessor');
const { PageRegistry } = require('../../support/pages/page-registry');
const { DataRepository } = require('../../support/data/data-repository');
const { ElementActions } = require('../../support/actions/element-actions');
const { InputActions } = require('../../support/actions/input-actions');
const {
  KeyboardMouseActions
} = require('../../support/actions/keyboard-mouse-actions');
const { TableActions } = require('../../support/actions/table-actions');

/**
 * Clicks a visible, enabled element resolved through PageRegistry.
 * @param {string} element Logical locator name.
 * @param {string} page Registered page/component name.
 */
When('I click element {string} on page {string}', (element, page) => {
  ElementActions.click(PageRegistry.get(page), element);
});

/**
 * Force-clicks an element when the scenario intentionally targets covered or
 * otherwise non-actionable UI. Use normal click by default.
 * @param {string} element Logical locator name.
 * @param {string} page Registered page/component name.
 */
When('I force click element {string} on page {string}', (element, page) => {
  ElementActions.forceClick(PageRegistry.get(page), element);
});

/**
 * Double-clicks a visible page-object element.
 * @param {string} element Logical locator name.
 * @param {string} page Registered page/component name.
 */
When('I double click element {string} on page {string}', (element, page) => {
  ElementActions.doubleClick(PageRegistry.get(page), element);
});

/**
 * Types a value from centralized test data into an editable element.
 * @param {string} dataKey Dot-delimited key containing the input value.
 * @param {string} element Logical locator name.
 * @param {string} page Registered page/component name.
 */
When(
  'I type data {string} into element {string} on page {string}',
  (dataKey, element, page) => {
    InputActions.type(PageRegistry.get(page), element, DataRepository.get(dataKey));
  }
);

/**
 * Clears the current value from an editable element.
 * @param {string} element Logical locator name.
 * @param {string} page Registered page/component name.
 */
When('I clear element {string} on page {string}', (element, page) => {
  InputActions.clear(PageRegistry.get(page), element);
});

/**
 * Selects a native dropdown option resolved from centralized test data.
 * @param {string} dataKey Key containing option text, value, or index.
 * @param {string} element Logical select-element locator name.
 * @param {string} page Registered page/component name.
 */
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

/**
 * Checks a checkbox or radio input.
 * @param {string} element Logical input locator name.
 * @param {string} page Registered page/component name.
 */
When('I check element {string} on page {string}', (element, page) => {
  ElementActions.select(PageRegistry.get(page), element);
});

/**
 * Unchecks a checkbox input.
 * @param {string} element Logical input locator name.
 * @param {string} page Registered page/component name.
 */
When('I uncheck element {string} on page {string}', (element, page) => {
  ElementActions.unselect(PageRegistry.get(page), element);
});

/**
 * Scrolls a page-object element into the visible viewport.
 * @param {string} element Logical locator name.
 * @param {string} page Registered page/component name.
 */
When('I scroll to element {string} on page {string}', (element, page) => {
  ElementActions.scrollIntoView(PageRegistry.get(page), element);
});

/**
 * Sends a Cypress keyboard sequence such as {enter}, {esc}, or {ctrl}a.
 * @param {string} keys Cypress key sequence.
 * @param {string} element Logical target locator name.
 * @param {string} page Registered page/component name.
 */
When(
  'I send keys {string} to element {string} on page {string}',
  (keys, element, page) => {
    KeyboardMouseActions.keys(PageRegistry.get(page), element, keys);
  }
);

/**
 * Triggers a mouseover event on an element for hover-driven UI.
 * @param {string} element Logical locator name.
 * @param {string} page Registered page/component name.
 */
When('I hover over element {string} on page {string}', (element, page) => {
  KeyboardMouseActions.hover(PageRegistry.get(page), element);
});

/**
 * Finds a table row by identifying text and verifies another value appears in
 * the same row.
 * @param {string} table Logical table locator name.
 * @param {string} page Registered page/component name.
 * @param {string} row Text identifying the required row.
 * @param {string} expected Text expected within that row.
 */
Then(
  'table {string} on page {string} row {string} should contain {string}',
  (table, page, row, expected) => {
    TableActions.rowShouldContain(PageRegistry.get(page), table, row, expected);
  }
);
