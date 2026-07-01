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
  support/components/           Reusable component objects and their locators
  support/core/                 Locator resolution and report logging
  support/data/                 Test-data and secret access
  support/pages/                Page objects and their locators
  support/services/             Sessions, errors, and cross-origin workflows
  test-data/environments/       Environment-specific value overrides
  test-data/common.json         Shared inputs and expected values
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
