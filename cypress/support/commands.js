const { PageRegistry } = require('./pages/page-registry');
const { ElementActions } = require('./actions/element-actions');
const { InputActions } = require('./actions/input-actions');
const { NavigationActions } = require('./actions/navigation-actions');
const { KeyboardMouseActions } = require('./actions/keyboard-mouse-actions');
const { TableActions } = require('./actions/table-actions');
const { AssertionActions } = require('./actions/assertion-actions');
const { WaitActions } = require('./actions/wait-actions');
const { SessionManager } = require('./services/session-manager');

/**
 * Resolves the owner once for public custom-command wrappers.
 * @param {string} ownerName Registered page/component name.
 * @returns {import('./pages/base-page').BasePage} Resolved object.
 */
function owner(ownerName) {
  return PageRegistry.get(ownerName);
}

Cypress.Commands.add('uiClick', (ownerName, elementName, options = {}) =>
  ElementActions.click(owner(ownerName), elementName, options)
);
Cypress.Commands.add('uiForceClick', (ownerName, elementName, options = {}) =>
  ElementActions.forceClick(owner(ownerName), elementName, options)
);
Cypress.Commands.add('uiDoubleClick', (ownerName, elementName, options = {}) =>
  ElementActions.doubleClick(owner(ownerName), elementName, options)
);
Cypress.Commands.add('uiType', (ownerName, elementName, value, options = {}) =>
  InputActions.type(owner(ownerName), elementName, value, options)
);
Cypress.Commands.add('uiClear', (ownerName, elementName, options = {}) =>
  InputActions.clear(owner(ownerName), elementName, options)
);
Cypress.Commands.add('uiSelect', (ownerName, elementName, option, options = {}) =>
  InputActions.selectDropdown(owner(ownerName), elementName, option, options)
);
Cypress.Commands.add('uiCheck', (ownerName, elementName, value = {}) =>
  ElementActions.select(owner(ownerName), elementName, value)
);
Cypress.Commands.add('uiUncheck', (ownerName, elementName, options = {}) =>
  ElementActions.unselect(owner(ownerName), elementName, options)
);
Cypress.Commands.add('uiScrollTo', (ownerName, elementName, options = {}) =>
  ElementActions.scrollIntoView(owner(ownerName), elementName, options)
);
Cypress.Commands.add('uiKeys', (ownerName, elementName, keys, options = {}) =>
  KeyboardMouseActions.keys(owner(ownerName), elementName, keys, options)
);
Cypress.Commands.add('uiHover', (ownerName, elementName, options = {}) =>
  KeyboardMouseActions.hover(owner(ownerName), elementName, options)
);
Cypress.Commands.add('uiMouse', (ownerName, elementName, eventName, options = {}) =>
  KeyboardMouseActions.mouse(owner(ownerName), elementName, eventName, options)
);
Cypress.Commands.add('uiTableRowContains', (ownerName, tableName, row, expected) =>
  TableActions.rowShouldContain(owner(ownerName), tableName, row, expected)
);
Cypress.Commands.add('uiShouldHaveText', (ownerName, elementName, expected) =>
  AssertionActions.shouldHaveText(owner(ownerName), elementName, expected)
);
Cypress.Commands.add('uiShouldBeChecked', (ownerName, elementName) =>
  AssertionActions.shouldBeChecked(owner(ownerName), elementName)
);
Cypress.Commands.add('uiShouldHaveValue', (ownerName, elementName, expected) =>
  AssertionActions.shouldHaveValue(owner(ownerName), elementName, expected)
);
Cypress.Commands.add('uiWaitUntilEnabled', (ownerName, elementName, timeout) =>
  WaitActions.untilEnabled(owner(ownerName), elementName, timeout)
);
Cypress.Commands.add('refreshPage', (force = false, options = {}) =>
  NavigationActions.refresh(force, options)
);
Cypress.Commands.add('cacheSession', (id, setup, validate, acrossSpecs = true) =>
  SessionManager.cache(id, setup, validate, acrossSpecs)
);
