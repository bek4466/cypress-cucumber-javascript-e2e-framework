# Cypress Cucumber JavaScript E2E Framework

A scalable end-to-end automation framework built with Cypress, Cucumber/Gherkin, JavaScript, Node.js, and npm. It provides centralized page objects, reusable actions, environment-aware test data, multi-domain workflows, session caching, error simulation, Cucumber HTML reporting, and Allure reporting.

## Supported baseline

- Windows 10 or Windows 11
- Node.js `24.18.0` LTS (Node 24.x is required)
- npm 11 or newer
- Cypress `15.17.0`
- Chrome, Edge, or Cypress Electron
- Java 11 or newer only when generating/opening Allure reports

Cypress is intentionally pinned to 15.17.0 because it is the newest version currently accepted by the Cucumber preprocessor 25.0.0 peer dependency. `package-lock.json` pins the complete dependency tree.

## Run The Internet test suite

The automated suite for [The Internet](https://the-internet.herokuapp.com/) is tagged `@the-internet` and covers valid/invalid authentication, checkboxes, dropdowns, sortable-table records, and asynchronous dynamic controls.

After completing the Windows setup below, run all new scenarios headlessly:

```powershell
npm run test:the-internet
```

Run all new scenarios with a visible browser:

```powershell
npm run test:the-internet:headed
```

Develop or debug one feature in the Cypress GUI:

```powershell
npm run cy:open
```

Then select **E2E Testing**, choose a browser, and open a feature under `cypress/e2e/features/the-internet`.

Run one feature directly when troubleshooting:

```powershell
npx cypress run --headed --browser chrome --spec "cypress/e2e/features/the-internet/authentication.feature"
```

The Internet implementation is organized here:

- page objects and locators: `cypress/support/pages/the-internet-*.js`;
- feature files: `cypress/e2e/features/the-internet`;
- documented step definitions: `cypress/e2e/step-definitions/the-internet.steps.js`;
- shared data and expected values: `cypress/test-data/pages/the-internet.json`;
- reusable waits, actions, assertions, and utilities: `cypress/support/actions` and `cypress/support/utils`.

## Windows setup

1. Install [Node.js 24 LTS](https://nodejs.org/) or use an equivalent Windows Node version manager.
2. Install Java 11+ if Allure reporting will be used.
3. Clone the repository and open PowerShell in its directory:

   ```powershell
   git clone https://github.com/bek4466/cypress-cucumber-javascript-e2e-framework.git
   Set-Location cypress-cucumber-javascript-e2e-framework
   ```

4. Confirm the supported runtime:

   ```powershell
   node --version
   npm --version
   ```

5. Install the exact locked dependencies:

   ```powershell
   npm ci
   ```

6. Create the local environment file. It is ignored by Git:

   ```powershell
   Copy-Item .env.example .env
   ```

7. Run the smoke suite:

   ```powershell
   npm test
   ```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run cy:open` | Open the interactive Cypress runner. |
| `npm test` | Run scenarios tagged `@smoke`. |
| `npm run test:all` | Run every feature. |
| `npm run test:regression` | Run scenarios tagged `@regression`. |
| `npm run test:the-internet` | Run every The Internet scenario headlessly. |
| `npm run test:the-internet:headed` | Run every The Internet scenario with a visible browser. |
| `npm run test:headed` | Run all tests with a visible browser. |
| `npm run test:chrome` | Run all tests in Chrome. |
| `npm run test:record` | Record a run in Cypress Cloud. |
| `npm run test:parallel` | Use Cypress Cloud parallel orchestration. |
| `npm run clean:reports` | Remove reports, screenshots, videos, and downloads using a Windows-safe Node script. |
| `npm run report:cucumber` | Regenerate the primary HTML report from Cucumber JSON. |
| `npm run report:allure` | Generate the secondary Allure HTML report. |
| `npm run report:allure:open` | Start the local Allure report server. |
| `npm run lint` | Run static JavaScript checks. |
| `npm run verify` | Run lint and the smoke suite. |

## Detailed test authoring and execution guide

### Run tests locally

Always open PowerShell in the repository root, where `package.json` and `cypress.config.js` are located. Install dependencies once after cloning, and again whenever `package-lock.json` changes:

```powershell
npm ci
```

Run Cypress interactively when developing or debugging a scenario:

```powershell
npm run cy:open
```

In the Cypress window:

1. Select **E2E Testing**.
2. Select Electron, Chrome, or Edge.
3. Click the required `.feature` file.
4. Use the command log to inspect each Gherkin step and Cypress action.

Run tests from PowerShell when validating the suite:

```powershell
# Smoke tests in the default headless browser
npm test

# Every feature in headless mode
npm run test:all

# Every feature with a visible browser
npm run test:headed

# Regression-tagged scenarios
npm run test:regression

# A specific feature file
npx cypress run --spec "cypress/e2e/features/example-site.feature"

# A specific feature with a visible Chrome browser
npx cypress run --headed --browser chrome --spec "cypress/e2e/features/example-site.feature"

# A Cucumber tag expression
npx cypress run --env tags="@smoke and not @wip"
```

Select a configured environment by passing its logical name. A matching file must exist under `cypress/config/environments` and `cypress/test-data/environments`:

```powershell
npx cypress run --env environment=dev
```

After a run, open `reports/cucumber-html/index.html` in a browser. Generate the optional Allure comparison report after test results exist:

```powershell
npm run report:allure
npm run report:allure:open
```

When troubleshooting, clean generated artifacts and rerun only the failing feature:

```powershell
npm run clean:reports
npx cypress run --headed --spec "cypress/e2e/features/example-site.feature"
```

### Create a new page object model

Create one page object per application page or cohesive screen. For example, create `cypress/support/pages/login-page.js`:

```javascript
const { BasePage } = require('./base-page');

/**
 * Page object for login-screen elements.
 */
class LoginPage extends BasePage {
  constructor() {
    super('login', {
      usernameInput: '[data-testid="username"]',
      passwordInput: '[data-testid="password"]',
      loginButton: '[data-testid="login-button"]',
      errorMessage: '[data-testid="login-error"]'
    });
  }
}

module.exports = { LoginPage };
```

The first `super` argument, `login`, is the stable name used by Cucumber steps. The object maps logical element names to selectors. Do not place test data, credentials, Cypress actions, or assertions in the locator map.

Register the new page once in `cypress/support/pages/page-registry.js`:

```javascript
const { LoginPage } = require('./login-page');

const owners = Object.freeze({
  example: new ExamplePage(),
  common: new CommonComponent(),
  login: new LoginPage()
});
```

The page can then be resolved anywhere through `PageRegistry.get('login')`, or referenced from existing generic Cucumber steps:

```gherkin
When I click element "loginButton" on page "login"
Then element "errorMessage" on page "login" should be visible
```

Create a component under `cypress/support/components` instead when the same UI unit—such as a header, modal, table, or navigation menu—is reused by several pages. Register components in the same registry.

### Add or change a locator

Find the owning page/component and add the locator to its `super` map:

```javascript
super('login', {
  usernameInput: '[data-testid="username"]',
  passwordInput: '[data-testid="password"]',
  loginButton: '[data-testid="login-button"]',
  forgotPasswordLink: '[data-testid="forgot-password"]'
});
```

Use this selector priority:

1. dedicated `data-testid` or `data-cy` attribute;
2. stable accessible attribute such as `name` or `aria-label`;
3. stable element ID;
4. CSS structure only when no stable test attribute exists.

Avoid positional selectors, generated classes, long CSS chains, and visible text as locators. If an existing selector changes, update only its value while keeping the logical name stable. All actions and scenarios using that name will receive the new selector automatically.

Validate a new or modified locator through a focused feature step:

```gherkin
Then element "forgotPasswordLink" on page "login" should be visible
```

### Add test data and expected values

Add shared inputs and expected results to `cypress/test-data/common.json`:

```json
{
  "login": {
    "invalidUsername": "invalid-user",
    "expectedError": "Username or password is incorrect"
  }
}
```

Read them using dot-delimited keys:

```javascript
DataRepository.get('login.expectedError');
```

Or use the reusable Cucumber syntax:

```gherkin
When I type data "login.invalidUsername" into element "usernameInput" on page "login"
Then element "errorMessage" on page "login" should equal data "login.expectedError"
```

Place only changed environment values in `cypress/test-data/environments/<environment>.json`. Never duplicate the complete common data file. URLs and domain names belong in `cypress/config/environments/<environment>.json`; secrets belong in the ignored `.env` file.

### Add or modify a Cucumber step definition

First search `cypress/e2e/step-definitions` for an existing step. Reuse it when possible. If the behavior is new, add a focused parameterized definition to the appropriate `.steps.js` file:

```javascript
/**
 * Clicks a registered page element and verifies the destination URL.
 * @param {string} element Logical locator name.
 * @param {string} page Registered page/component name.
 * @param {string} urlPart Expected URL fragment.
 */
When(
  'I click element {string} on page {string} and URL should include {string}',
  (element, page, urlPart) => {
    ElementActions.click(PageRegistry.get(page), element);
    cy.url().should('include', urlPart);
  }
);
```

Keep selectors out of step definitions, resolve shared values through `DataRepository`, and delegate repeatable browser behavior to an action/service class. Every new step should include JSDoc describing its intent and parameters. Run the feature to detect undefined or ambiguous Cucumber expressions.

### Modify an existing custom function

Reusable behavior has three layers:

1. `cypress/support/actions` or `cypress/support/services` contains the implementation.
2. `cypress/support/commands.js` exposes optional `cy.*` wrappers.
3. `cypress/e2e/step-definitions` exposes business-readable Gherkin steps.

Locate all consumers before changing a function. In PowerShell, use VS Code global search or:

```powershell
rg "ElementActions.click|uiClick" cypress
```

If the function signature remains unchanged, modify only the implementation. For example, to center elements before every normal click while still allowing callers to override the option, update `ElementActions.click` in `cypress/support/actions/element-actions.js`:

```javascript
static click(owner, elementName, options = {}) {
  StepLogger.action(`Click ${owner.name}.${elementName}`);
  return owner
    .element(elementName)
    .should('be.visible')
    .and('not.be.disabled')
    .click({ scrollBehavior: 'center', ...options });
}
```

That change automatically affects Cucumber click steps and `cy.uiClick` because both delegate to the action. If parameters are added, removed, or reordered, update the action JSDoc, its command wrapper in `commands.js`, every related step definition, and all direct callers.

When adding a completely new reusable function:

1. place it in the most relevant action/service class;
2. add JSDoc with purpose, parameters, return value, and constraints;
3. add a command wrapper only if direct test usage is useful;
4. add a Cucumber step only when it expresses meaningful scenario behavior;
5. avoid copying selectors or Cypress chains between files;
6. run lint and the smallest affected feature before the complete smoke suite.

```powershell
npm run lint
npx cypress run --spec "cypress/e2e/features/affected-feature.feature"
npm test
```

## Environment configuration

`.env.example` is the committed template. Copy it to `.env`; never commit `.env` or real secrets.

```text
CYPRESS_environment=dev
CYPRESS_TEST_USERNAME=
CYPRESS_TEST_PASSWORD=
CYPRESS_video=false
```

Public URLs and domain configuration are stored in `cypress/config/environments/<environment>.json`. Comparison values and reusable input data are stored under `cypress/test-data`. `DataRepository.get('dot.delimited.key')` merges common data with the active environment override.

Credentials remain in the Node process. Retrieve an allow-listed value only when needed:

```javascript
const { SecretRepository } = require('../support/data/secret-repository');

SecretRepository.get('TEST_USERNAME').then((username) => {
  // Use the value with { log: false } for authentication.
});
```

Add any new secret to the allow-list in `cypress.config.js`; do not place secrets in page objects, feature files, fixtures, logs, screenshots, or committed configuration.

## Project organization

```text
cypress/
  config/environments/          Public URL and domain configuration
  e2e/features/                 Business-readable Gherkin features
  e2e/step-definitions/         Editable Cucumber step definitions
  support/actions/              Reusable UI, navigation, table, mouse, and keyboard actions
  support/api/                  Reusable API request and response-validation foundation
  support/components/           Reusable component objects and their locators
  support/core/                 Locator resolution and report logging
  support/data/                 Test-data and secret access
  support/pages/                Page objects and their locators
  support/services/             Sessions, errors, and cross-origin workflows
  test-data/environments/       Environment-specific value overrides
  test-data/pages/              Application-specific shared data and expected values
  test-data/common.json         Shared inputs and expected values
  templates/api/                Non-executing API feature, steps, and data templates
scripts/                        Windows-safe cleanup/report scripts
reports/                        Generated output; ignored by Git
```

## Page and component objects

Locators belong only in their page or component object. Step definitions and features use logical names, never raw selectors.

```javascript
class LoginPage extends BasePage {
  constructor() {
    super('login', {
      username: '[data-testid="username"]',
      password: '[data-testid="password"]',
      submit: '[data-testid="login-submit"]'
    });
  }
}
```

Register each new object once in `cypress/support/pages/page-registry.js`. Prefer stable `data-testid`/`data-cy` attributes over CSS structure or visible text. Create a component object when the same UI unit is reused on several pages.

## Reusable actions and custom commands

The action layer centralizes Cypress behavior and readiness checks. Existing wrappers cover:

- normal, forced, and double clicks;
- type, replace, and clear;
- native dropdown selection;
- checkbox/radio select and unselect;
- refresh, forced refresh, back, and forward;
- scroll to element;
- hover and low-level mouse events;
- Cypress keyboard sequences;
- table row/content and row-count checks;
- text and visibility assertions;
- cached sessions and in-memory tokens.

Use an action class inside step definitions, or the public commands such as `cy.uiClick('login', 'submit')`, `cy.uiType(...)`, `cy.refreshPage()`, and `cy.cacheSession(...)`. Add behavior to the relevant action class instead of duplicating Cypress command chains in pages or steps.

## Cucumber conventions

Features live under `cypress/e2e/features`, and step definitions are discovered dynamically from `cypress/e2e/step-definitions/**/*.js`. Steps receive logical page, element, and data keys, which keeps them reusable while leaving the Gherkin readable.

Do not create a single universal step that interprets arbitrary instructions. Add focused parameterized steps to the appropriate definition file. This keeps failures searchable and prevents ambiguous step matches.

Run tags from PowerShell:

```powershell
npx cypress run --env tags="@smoke and not @wip"
```

## Multiple domains in one scenario

`OriginService` wraps `cy.origin()` with closure-free callbacks. Page-object selectors and test data are reduced to serializable strings before entering the secondary origin. This supports workflows that visit domain A, interact with domain B, and then interact with domain C during one scenario.

```javascript
OriginService.visitAndAssertText(
  DataRepository.get('sites.exampleOrg.url'),
  PageRegistry.get('example').selector('heading'),
  DataRepository.get('sites.exampleOrg.heading')
);
```

Important constraints:

- The target must include the exact scheme, host, and port.
- Values crossing the boundary must be serializable.
- Keep `cy.origin()` calls at the test/step level; they cannot be nested.
- `cy.intercept()` and `cy.session()` must be configured outside an origin callback.
- Cypress controls one browser tab; remove `target="_blank"` when a workflow would otherwise open another tab.

## Session and token reuse

`SessionManager.cache()` wraps `cy.session()` and requires a validation callback so expired sessions are rebuilt. `cacheAcrossSpecs` defaults to `true` for future large suites.

```javascript
SessionManager.cache(
  ['standard-user', Cypress.expose('environment')],
  () => {
    // Perform UI or API login and populate cookies/storage.
  },
  () => {
    cy.request('/api/session').its('status').should('eq', 200);
  }
);
```

`SessionManager.setToken/getToken` uses an in-memory `Map`; tokens are not written to fixtures or reports. Never include passwords or tokens in the session ID, Cucumber logs, or attachment names.

## Error simulation

Named simulations are stored under `errors` in centralized test data. Register the intercept before the action that triggers the failure:

```gherkin
Given I open data URL "sites.exampleCom.url"
When I enable error simulation "serviceUnavailable" and refresh
Then element "body" on page "example" should contain data "errors.serviceUnavailable.expectedMessage"
```

Use `ErrorSimulationService.forceNetworkError()` for a dropped connection. Register intercepts outside `cy.origin()`.

## API testing templates

The framework includes an API foundation for future service testing without enabling a placeholder external dependency:

- `cypress/support/api/api-client.js` wraps `cy.request()` for GET, POST, PUT, PATCH, DELETE, headers, query parameters, bodies, and negative status handling;
- `cypress/support/api/api-response-validator.js` validates status, headers, body properties, required fields, and response duration;
- `cypress/support/utils/url-utils.js` resolves endpoint paths safely;
- `cypress/templates/api` contains annotated feature, step-definition, and data templates.

The `.template` extensions prevent Cypress from discovering unfinished examples. To activate API coverage:

1. Add an approved non-production API URL to the active environment file:

   ```json
   {
     "apiBaseUrl": "https://api.test.example.com"
   }
   ```

2. Copy and rename the templates:

   ```powershell
   New-Item -ItemType Directory -Force cypress/e2e/features/api
   Copy-Item cypress/templates/api/example-api.feature.template cypress/e2e/features/api/example-api.feature
   Copy-Item cypress/templates/api/example-api.steps.js.template cypress/e2e/step-definitions/example-api.steps.js
   Copy-Item cypress/templates/api/example-api-data.json.template cypress/test-data/pages/example-api.json
   ```

3. Replace the sample endpoint, response contract, and payloads. Register the copied data file in `DataRepository` if its values will be referenced by steps.
4. Retrieve tokens or credentials through `SecretRepository`; never commit them or write them to reports.
5. Run the API tag:

   ```powershell
   npx cypress run --env tags="@api"
   ```

Example direct API validation:

```javascript
ApiClient.get('/resources/1').then((response) => {
  ApiResponseValidator.status(response, 200);
  ApiResponseValidator.requiredBodyProperties(response, ['id', 'name']);
  ApiResponseValidator.durationBelow(response, 2000);
});
```

Set `failOnStatusCode: false` when intentionally validating 4xx or 5xx responses. The client suppresses raw `cy.request` logging by default so authorization headers and payload details are not accidentally printed; add only sanitized diagnostics through `StepLogger`.

## Reporting and artifacts

The primary report is Multiple Cucumber HTML Reporter:

- JSON: `reports/cucumber-json/cucumber-report.json`
- HTML: `reports/cucumber-html/index.html`
- Cucumber messages: `reports/cucumber-messages/messages.ndjson`

The report is generated automatically after a run. Cucumber records every Gherkin step and framework actions add readable logs. The preprocessor is configured to attach screenshots and videos. Cypress automatically captures failure screenshots during headless runs.

Allure is configured as a secondary comparison report:

- Results: `reports/allure-results`
- Generated report: `reports/allure-report`

After running tests:

```powershell
npm run report:allure
npm run report:allure:open
```

Set `CYPRESS_video=true` in `.env` to enable local video recording. Videos are disabled by default to reduce runtime and disk use. Cypress Cloud recording is separate and occurs only with `--record` plus a valid project ID and record key.

## Parallel execution

`npm run test:parallel` is ready for future Cypress Cloud orchestration. Native Cypress parallelization requires:

1. a Cypress Cloud project ID;
2. a valid record key supplied securely;
3. `--record --parallel`;
4. two or more execution machines for useful distribution;
5. independent feature/spec files with no ordering dependency.

Parallelization is spec-file based. Tests must create their own state and must not depend on another scenario running first.

## Adding a new test area

1. Add stable locators to a new page/component object.
2. Register the object in `page-registry.js`.
3. Add shared values to `common.json`; override only changed values per environment.
4. Reuse an existing action; add a focused action only when the behavior is genuinely new.
5. Add or extend a focused step-definition file.
6. Add the feature and appropriate tags.
7. Run `npm run lint` and the relevant tagged suite.
8. Inspect the Cucumber HTML report and failure artifacts before committing.

All public framework methods use JSDoc notes describing their purpose, parameters, return values, and important constraints to make onboarding and review straightforward.
