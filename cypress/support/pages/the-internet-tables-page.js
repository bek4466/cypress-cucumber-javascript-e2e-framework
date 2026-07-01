const { BasePage } = require('./base-page');

/**
 * Page object for The Internet sortable data-table examples.
 */
class TheInternetTablesPage extends BasePage {
  constructor() {
    super('theInternetTables', {
      pageHeading: 'h3',
      firstTable: '#table1',
      secondTable: '#table2'
    });
  }
}

module.exports = { TheInternetTablesPage };
