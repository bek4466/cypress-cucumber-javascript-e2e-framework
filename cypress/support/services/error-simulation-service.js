const { DataRepository } = require('../data/data-repository');
const { StepLogger } = require('../core/step-logger');

/**
 * Creates named network failures before the triggering UI action occurs.
 * Intercepts must be registered outside cy.origin because Cypress forbids
 * cy.intercept inside origin callbacks.
 */
class ErrorSimulationService {
  /**
   * Registers a static error response stored in centralized test data.
   * @param {string} simulationName Key under errors in test data.
   * @param {string} alias Cypress alias used by optional wait assertions.
   * @returns {Cypress.Chainable<null>} Intercept registration chain.
   */
  static enable(simulationName, alias = simulationName) {
    const simulation = DataRepository.get(`errors.${simulationName}`);
    StepLogger.action(`Enable error simulation '${simulationName}'`);

    return cy
      .intercept(simulation.method, simulation.urlPattern, {
        statusCode: simulation.statusCode,
        body: simulation.body,
        headers: {
          'content-type': 'text/plain; charset=utf-8'
        }
      })
      .as(alias);
  }

  /**
   * Registers a forced network disconnect for a method and URL matcher.
   * @param {string} method HTTP method.
   * @param {string|RegExp} urlPattern Cypress URL matcher.
   * @param {string} alias Cypress alias.
   * @returns {Cypress.Chainable<null>} Intercept registration chain.
   */
  static forceNetworkError(method, urlPattern, alias = 'networkError') {
    StepLogger.action(`Enable forced network error '${alias}'`);
    return cy
      .intercept(method, urlPattern, { forceNetworkError: true })
      .as(alias);
  }
}

module.exports = { ErrorSimulationService };
