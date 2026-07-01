const { BasePage } = require('./base-page');

/**
 * Page object for The Internet native dropdown example.
 */
class TheInternetDropdownPage extends BasePage {
  constructor() {
    super('theInternetDropdown', {
      pageHeading: 'h3',
      dropdown: '#dropdown',
      selectedOption: '#dropdown option:checked'
    });
  }
}

module.exports = { TheInternetDropdownPage };
