const { BasePage } = require('./base-page');

/**
 * Page object for The Internet form-authentication page.
 * Credentials are supplied by DataRepository or SecretRepository, never stored
 * in this locator-only object.
 */
class TheInternetLoginPage extends BasePage {
  constructor() {
    super('theInternetLogin', {
      pageHeading: 'h2',
      usernameInput: '#username',
      passwordInput: '#password',
      loginButton: 'button[type="submit"]',
      flashMessage: '#flash'
    });
  }
}

module.exports = { TheInternetLoginPage };
