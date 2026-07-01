const { BasePage } = require('./base-page');

/**
 * Page object for The Internet checkbox example.
 * The demo provides no IDs or test attributes, so positional selectors are
 * isolated here and must be revisited if the page structure changes.
 */
class TheInternetCheckboxesPage extends BasePage {
  constructor() {
    super('theInternetCheckboxes', {
      pageHeading: 'h3',
      firstCheckbox: '#checkboxes input[type="checkbox"]:nth-of-type(1)',
      secondCheckbox: '#checkboxes input[type="checkbox"]:nth-of-type(2)'
    });
  }
}

module.exports = { TheInternetCheckboxesPage };
