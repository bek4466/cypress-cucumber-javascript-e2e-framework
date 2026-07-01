require('allure-cypress');
require('./commands');

afterEach(function () {
  if (this.currentTest?.state === 'failed') {
    cy.task('log', `Failed: ${this.currentTest.fullTitle()}`, { log: false });
  }
});
