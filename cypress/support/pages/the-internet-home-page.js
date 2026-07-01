const { BasePage } = require('./base-page');

/**
 * Page object for The Internet landing page.
 * Locators use stable destination href values exposed by the application.
 */
class TheInternetHomePage extends BasePage {
  constructor() {
    super('theInternetHome', {
      pageHeading: 'h1',
      examplesHeading: 'h2',
      loginLink: 'a[href="/login"]',
      checkboxesLink: 'a[href="/checkboxes"]',
      dropdownLink: 'a[href="/dropdown"]',
      tablesLink: 'a[href="/tables"]',
      dynamicControlsLink: 'a[href="/dynamic_controls"]'
    });
  }
}

module.exports = { TheInternetHomePage };
