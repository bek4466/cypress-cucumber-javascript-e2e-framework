const { BasePage } = require('../pages/base-page');

/**
 * Cross-page component containing only truly universal document locators.
 * Application-specific headers, dialogs, and tables should get separate
 * component objects rather than being added to this class.
 */
class CommonComponent extends BasePage {
  constructor() {
    super('common', {
      body: 'body',
      activeElement: ':focus'
    });
  }
}

module.exports = { CommonComponent };
