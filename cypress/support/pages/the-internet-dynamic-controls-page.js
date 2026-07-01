const { BasePage } = require('./base-page');

/**
 * Page object for asynchronously enabled/disabled and added/removed controls.
 */
class TheInternetDynamicControlsPage extends BasePage {
  constructor() {
    super('theInternetDynamicControls', {
      pageHeading: 'h4',
      checkbox: '#checkbox-example input[type="checkbox"]',
      removeAddButton: '#checkbox-example button',
      textInput: '#input-example input[type="text"]',
      enableDisableButton: '#input-example button',
      statusMessage: '#message'
    });
  }
}

module.exports = { TheInternetDynamicControlsPage };
