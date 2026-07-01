const { ExamplePage } = require('./example-page');
const { CommonComponent } = require('../components/common-component');
const { TheInternetHomePage } = require('./the-internet-home-page');
const { TheInternetLoginPage } = require('./the-internet-login-page');
const {
  TheInternetSecureAreaPage
} = require('./the-internet-secure-area-page');
const {
  TheInternetCheckboxesPage
} = require('./the-internet-checkboxes-page');
const { TheInternetDropdownPage } = require('./the-internet-dropdown-page');
const { TheInternetTablesPage } = require('./the-internet-tables-page');
const {
  TheInternetDynamicControlsPage
} = require('./the-internet-dynamic-controls-page');

const owners = Object.freeze({
  example: new ExamplePage(),
  common: new CommonComponent(),
  theInternetHome: new TheInternetHomePage(),
  theInternetLogin: new TheInternetLoginPage(),
  theInternetSecureArea: new TheInternetSecureAreaPage(),
  theInternetCheckboxes: new TheInternetCheckboxesPage(),
  theInternetDropdown: new TheInternetDropdownPage(),
  theInternetTables: new TheInternetTablesPage(),
  theInternetDynamicControls: new TheInternetDynamicControlsPage()
});

/**
 * Resolves page and component objects by stable logical name.
 */
class PageRegistry {
  /**
   * @param {string} name Registered page or component name.
   * @returns {import('./base-page').BasePage} Page/component instance.
   */
  static get(name) {
    const owner = owners[name];
    if (!owner) {
      throw new Error(
        `Page or component '${name}' is not registered. Available: ${Object.keys(owners).join(', ')}`
      );
    }
    return owner;
  }
}

module.exports = { PageRegistry };
