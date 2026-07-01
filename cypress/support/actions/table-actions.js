const { StepLogger } = require('../core/step-logger');

/**
 * Reusable semantic checks for HTML tables.
 */
class TableActions {
  /**
   * Finds a row by one cell value and verifies another value in the same row.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} tableName Logical table locator name.
   * @param {string} rowIdentifier Text identifying the target row.
   * @param {string} expectedCellText Text expected anywhere in that row.
   * @returns {Cypress.Chainable} Assertion chain.
   */
  static rowShouldContain(owner, tableName, rowIdentifier, expectedCellText) {
    StepLogger.action(
      `Verify row '${rowIdentifier}' in ${owner.name}.${tableName}`
    );
    return owner
      .element(tableName)
      .find('tr')
      .contains('td,th', rowIdentifier)
      .parents('tr')
      .should('contain.text', expectedCellText);
  }

  /**
   * Verifies an exact body-row count, excluding table headers.
   * @param {import('../pages/base-page').BasePage} owner Page/component object.
   * @param {string} tableName Logical table locator name.
   * @param {number} expectedCount Expected tbody row count.
   * @returns {Cypress.Chainable} Assertion chain.
   */
  static shouldHaveRowCount(owner, tableName, expectedCount) {
    StepLogger.action(`Verify row count for ${owner.name}.${tableName}`);
    return owner
      .element(tableName)
      .find('tbody tr')
      .should('have.length', expectedCount);
  }
}

module.exports = { TableActions };
