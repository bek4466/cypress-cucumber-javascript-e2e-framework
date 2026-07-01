const {
  Given,
  When,
  Then
} = require('@badeball/cypress-cucumber-preprocessor');
const { DataRepository } = require('../../support/data/data-repository');
const { PageRegistry } = require('../../support/pages/page-registry');
const { NavigationActions } = require('../../support/actions/navigation-actions');
const { InputActions } = require('../../support/actions/input-actions');
const { ElementActions } = require('../../support/actions/element-actions');
const { AssertionActions } = require('../../support/actions/assertion-actions');
const { TableActions } = require('../../support/actions/table-actions');
const { WaitActions } = require('../../support/actions/wait-actions');

const pageNames = Object.freeze({
  home: 'theInternetHome',
  login: 'theInternetLogin',
  secureArea: 'theInternetSecureArea',
  checkboxes: 'theInternetCheckboxes',
  dropdown: 'theInternetDropdown',
  tables: 'theInternetTables',
  dynamicControls: 'theInternetDynamicControls'
});

/**
 * Resolves a short business page name to its registered page object.
 * @param {string} pageName Name used in The Internet feature files.
 * @returns {import('../../support/pages/base-page').BasePage} Page instance.
 */
function theInternetPage(pageName) {
  const registryName = pageNames[pageName];
  if (!registryName) {
    throw new Error(
      `Unknown The Internet page '${pageName}'. Available: ${Object.keys(pageNames).join(', ')}`
    );
  }
  return PageRegistry.get(registryName);
}

/**
 * Maps a human-readable checkbox position to its page-object locator name.
 * @param {string} position first or second.
 * @returns {string} Logical locator name.
 */
function checkboxName(position) {
  const names = { first: 'firstCheckbox', second: 'secondCheckbox' };
  if (!names[position]) {
    throw new Error(`Checkbox position must be 'first' or 'second', not '${position}'.`);
  }
  return names[position];
}

/**
 * Opens one The Internet route using a key from centralized page data.
 * @param {string} pageName Key under theInternet.paths.
 */
Given('I open The Internet page {string}', (pageName) => {
  NavigationActions.visit(DataRepository.get(`theInternet.paths.${pageName}`));
});

/**
 * Submits The Internet login form with values from centralized test data.
 * Password logging is disabled even though this public demo publishes it.
 * @param {string} usernameKey Key under theInternet.login.
 * @param {string} passwordKey Key under theInternet.login.
 */
When(
  'I log in to The Internet using {string} and {string}',
  (usernameKey, passwordKey) => {
    const loginPage = theInternetPage('login');
    InputActions.type(
      loginPage,
      'usernameInput',
      DataRepository.get(`theInternet.login.${usernameKey}`)
    );
    InputActions.type(
      loginPage,
      'passwordInput',
      DataRepository.get(`theInternet.login.${passwordKey}`),
      { log: false }
    );
    ElementActions.click(loginPage, 'loginButton');
  }
);

/**
 * Verifies the normalized authentication flash message on login or secure area.
 * @param {string} pageName login or secureArea.
 * @param {string} dataKey Key under theInternet.login containing expected text.
 */
Then(
  'The Internet {string} message should contain login data {string}',
  (pageName, dataKey) => {
    AssertionActions.shouldContainText(
      theInternetPage(pageName),
      'flashMessage',
      DataRepository.get(`theInternet.login.${dataKey}`)
    );
  }
);

/**
 * Verifies the secure-area heading after a successful authentication redirect.
 * @param {string} dataKey Key under theInternet.login containing heading text.
 */
Then('The Internet secure heading should equal login data {string}', (dataKey) => {
  AssertionActions.shouldHaveText(
    theInternetPage('secureArea'),
    'pageHeading',
    DataRepository.get(`theInternet.login.${dataKey}`)
  );
});

/**
 * Selects one checkbox through the reusable element-action layer.
 * @param {string} position first or second.
 */
When('I select the {string} checkbox on The Internet', (position) => {
  ElementActions.select(theInternetPage('checkboxes'), checkboxName(position));
});

/**
 * Clears one checkbox selection through the reusable element-action layer.
 * @param {string} position first or second.
 */
When('I unselect the {string} checkbox on The Internet', (position) => {
  ElementActions.unselect(theInternetPage('checkboxes'), checkboxName(position));
});

/**
 * Verifies a checkbox's checked state.
 * @param {string} position first or second.
 */
Then('the {string} checkbox should be selected', (position) => {
  AssertionActions.shouldBeChecked(
    theInternetPage('checkboxes'),
    checkboxName(position)
  );
});

/**
 * Verifies a checkbox's unselected state.
 * @param {string} position first or second.
 */
Then('the {string} checkbox should be unselected', (position) => {
  AssertionActions.shouldNotBeChecked(
    theInternetPage('checkboxes'),
    checkboxName(position)
  );
});

/**
 * Selects a native dropdown option using centralized visible text.
 * @param {string} dataKey Key under theInternet.controls.
 */
When('I choose The Internet dropdown data {string}', (dataKey) => {
  InputActions.selectDropdown(
    theInternetPage('dropdown'),
    'dropdown',
    DataRepository.get(`theInternet.controls.${dataKey}`)
  );
});

/**
 * Verifies the selected dropdown value attribute.
 * @param {string} dataKey Key under theInternet.controls.
 */
Then('The Internet dropdown value should equal data {string}', (dataKey) => {
  AssertionActions.shouldHaveValue(
    theInternetPage('dropdown'),
    'dropdown',
    DataRepository.get(`theInternet.controls.${dataKey}`)
  );
});

/**
 * Verifies two expected values occur in the same identified table row.
 * @param {string} rowKey Data key identifying the target row.
 * @param {string} valueKey Data key containing another expected cell value.
 */
Then(
  'The Internet first table row data {string} should contain data {string}',
  (rowKey, valueKey) => {
    TableActions.rowShouldContain(
      theInternetPage('tables'),
      'firstTable',
      DataRepository.get(`theInternet.tables.${rowKey}`),
      DataRepository.get(`theInternet.tables.${valueKey}`)
    );
  }
);

/**
 * Verifies the expected number of body rows in the first data table.
 * @param {string} countKey Data key containing a numeric row count.
 */
Then('The Internet first table should have row count data {string}', (countKey) => {
  TableActions.shouldHaveRowCount(
    theInternetPage('tables'),
    'firstTable',
    DataRepository.get(`theInternet.tables.${countKey}`)
  );
});

/**
 * Requests asynchronous enabling of the dynamic text input.
 */
When('I enable The Internet dynamic text input', () => {
  ElementActions.click(theInternetPage('dynamicControls'), 'enableDisableButton');
});

/**
 * Waits on the actual enabled state and then enters centralized data.
 * @param {string} dataKey Key under theInternet.controls.
 */
When('I enter data {string} after the dynamic input is enabled', (dataKey) => {
  const dynamicPage = theInternetPage('dynamicControls');
  WaitActions.untilEnabled(dynamicPage, 'textInput');
  InputActions.type(
    dynamicPage,
    'textInput',
    DataRepository.get(`theInternet.controls.${dataKey}`)
  );
});

/**
 * Verifies the final dynamic-input value.
 * @param {string} dataKey Key under theInternet.controls.
 */
Then('The Internet dynamic input should equal data {string}', (dataKey) => {
  AssertionActions.shouldHaveValue(
    theInternetPage('dynamicControls'),
    'textInput',
    DataRepository.get(`theInternet.controls.${dataKey}`)
  );
});

/**
 * Verifies the asynchronous status message displayed by dynamic controls.
 * @param {string} dataKey Key under theInternet.controls.
 */
Then('The Internet dynamic message should equal data {string}', (dataKey) => {
  AssertionActions.shouldHaveText(
    theInternetPage('dynamicControls'),
    'statusMessage',
    DataRepository.get(`theInternet.controls.${dataKey}`)
  );
});
