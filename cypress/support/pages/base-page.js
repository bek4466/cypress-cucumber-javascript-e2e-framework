const { LocatorResolver } = require('../core/locator-resolver');

/**
 * Base contract shared by all page and component objects.
 */
class BasePage {
  /**
   * @param {string} name Stable registry name used by Cucumber steps.
   * @param {Record<string, string>} locators Logical names mapped to selectors.
   */
  constructor(name, locators) {
    this.name = name;
    this.locators = Object.freeze({ ...locators });
  }

  /**
   * Resolves an element through the framework's central locator resolver.
   * @param {string} elementName Logical locator name.
   * @param {object} options Cypress get options.
   * @returns {Cypress.Chainable<JQuery<HTMLElement>>} Matching elements.
   */
  element(elementName, options = {}) {
    return LocatorResolver.element(this, elementName, options);
  }

  /**
   * Returns the raw selector for origin serialization or advanced commands.
   * @param {string} elementName Logical locator name.
   * @returns {string} CSS selector.
   */
  selector(elementName) {
    return LocatorResolver.selector(this, elementName);
  }
}

module.exports = { BasePage };
