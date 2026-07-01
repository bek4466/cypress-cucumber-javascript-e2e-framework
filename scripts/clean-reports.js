const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const generatedDirectories = [
  'reports',
  'cypress/screenshots',
  'cypress/videos',
  'cypress/downloads'
];

for (const directory of generatedDirectories) {
  fs.rmSync(path.join(projectRoot, directory), {
    recursive: true,
    force: true
  });
}

console.log('Generated reports and Cypress artifacts were removed.');
