const { getRequiredValue } = require('../utils/object-utils');

/**
 * Reusable API response assertions. Validators accept a resolved response so
 * multiple contract checks can run inside one ApiClient response callback.
 */
class ApiResponseValidator {
  /**
   * Verifies the HTTP status code.
   * @param {Cypress.Response<unknown>} response Cypress response object.
   * @param {number} expectedStatus Expected HTTP status.
   * @returns {Cypress.Response<unknown>} Original response for further checks.
   */
  static status(response, expectedStatus) {
    expect(response.status, 'HTTP status').to.equal(expectedStatus);
    return response;
  }

  /**
   * Verifies a response header contains an expected value.
   * @param {Cypress.Response<unknown>} response Cypress response object.
   * @param {string} headerName Case-insensitive header name.
   * @param {string} expectedValue Expected header content.
   * @returns {Cypress.Response<unknown>} Original response for further checks.
   */
  static headerContains(response, headerName, expectedValue) {
    const headers = Object.fromEntries(
      Object.entries(response.headers).map(([key, value]) => [key.toLowerCase(), value])
    );
    expect(String(headers[headerName.toLowerCase()]), `header ${headerName}`).to.contain(
      expectedValue
    );
    return response;
  }

  /**
   * Verifies a dot-delimited body property equals an expected value.
   * @param {Cypress.Response<unknown>} response Cypress response object.
   * @param {string} propertyPath Body path such as data.user.id.
   * @param {*} expectedValue Expected property value.
   * @returns {Cypress.Response<unknown>} Original response for further checks.
   */
  static bodyProperty(response, propertyPath, expectedValue) {
    expect(
      getRequiredValue(response.body, propertyPath),
      `response body property ${propertyPath}`
    ).to.deep.equal(expectedValue);
    return response;
  }

  /**
   * Verifies required dot-delimited properties exist in the response body.
   * @param {Cypress.Response<unknown>} response Cypress response object.
   * @param {string[]} propertyPaths Required body paths.
   * @returns {Cypress.Response<unknown>} Original response for further checks.
   */
  static requiredBodyProperties(response, propertyPaths) {
    for (const propertyPath of propertyPaths) {
      getRequiredValue(response.body, propertyPath);
    }
    return response;
  }

  /**
   * Verifies response time is below an explicit service-level threshold.
   * @param {Cypress.Response<unknown>} response Cypress response object.
   * @param {number} maximumMilliseconds Maximum acceptable duration.
   * @returns {Cypress.Response<unknown>} Original response for further checks.
   */
  static durationBelow(response, maximumMilliseconds) {
    expect(response.duration, 'response duration').to.be.lessThan(maximumMilliseconds);
    return response;
  }
}

module.exports = { ApiResponseValidator };
