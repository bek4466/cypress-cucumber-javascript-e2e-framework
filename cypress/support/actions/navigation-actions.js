const { StepLogger } = require('../core/step-logger');

/**
 * Centralized browser navigation operations.
 */
class NavigationActions {
  /**
   * Opens an absolute URL or a path relative to Cypress baseUrl.
   * @param {string} url URL or relative path.
   * @param {object} options Cypress visit options.
   * @returns {Cypress.Chainable<Window>} Visit chain.
   */
  static visit(url, options = {}) {
    StepLogger.action(`Visit ${url}`);
    return cy.visit(url, options);
  }

  /**
   * Reloads the current page, optionally bypassing browser cache.
   * @param {boolean} forceReload Whether Cypress should force a server reload.
   * @param {object} options Cypress reload options.
   * @returns {Cypress.Chainable<Window>} Reload chain.
   */
  static refresh(forceReload = false, options = {}) {
    StepLogger.action(`Refresh page${forceReload ? ' without cache' : ''}`);
    return cy.reload(forceReload, options);
  }

  /**
   * Navigates one entry backward in browser history.
   * @returns {Cypress.Chainable<Window>} Navigation chain.
   */
  static back() {
    StepLogger.action('Navigate back');
    return cy.go('back');
  }

  /**
   * Navigates one entry forward in browser history.
   * @returns {Cypress.Chainable<Window>} Navigation chain.
   */
  static forward() {
    StepLogger.action('Navigate forward');
    return cy.go('forward');
  }
}

module.exports = { NavigationActions };
