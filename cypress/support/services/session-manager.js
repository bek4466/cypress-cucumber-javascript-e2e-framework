const { StepLogger } = require('../core/step-logger');

const tokenStore = new Map();

/**
 * Manages Cypress session caching and in-memory authentication tokens.
 * Passwords and token values are deliberately excluded from logs.
 */
class SessionManager {
  /**
   * Caches cookies, localStorage, and sessionStorage using cy.session.
   * setup and validate run at Cypress command-queue time and may enqueue
   * commands. cy.session must be invoked outside a cy.origin callback.
   * @param {string|string[]|object} sessionId Unique cache identity.
   * @param {Function} setup Login or token setup function.
   * @param {Function} validate Function that proves a restored session works.
   * @param {boolean} cacheAcrossSpecs Reuse the session in other spec files.
   * @returns {Cypress.Chainable} Session chain.
   */
  static cache(sessionId, setup, validate, cacheAcrossSpecs = true) {
    StepLogger.action(`Restore or create session '${JSON.stringify(sessionId)}'`);
    return cy.session(sessionId, setup, {
      validate,
      cacheAcrossSpecs
    });
  }

  /**
   * Stores a token only in the Cypress browser process memory.
   * @param {string} name Logical token name.
   * @param {string} token Secret token value.
   * @returns {void}
   */
  static setToken(name, token) {
    tokenStore.set(name, token);
  }

  /**
   * Retrieves a required in-memory token.
   * @param {string} name Logical token name.
   * @returns {string} Stored token.
   */
  static getToken(name) {
    const token = tokenStore.get(name);
    if (!token) {
      throw new Error(`Session token '${name}' is not available in memory.`);
    }
    return token;
  }

  /**
   * Removes all in-memory tokens without writing them to disk or reports.
   * @returns {void}
   */
  static clearTokens() {
    tokenStore.clear();
  }
}

module.exports = { SessionManager };
