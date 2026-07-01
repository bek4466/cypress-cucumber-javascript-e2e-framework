const fs = require('node:fs');
const path = require('node:path');
const { defineConfig } = require('cypress');
const createBundler = require('@bahmutov/cypress-esbuild-preprocessor');
const {
  addCucumberPreprocessorPlugin
} = require('@badeball/cypress-cucumber-preprocessor');
const {
  createEsbuildPlugin
} = require('@badeball/cypress-cucumber-preprocessor/esbuild');
const { allureCypress } = require('allure-cypress/reporter');
const cypressOnFix = require('cypress-on-fix');
const dotenv = require('dotenv');
const { generateCucumberReport } = require('./scripts/generate-cucumber-report');

dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

/**
 * Converts conventional string environment values to their runtime types.
 * @param {string|undefined} value Environment variable value.
 * @param {*} fallback Value returned when the variable is absent.
 * @returns {*} Parsed boolean, number, string, or fallback value.
 */
function parseEnvironmentValue(value, fallback) {
  if (value === undefined || value === '') return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

/**
 * Loads public environment configuration without placing secrets in source.
 * @param {string} environment Logical environment name such as dev or qa.
 * @returns {object} Parsed configuration object.
 */
function loadEnvironmentConfiguration(environment) {
  const configurationPath = path.resolve(
    __dirname,
    'cypress',
    'config',
    'environments',
    `${environment}.json`
  );

  if (!fs.existsSync(configurationPath)) {
    throw new Error(
      `Environment configuration '${environment}' was not found at ${configurationPath}`
    );
  }

  return JSON.parse(fs.readFileSync(configurationPath, 'utf8'));
}

module.exports = defineConfig({
  video: parseEnvironmentValue(process.env.CYPRESS_video, false),
  videoCompression: 32,
  screenshotOnRunFailure: true,
  screenshotsFolder: 'cypress/screenshots',
  videosFolder: 'cypress/videos',
  downloadsFolder: 'cypress/downloads',
  trashAssetsBeforeRuns: true,
  chromeWebSecurity: true,
  retries: {
    runMode: 1,
    openMode: 0
  },
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  responseTimeout: 30000,
  pageLoadTimeout: 60000,
  viewportWidth: 1440,
  viewportHeight: 900,
  e2e: {
    specPattern: 'cypress/e2e/features/**/*.feature',
    supportFile: 'cypress/support/e2e.js',
    async setupNodeEvents(on, config) {
      const fixedOn = cypressOnFix(on);
      const environment = config.env.environment || process.env.CYPRESS_environment || 'dev';
      const environmentConfig = loadEnvironmentConfiguration(environment);

      config.baseUrl = environmentConfig.baseUrl;
      config.env.environment = environment;
      config.env.domains = environmentConfig.domains;
      config.expose = {
        ...(config.expose || {}),
        environment,
        domains: environmentConfig.domains,
        apiBaseUrl: environmentConfig.apiBaseUrl || ''
      };
      config.projectId = process.env.CYPRESS_PROJECT_ID || config.projectId;

      await addCucumberPreprocessorPlugin(fixedOn, config);

      fixedOn(
        'file:preprocessor',
        createBundler({
          plugins: [createEsbuildPlugin(config)]
        })
      );

      fixedOn('task', {
        /**
         * Writes a test diagnostic to the terminal and resolves with null.
         * @param {string} message Sanitized message; never pass secrets.
         * @returns {null} Cypress tasks must not resolve to undefined.
         */
        log(message) {
          console.log(`[test] ${message}`);
          return null;
        },

        /**
         * Returns an allow-listed secret without placing all secrets in the
         * browser's public Cypress configuration.
         * @param {string} name TEST_USERNAME or TEST_PASSWORD.
         * @returns {string} Secret value loaded from .env or the OS.
         */
        getSecret(name) {
          const allowed = ['TEST_USERNAME', 'TEST_PASSWORD'];
          if (!allowed.includes(name)) {
            throw new Error(`Secret '${name}' is not allow-listed.`);
          }
          const value = process.env[`CYPRESS_${name}`];
          if (!value) {
            throw new Error(`Required secret CYPRESS_${name} is not configured.`);
          }
          return value;
        }
      });

      allureCypress(fixedOn, config, {
        resultsDir: 'reports/allure-results',
        videoOnFailOnly: true
      });

      fixedOn('after:run', async () => {
        if (process.env.SKIP_HTML_REPORT !== 'true') {
          await generateCucumberReport({ silentIfMissing: true });
        }
      });

      return config;
    }
  }
});
