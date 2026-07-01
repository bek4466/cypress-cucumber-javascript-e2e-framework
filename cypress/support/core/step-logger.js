const {
  log: cucumberLog,
  attach
} = require('@badeball/cypress-cucumber-preprocessor');

/**
 * Sends readable diagnostics to both Cypress and Cucumber reports.
 * Secrets must never be included in messages passed to this class.
 */
class StepLogger {
  /**
   * Records an action without breaking the Cypress command queue.
   * @param {string} message Sanitized diagnostic message.
   * @returns {Cypress.Chainable} Cucumber logging chain.
   */
  static action(message) {
    Cypress.log({ name: 'ACTION', message });
    return cucumberLog(message);
  }

  /**
   * Adds structured text to the active Cucumber scenario.
   * @param {string|object} value Serializable diagnostic content.
   * @param {string} fileName Attachment name displayed in reports.
   * @returns {Cypress.Chainable} Attachment chain.
   */
  static attachJson(value, fileName = 'details.json') {
    return attach(JSON.stringify(value, null, 2), {
      mediaType: 'application/json',
      fileName
    });
  }
}

module.exports = { StepLogger };
