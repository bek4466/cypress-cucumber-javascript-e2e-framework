const { StepLogger } = require('../core/step-logger');
const { UrlUtils } = require('../utils/url-utils');

/**
 * Reusable cy.request façade for future API tests. It centralizes base URL,
 * headers, failure behavior, and sanitized reporting without prescribing an
 * application-specific authentication scheme.
 */
class ApiClient {
  /**
   * Sends an HTTP request to the configured test API.
   * @param {object} options Request settings.
   * @param {string} options.path Relative endpoint path or absolute URL.
   * @param {string} [options.method='GET'] HTTP method.
   * @param {string} [options.baseUrl] Override for exposed apiBaseUrl.
   * @param {object} [options.headers={}] Request headers.
   * @param {*} [options.body] Serializable request body.
   * @param {object} [options.qs] Query-string values.
   * @param {boolean} [options.failOnStatusCode=true] Cypress failure behavior.
   * @returns {Cypress.Chainable<Cypress.Response<unknown>>} Response chain.
   */
  static request({
    path,
    method = 'GET',
    baseUrl = Cypress.expose('apiBaseUrl'),
    headers = {},
    body,
    qs,
    failOnStatusCode = true
  }) {
    const url = UrlUtils.resolve(baseUrl, path);
    StepLogger.action(`${method.toUpperCase()} ${url}`);

    return cy.request({
      method,
      url,
      headers,
      body,
      qs,
      failOnStatusCode,
      log: false
    });
  }

  /**
   * Sends a GET request.
   * @param {string} path Endpoint path.
   * @param {object} options Additional request options.
   * @returns {Cypress.Chainable<Cypress.Response<unknown>>} Response chain.
   */
  static get(path, options = {}) {
    return ApiClient.request({ ...options, method: 'GET', path });
  }

  /**
   * Sends a POST request with a request body.
   * @param {string} path Endpoint path.
   * @param {*} body Serializable request body.
   * @param {object} options Additional request options.
   * @returns {Cypress.Chainable<Cypress.Response<unknown>>} Response chain.
   */
  static post(path, body, options = {}) {
    return ApiClient.request({ ...options, method: 'POST', path, body });
  }

  /**
   * Sends a PUT request with a request body.
   * @param {string} path Endpoint path.
   * @param {*} body Serializable request body.
   * @param {object} options Additional request options.
   * @returns {Cypress.Chainable<Cypress.Response<unknown>>} Response chain.
   */
  static put(path, body, options = {}) {
    return ApiClient.request({ ...options, method: 'PUT', path, body });
  }

  /**
   * Sends a PATCH request with a request body.
   * @param {string} path Endpoint path.
   * @param {*} body Serializable request body.
   * @param {object} options Additional request options.
   * @returns {Cypress.Chainable<Cypress.Response<unknown>>} Response chain.
   */
  static patch(path, body, options = {}) {
    return ApiClient.request({ ...options, method: 'PATCH', path, body });
  }

  /**
   * Sends a DELETE request.
   * @param {string} path Endpoint path.
   * @param {object} options Additional request options.
   * @returns {Cypress.Chainable<Cypress.Response<unknown>>} Response chain.
   */
  static delete(path, options = {}) {
    return ApiClient.request({ ...options, method: 'DELETE', path });
  }
}

module.exports = { ApiClient };
