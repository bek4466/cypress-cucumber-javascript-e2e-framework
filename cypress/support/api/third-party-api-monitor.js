const { ApiClient } = require('./api-client');
const { compareApiContract } = require('./api-contract-diagnostics');
const { StepLogger } = require('../core/step-logger');
const { UrlUtils } = require('../utils/url-utils');

/**
 * Executes and validates calls made to dependent applications. HTTP status
 * failures are captured as structured Cucumber/Allure evidence before the
 * scenario fails, which makes permission drift and contract drift visible.
 */
class ThirdPartyApiMonitor {
  /**
   * @param {object} options Monitored request settings.
   * @param {string} options.name Human-readable dependency/call name.
   * @param {string} options.path Endpoint path or absolute URL.
   * @param {string} [options.method='GET'] HTTP method.
   * @param {string} [options.baseUrl] Third-party base URL.
   * @param {object} [options.headers] Request headers; never written to evidence.
   * @param {*} [options.body] Optional request body.
   * @param {object} options.contract Expected response contract.
   * @returns {Cypress.Chainable<Cypress.Response<unknown>>} Validated response.
   */
  static verify({
    name,
    path,
    method = 'GET',
    baseUrl = '',
    headers = {},
    body,
    contract
  }) {
    const url = UrlUtils.resolve(baseUrl, path);
    return ApiClient.request({
      path,
      baseUrl,
      method,
      headers,
      body,
      failOnStatusCode: false
    }).then((response) => {
      const comparison = compareApiContract({ name, method, url, response, contract });
      if (!comparison.passed) {
        return StepLogger.attachJson(
          comparison.diagnostic,
          'third-party-api-failure.json'
        ).then(() => {
          throw new Error(comparison.summary);
        });
      }
      StepLogger.action(comparison.summary);
      return response;
    });
  }
}

module.exports = { ThirdPartyApiMonitor };
