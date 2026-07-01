/**
 * Validates and resolves selectors from page or component object definitions.
 * This prevents raw selectors from spreading through step definitions.
 */
class LocatorResolver {
  /**
   * Returns a locator stored on a page or component object.
   * @param {{name: string, locators: object}} owner Page or component instance.
   * @param {string} elementName Logical element name.
   * @returns {string} CSS selector.
   */
  static selector(owner, elementName) {
    if (!owner || !owner.locators) {
      throw new Error('A page or component object with locators is required.');
    }

    const selector = owner.locators[elementName];
    if (typeof selector !== 'string' || selector.trim() === '') {
      throw new Error(
        `Locator '${elementName}' is not defined on '${owner.name || 'unknown'}'.`
      );
    }

    return selector;
  }

  /**
   * Creates a Cypress chain for a centrally stored locator.
   * @param {{name: string, locators: object}} owner Page or component instance.
   * @param {string} elementName Logical element name.
   * @param {Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable>} options Cypress get options.
   * @returns {Cypress.Chainable<JQuery<HTMLElement>>} Matching DOM elements.
   */
  static element(owner, elementName, options = {}) {
    return cy.get(LocatorResolver.selector(owner, elementName), options);
  }
}

module.exports = { LocatorResolver };
