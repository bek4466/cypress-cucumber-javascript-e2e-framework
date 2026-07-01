const { ExamplePage } = require('./example-page');
const { CommonComponent } = require('../components/common-component');

const owners = Object.freeze({
  example: new ExamplePage(),
  common: new CommonComponent()
});

/**
 * Resolves page and component objects by stable logical name.
 */
class PageRegistry {
  /**
   * @param {string} name Registered page or component name.
   * @returns {import('./base-page').BasePage} Page/component instance.
   */
  static get(name) {
    const owner = owners[name];
    if (!owner) {
      throw new Error(
        `Page or component '${name}' is not registered. Available: ${Object.keys(owners).join(', ')}`
      );
    }
    return owner;
  }
}

module.exports = { PageRegistry };
