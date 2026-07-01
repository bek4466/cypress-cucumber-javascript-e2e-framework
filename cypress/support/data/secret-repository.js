/**
 * Retrieves allow-listed credentials from the Node process without exposing
 * the complete environment to application or third-party browser code.
 */
class SecretRepository {
  /**
   * Returns a secret through a non-logging Cypress task.
   * @param {'TEST_USERNAME'|'TEST_PASSWORD'} name Allow-listed secret name.
   * @returns {Cypress.Chainable<string>} Secret value chain.
   */
  static get(name) {
    return cy.task('getSecret', name, { log: false });
  }
}

module.exports = { SecretRepository };
