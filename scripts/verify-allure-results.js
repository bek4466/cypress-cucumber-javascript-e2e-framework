const fs = require('node:fs');
const path = require('node:path');

const resultsDirectory = path.resolve(__dirname, '..', 'reports', 'allure-results');
const hasResults =
  fs.existsSync(resultsDirectory) &&
  fs.readdirSync(resultsDirectory).some((fileName) => fileName.endsWith('.json'));

if (!hasResults) {
  throw new Error(
    'No Allure result JSON exists. Run the Cypress suite before generating Allure HTML.'
  );
}
