const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const jsonDirectory = path.join(projectRoot, 'reports', 'cucumber-json');

/**
 * Builds the primary human-readable Cucumber HTML report from generated JSON.
 * @param {{silentIfMissing?: boolean}} options Controls missing-input behavior.
 * @returns {boolean} True when a report was generated; otherwise false.
 */
async function generateCucumberReport({ silentIfMissing = false } = {}) {
  if (!fs.existsSync(jsonDirectory)) {
    if (silentIfMissing) return false;
    throw new Error(`Cucumber JSON directory does not exist: ${jsonDirectory}`);
  }

  const jsonFiles = fs
    .readdirSync(jsonDirectory)
    .filter((fileName) => fileName.endsWith('.json'));

  if (jsonFiles.length === 0) {
    if (silentIfMissing) return false;
    throw new Error(`No Cucumber JSON files were found in ${jsonDirectory}`);
  }

  const { generate } = await import('multiple-cucumber-html-reporter');

  await generate({
    jsonDir: jsonDirectory,
    reportPath: path.join(projectRoot, 'reports', 'cucumber-html'),
    pageTitle: 'Cypress Cucumber E2E Report',
    reportName: 'End-to-End Test Execution',
    displayDuration: true,
    displayReportTime: true,
    hideMetadata: false,
    metadata: {
      browser: {
        name: process.env.CYPRESS_BROWSER || 'Electron/Configured Browser',
        version: process.env.CYPRESS_BROWSER_VERSION || 'runtime'
      },
      device: 'Test workstation',
      platform: {
        name: process.platform,
        version: process.version
      }
    },
    customData: {
      title: 'Execution information',
      data: [
        { label: 'Environment', value: process.env.CYPRESS_environment || 'dev' },
        { label: 'Framework', value: 'Cypress + Cucumber + JavaScript' }
      ]
    }
  });

  console.log('Cucumber HTML report generated in reports/cucumber-html.');
  return true;
}

if (require.main === module) {
  generateCucumberReport().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { generateCucumberReport };
