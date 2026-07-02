const { After } = require('@badeball/cypress-cucumber-preprocessor');

/**
 * Converts a scenario name into a portable screenshot filename.
 * @param {string} value Scenario name supplied by Cucumber.
 * @returns {string} Filesystem-safe lowercase name.
 */
function toScreenshotName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

/**
 * Captures every scenario in a live Cucumber hook, including successful ones.
 * The Cucumber preprocessor attaches this screenshot to its JSON/HTML output,
 * and Allure receives it through the same Cypress screenshot event.
 * @param {import('@badeball/cypress-cucumber-preprocessor').ICaseHookParameter} context Cucumber scenario metadata.
 */
After({ name: 'Capture scenario screenshot', order: 1000 }, ({ pickle }) => {
  cy.screenshot(`scenario-${toScreenshotName(pickle.name)}`, {
    capture: 'runner',
    overwrite: false
  });
});
