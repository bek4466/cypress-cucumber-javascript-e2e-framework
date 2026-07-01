const { BasePage } = require('./base-page');

/**
 * Page object for the IANA example domains used by framework smoke scenarios.
 * All selectors for these pages are intentionally stored only here.
 */


/**( EXAMPLE locator
 * super('login', {
  usernameInput: '[data-testid="username"]',
  passwordInput: '[data-testid="password"]',
  loginButton: '[data-testid="login-button"]',
  errorMessage: '.login-error'
});
) */
class ExamplePage extends BasePage {
  constructor() {
    super('example', {
      body: 'body',
      heading: 'h1',
      description: 'p',
      moreInformationLink: 'a'
    });
  }
}

module.exports = { ExamplePage };
