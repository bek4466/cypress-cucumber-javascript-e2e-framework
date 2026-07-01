const { BasePage } = require('./base-page');

/**
 * Page object for the authenticated secure area reached after a valid login.
 */
class TheInternetSecureAreaPage extends BasePage {
  constructor() {
    super('theInternetSecureArea', {
      pageHeading: 'h2',
      flashMessage: '#flash',
      logoutButton: 'a[href="/logout"]'
    });
  }
}

module.exports = { TheInternetSecureAreaPage };
