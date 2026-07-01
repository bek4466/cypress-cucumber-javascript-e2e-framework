const { StepLogger } = require('../core/step-logger');

/**
 * Reusable actions for editable fields and native select controls.
 */
class InputActions {
  /**
   * Types text into a visible field.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {string|number} value Text to enter.
   * @param {object} options Cypress type options; use log:false for secrets.
   * @returns {Cypress.Chainable} Type chain.
   */
  static type(owner, elementName, value, options = {}) {
    StepLogger.action(`Type into ${owner.name}.${elementName}`);
    return owner
      .element(elementName)
      .should('be.visible')
      .and('not.be.disabled')
      .type(String(value), options);
  }

  /**
   * Clears an editable field.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {object} options Cypress clear options.
   * @returns {Cypress.Chainable} Clear chain.
   */
  static clear(owner, elementName, options = {}) {
    StepLogger.action(`Clear ${owner.name}.${elementName}`);
    return owner.element(elementName).should('be.enabled').clear(options);
  }

  /**
   * Replaces existing field content with a new value.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {string|number} value Replacement value.
   * @param {object} options Cypress type options.
   * @returns {Cypress.Chainable} Type chain.
   */
  static replace(owner, elementName, value, options = {}) {
    return InputActions.clear(owner, elementName).type(String(value), options);
  }

  /**
   * Selects one or more native dropdown options by value, text, or index.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {string|number|string[]|number[]} option Selectable option value(s).
   * @param {object} options Cypress select options.
   * @returns {Cypress.Chainable} Select chain.
   */
  static selectDropdown(owner, elementName, option, options = {}) {
    StepLogger.action(`Select dropdown option on ${owner.name}.${elementName}`);
    return owner.element(elementName).should('be.enabled').select(option, options);
  }
}

module.exports = { InputActions };
