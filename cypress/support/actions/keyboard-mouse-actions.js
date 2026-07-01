const { StepLogger } = require('../core/step-logger');

/**
 * Keyboard and low-level mouse operations for interactions not covered by a
 * normal click or type action.
 */
class KeyboardMouseActions {
  /**
   * Sends Cypress key sequences such as {enter}, {esc}, or {ctrl}a.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {string} keySequence Cypress key sequence.
   * @param {object} options Cypress type options.
   * @returns {Cypress.Chainable} Type chain.
   */
  static keys(owner, elementName, keySequence, options = {}) {
    StepLogger.action(`Send keyboard input to ${owner.name}.${elementName}`);
    return owner.element(elementName).type(keySequence, options);
  }

  /**
   * Moves the pointer over an element using the mouseover DOM event.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {object} options Cypress trigger options.
   * @returns {Cypress.Chainable} Trigger chain.
   */
  static hover(owner, elementName, options = {}) {
    StepLogger.action(`Hover over ${owner.name}.${elementName}`);
    return owner.element(elementName).trigger('mouseover', options);
  }

  /**
   * Fires a named mouse event on an element.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} elementName Logical locator name.
   * @param {'mousedown'|'mouseup'|'mousemove'|'contextmenu'} eventName Mouse event.
   * @param {object} options Cypress trigger options including coordinates.
   * @returns {Cypress.Chainable} Trigger chain.
   */
  static mouse(owner, elementName, eventName, options = {}) {
    StepLogger.action(`Trigger ${eventName} on ${owner.name}.${elementName}`);
    return owner.element(elementName).trigger(eventName, options);
  }
}

module.exports = { KeyboardMouseActions };
