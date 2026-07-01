const commonData = require('../../test-data/common.json');
const theInternetData = require('../../test-data/pages/the-internet.json');
const devData = require('../../test-data/environments/dev.json');
const { deepMerge, getRequiredValue } = require('../utils/object-utils');

const environmentData = {
  dev: devData
};

/**
 * Provides one immutable-style access point for shared and environment data.
 * New environments are registered once in environmentData, while consumers
 * continue to use stable dot-delimited keys.
 */
class DataRepository {
  /**
   * Returns the merged data object for the active Cypress environment.
   * @returns {object} Common data overlaid with environment-specific values.
   */
  static all() {
    const environment = Cypress.expose('environment') || 'dev';
    const override = environmentData[environment];

    if (!override) {
      throw new Error(
        `Test data for environment '${environment}' is not registered.`
      );
    }

    return deepMerge(deepMerge(commonData, theInternetData), override);
  }

  /**
   * Resolves a required value from the merged active-environment data.
   * @param {string} keyPath Dot path such as sites.exampleCom.url.
   * @returns {*} The stored value.
   */
  static get(keyPath) {
    return getRequiredValue(DataRepository.all(), keyPath);
  }
}

module.exports = { DataRepository };
