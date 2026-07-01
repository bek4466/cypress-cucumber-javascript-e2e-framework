const { StepLogger } = require('../core/step-logger');

/**
 * Shared UI assertions that include consistent reporting context.
 */
class AssertionActions {
  /**
   * Verifies an element contains expected text after whitespace normalization.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {string|number} expected Expected text.
   * @returns {Cypress.Chainable} Assertion chain.
   */
  static shouldContainText(owner, elementName, expected) {
    StepLogger.action(
      `Verify ${owner.name}.${elementName} contains '${expected}'`
    );
    return owner.element(elementName).should('contain.text', String(expected));
  }

  /**
   * Verifies normalized element text exactly matches the expected string.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {string|number} expected Expected text.
   * @returns {Cypress.Chainable} Assertion chain.
   */
  static shouldHaveText(owner, elementName, expected) {
    StepLogger.action(`Verify exact text on ${owner.name}.${elementName}`);
    return owner
      .element(elementName)
      .invoke('text')
      .then((actual) => actual.replace(/\s+/g, ' ').trim())
      .should('equal', String(expected).replace(/\s+/g, ' ').trim());
  }

  /**
   * Verifies element visibility.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @returns {Cypress.Chainable} Assertion chain.
   */
  static shouldBeVisible(owner, elementName) {
    StepLogger.action(`Verify ${owner.name}.${elementName} is visible`);
    return owner.element(elementName).should('be.visible');
  }
}

module.exports = { AssertionActions };
