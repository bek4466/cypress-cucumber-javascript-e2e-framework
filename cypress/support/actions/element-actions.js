const { StepLogger } = require('../core/step-logger');

/**
 * Reusable pointer and state-change actions for page-object elements.
 */
class ElementActions {
  /**
   * Clicks a visible, enabled element.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {object} options Cypress click options.
   * @returns {Cypress.Chainable} Click chain.
   */
  static click(owner, elementName, options = {}) {
    StepLogger.action(`Click ${owner.name}.${elementName}`);
    return owner
      .element(elementName)
      .should('be.visible')
      .and('not.be.disabled')
      .click(options);
  }

  /**
   * Clicks an element with Cypress force mode for intentionally covered UI.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {object} options Additional Cypress click options.
   * @returns {Cypress.Chainable} Click chain.
   */
  static forceClick(owner, elementName, options = {}) {
    StepLogger.action(`Force click ${owner.name}.${elementName}`);
    return owner.element(elementName).click({ ...options, force: true });
  }

  /**
   * Double-clicks a visible element.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {object} options Cypress double-click options.
   * @returns {Cypress.Chainable} Double-click chain.
   */
  static doubleClick(owner, elementName, options = {}) {
    StepLogger.action(`Double click ${owner.name}.${elementName}`);
    return owner.element(elementName).should('be.visible').dblclick(options);
  }

  /**
   * Checks a checkbox or radio input.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {string|string[]|object} value Optional value or Cypress options.
   * @returns {Cypress.Chainable} Check chain.
   */
  static select(owner, elementName, value = {}) {
    StepLogger.action(`Select ${owner.name}.${elementName}`);
    return owner.element(elementName).check(value);
  }

  /**
   * Clears a checkbox selection.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {object} options Cypress uncheck options.
   * @returns {Cypress.Chainable} Uncheck chain.
   */
  static unselect(owner, elementName, options = {}) {
    StepLogger.action(`Unselect ${owner.name}.${elementName}`);
    return owner.element(elementName).uncheck(options);
  }

  /**
   * Scrolls an element into the visible viewport.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {object} options Cypress scrollIntoView options.
   * @returns {Cypress.Chainable} Scroll chain.
   */
  static scrollIntoView(owner, elementName, options = {}) {
    StepLogger.action(`Scroll to ${owner.name}.${elementName}`);
    return owner.element(elementName).scrollIntoView(options).should('be.visible');
  }
}

module.exports = { ElementActions };
