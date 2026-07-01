/**
 * Closure-free callback executed by Cypress in a secondary origin.
 * Everything it consumes must arrive through the serializable args object.
 * @param {{path: string, selector: string, expected: string}} args Origin data.
 * @returns {void}
 */
function visitAndAssertText({ path, selector, expected }) {
  cy.visit(path);
  cy.get(selector)
    .invoke('text')
    .then((actual) => actual.replace(/\s+/g, ' ').trim())
    .should('equal', String(expected).replace(/\s+/g, ' ').trim());
}

/**
 * Closure-free callback that visits and clicks in a secondary origin.
 * @param {{path: string, selector: string, options: object}} args Origin data.
 * @returns {void}
 */
function visitAndClick({ path, selector, options }) {
  cy.visit(path);
  cy.get(selector).should('be.visible').click(options);
}

/**
 * Closure-free callback that visits and types in a secondary origin.
 * @param {{path: string, selector: string, value: string, options: object}} args Origin data.
 * @returns {void}
 */
function visitAndType({ path, selector, value, options }) {
  cy.visit(path);
  cy.get(selector).should('be.visible').type(String(value), options);
}

/**
 * Stable façade for reusable operations across independent domains. It avoids
 * closures and passes only serializable data, as required by cy.origin.
 */
class OriginService {
  /**
   * Visits a secondary origin and verifies normalized exact element text.
   * @param {string} url Absolute URL.
   * @param {string} selector Selector resolved from a page object.
   * @param {string|number} expected Expected text.
   * @returns {Cypress.Chainable} Origin command chain.
   */
  static visitAndAssertText(url, selector, expected) {
    const target = new URL(url);
    const path = `${target.pathname}${target.search}${target.hash}`;
    return cy.origin(
      target.origin,
      { args: { path, selector, expected } },
      visitAndAssertText
    );
  }

  /**
   * Visits a secondary origin and clicks a visible page-object element.
   * @param {string} url Absolute URL.
   * @param {string} selector Selector resolved from a page object.
   * @param {object} options Serializable Cypress click options.
   * @returns {Cypress.Chainable} Origin command chain.
   */
  static visitAndClick(url, selector, options = {}) {
    const target = new URL(url);
    const path = `${target.pathname}${target.search}${target.hash}`;
    return cy.origin(
      target.origin,
      { args: { path, selector, options } },
      visitAndClick
    );
  }

  /**
   * Visits a secondary origin and types into a page-object element.
   * @param {string} url Absolute URL.
   * @param {string} selector Selector resolved from a page object.
   * @param {string|number} value Serializable input value.
   * @param {object} options Serializable Cypress type options.
   * @returns {Cypress.Chainable} Origin command chain.
   */
  static visitAndType(url, selector, value, options = {}) {
    const target = new URL(url);
    const path = `${target.pathname}${target.search}${target.hash}`;
    return cy.origin(
      target.origin,
      { args: { path, selector, value, options } },
      visitAndType
    );
  }
}

module.exports = { OriginService };
