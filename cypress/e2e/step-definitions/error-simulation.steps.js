const { When } = require('@badeball/cypress-cucumber-preprocessor');
const {
  ErrorSimulationService
} = require('../../support/services/error-simulation-service');
const { NavigationActions } = require('../../support/actions/navigation-actions');

/**
 * Registers a named HTTP error response and reloads the current page so the
 * application receives that response. Simulation details come from test data.
 * @param {string} simulationName Key under the centralized errors data object.
 */
When('I enable error simulation {string} and refresh', (simulationName) => {
  ErrorSimulationService.enable(simulationName);
  NavigationActions.refresh();
});
