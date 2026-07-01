const { When } = require('@badeball/cypress-cucumber-preprocessor');
const {
  ErrorSimulationService
} = require('../../support/services/error-simulation-service');
const { NavigationActions } = require('../../support/actions/navigation-actions');

When('I enable error simulation {string} and refresh', (simulationName) => {
  ErrorSimulationService.enable(simulationName);
  NavigationActions.refresh();
});
