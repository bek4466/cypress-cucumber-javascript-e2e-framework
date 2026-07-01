const { StepLogger } = require('../core/step-logger');
const { TextUtils } = require('../utils/text-utils');

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
      .then((actual) => TextUtils.normalize(actual))
      .should('equal', TextUtils.normalize(expected));
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

  /**
   * Verifies a checkbox or radio input is selected.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @returns {Cypress.Chainable} Assertion chain.
   */
  static shouldBeChecked(owner, elementName) {
    StepLogger.action(`Verify ${owner.name}.${elementName} is checked`);
    return owner.element(elementName).should('be.checked');
  }

  /**
   * Verifies a checkbox is not selected.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @returns {Cypress.Chainable} Assertion chain.
   */
  static shouldNotBeChecked(owner, elementName) {
    StepLogger.action(`Verify ${owner.name}.${elementName} is not checked`);
    return owner.element(elementName).should('not.be.checked');
  }

  /**
   * Verifies a form control's value attribute.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {string|number} expected Expected form value.
   * @returns {Cypress.Chainable} Assertion chain.
   */
  static shouldHaveValue(owner, elementName, expected) {
    StepLogger.action(`Verify value on ${owner.name}.${elementName}`);
    return owner.element(elementName).should('have.value', String(expected));
  }
}

module.exports = { AssertionActions };
