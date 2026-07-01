const { StepLogger } = require('../core/step-logger');

/**
 * Retryable state waits for asynchronous controls. These methods use Cypress
 * assertions rather than fixed delays, so they stop immediately when ready.
 */
class WaitActions {
  /**
   * Waits until an element is visible.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {number} timeout Maximum retry duration in milliseconds.
   * @returns {Cypress.Chainable} Assertion chain.
   */
  static untilVisible(owner, elementName, timeout = 10000) {
    StepLogger.action(`Wait for ${owner.name}.${elementName} to be visible`);
    return owner.element(elementName, { timeout }).should('be.visible');
  }

  /**
   * Waits until a form control becomes enabled.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {number} timeout Maximum retry duration in milliseconds.
   * @returns {Cypress.Chainable} Assertion chain.
   */
  static untilEnabled(owner, elementName, timeout = 10000) {
    StepLogger.action(`Wait for ${owner.name}.${elementName} to be enabled`);
    return owner.element(elementName, { timeout }).should('be.enabled');
  }

  /**
   * Waits until a form control becomes disabled.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {number} timeout Maximum retry duration in milliseconds.
   * @returns {Cypress.Chainable} Assertion chain.
   */
  static untilDisabled(owner, elementName, timeout = 10000) {
    StepLogger.action(`Wait for ${owner.name}.${elementName} to be disabled`);
    return owner.element(elementName, { timeout }).should('be.disabled');
  }

  /**
   * Waits until an element is removed from the DOM.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {number} timeout Maximum retry duration in milliseconds.
   * @returns {Cypress.Chainable} Assertion chain.
   */
  static untilAbsent(owner, elementName, timeout = 10000) {
    StepLogger.action(`Wait for ${owner.name}.${elementName} to be removed`);
    return owner.element(elementName, { timeout }).should('not.exist');
  }
}

module.exports = { WaitActions };
