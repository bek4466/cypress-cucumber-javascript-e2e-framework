# SDET Onboarding and Automation Checklist

This is the working guide for engineers who will create, review, run, and troubleshoot tests in this repository. Complete levels 0 through 10 in order during onboarding. The root `README.md` remains the quick-start page.

## Level 0: understand the test boundary

- Confirm the application, approved environments, test accounts, data ownership, and cleanup rules.
- Identify UI, first-party API, third-party API, IBM Db2, and Snowflake dependencies used by the scenario.
- Obtain explicit approval before running against production. Production database writes are blocked by the framework by default.
- Define the business outcome in plain language before choosing selectors or code structure.
- Never place credentials, tokens, connection strings, personal data, or raw authorization headers in Git, feature files, screenshots, or reporter logs.

Exit check: the engineer can name the scenario owner, environment, required data, expected result, and safe cleanup approach.

## Level 1: prepare Windows

1. Install Git, Node.js 24.18.0 LTS, npm 11+, and VS Code.
2. Install Java 11+ only if Allure HTML reports will be generated.
3. Clone the repository, then run:

   ```powershell
   node --version
   npm --version
   npm ci
   Copy-Item .env.example .env
   npm run lint
   npm run test:unit
   npm test
   ```

4. For `ibm_db`, Windows x64 normally uses IBM's precompiled binary. If native compilation is required, install Visual Studio 2022 Build Tools and Python 3.8+. IBM's CLI driver is installed with the package; corporate proxies may require `IBM_DB_HOME` or `IBM_DB_INSTALLER_URL`.
5. Keep `.env`, `node_modules`, reports, screenshots, videos, and downloads untracked. Verify with `git status --ignored` if uncertain.

Exit check: smoke tests pass, mock integration tests pass, and no secret/generated file appears in `git status`.

## Level 2: learn the codebase map

| Area | Responsibility |
| --- | --- |
| `cypress/e2e/features` | Gherkin business behavior and tags. No selectors or credentials. |
| `cypress/e2e/step-definitions` | Parameterized step adapters and reporting hooks. |
| `cypress/support/pages` | Page object models and each page's centralized locators. |
| `cypress/support/components` | Locators for UI shared by several pages. |
| `cypress/support/actions` | Reusable UI interactions and assertions. |
| `cypress/support/services` | Stateful workflows such as sessions, origins, and error simulation. |
| `cypress/support/api` | HTTP client, validators, and third-party contract diagnostics. |
| `cypress/support/database` | Private Node-side Db2/Snowflake clients, safety, config, and tasks. |
| `cypress/support/integrations` | External lifecycle integrations such as Jira Cloud. |
| `cypress/support/data` | Merged data access through `DataRepository`; secret access is separate. |
| `cypress/support/core` | Locator resolution and report logging. |
| `cypress/support/utils` | Small stateless helpers for objects, text, and URLs. |
| `cypress/config/environments` | Public endpoint configuration for dev, staging, and prod. |
| `cypress/test-data` | Shared and environment-specific non-secret expected values. |
| `cypress/templates` | Inactive examples that Cypress cannot accidentally discover. |
| `scripts` | Report generation, cleanup, and Jira CI update entry points. |
| `test` | Node mock tests for integrations without live external systems. |
| `ci` | Inactive GitLab and Docker templates. |
| `docs` | Onboarding, design review, diagrams, and database guidance. |

Dependency direction is feature -> step -> action/service -> page/data. Page objects provide locators; they do not contain assertions, data, or workflow logic.

## Level 3: design a scenario

- Write one observable business behavior per scenario.
- Use `Background` only for truly shared context; scenarios must remain independently runnable.
- Choose tags deliberately: `@smoke`, `@regression`, application tag, API tag, or an isolated diagnostic tag.
- Put input and expected values in JSON data, not repeated in Gherkin or steps.
- Determine whether cross-domain navigation requires `cy.origin`; reuse `OriginService` rather than relaxing `chromeWebSecurity`.
- Decide how created records will be unique and cleaned. Parallel runs must not share mutable test data.

Example:

```gherkin
@regression @account
Feature: Account access

  Scenario: An unauthorized account cannot open billing
    Given I am authenticated as data user "users.restricted"
    When I open the billing page
    Then the third-party entitlements response should match its contract
    And element "accessDenied" on page "billing" should equal data "billing.deniedMessage"
```

Every feature should start with comments explaining scope, data assumptions, and tags.

## Level 4: add data and environment configuration

- Add globally reusable values to `cypress/test-data/common.json`.
- Add application-focused values to `cypress/test-data/pages/<area>.json`, then register that file once in `DataRepository`.
- Add only overrides to `cypress/test-data/environments/dev.json`, `staging.json`, or `prod.json`.
- Add public URLs to matching files under `cypress/config/environments`.
- Add private values to `.env` locally and protected/masked variables in CI.
- Access normal data with `DataRepository.get('area.value')`; retrieve only allow-listed secrets through a Node task or `SecretRepository`.

JSON cannot contain comments, so use a `_notes` field when a configuration file needs onboarding context.

## Level 5: build a page object or component

Create `cypress/support/pages/billing-page.js`:

```javascript
const { BasePage } = require('./base-page');

/** Page object containing only stable billing-screen locators. */
class BillingPage extends BasePage {
  constructor() {
    super('billing', {
      invoiceTable: '[data-testid="invoice-table"]',
      accessDenied: '[data-testid="access-denied"]'
    });
  }
}

module.exports = { BillingPage };
```

Register it once in `cypress/support/pages/page-registry.js`. Use a component when the same header, modal, table, or control exists across pages.

Locator preference is test attribute, stable accessible attribute, stable ID, then concise CSS. Avoid generated classes, positions, long DOM chains, XPath, and visible text when a stable attribute can be added. To change an existing locator, preserve its logical key and update only the selector value.

## Level 6: reuse or extend behavior

Before adding code, search existing behavior:

```powershell
rg "click|selectDropdown|cacheSession" cypress/support cypress/e2e/step-definitions
```

Use these layers:

1. `actions`: generic element behavior such as click, type, wait, table assertion.
2. `services`: multi-step or stateful behavior such as login sessions or origin changes.
3. `commands.js`: short `cy.*` wrappers when command chaining improves readability.
4. step definitions: translate business wording into calls to the layers above.

Do not create a page-specific click method when `ElementActions.click(page, element)` already expresses the operation. When changing a public function, locate every consumer, preserve its signature when possible, add/update JSDoc (`@param`, `@returns`, constraints), run focused tests, then run lint and mock tests.

## Level 7: create dynamic step definitions

- Search for an equivalent expression before adding one; ambiguous steps stop the suite.
- Use `{string}` and other Cucumber parameters instead of hard-coded variants.
- Resolve page names through `PageRegistry`, locators through the page object, and expected values through `DataRepository`.
- Keep assertions close to the action/validator layer; do not duplicate selector logic.
- Document each definition and parameter with JSDoc.
- For errors that appear only after refresh, use `ErrorSimulationService` so intercept registration, refresh timing, and assertion remain reusable.

Example:

```javascript
/**
 * Selects data in a registered dropdown.
 * @param {string} dataKey Dot-delimited DataRepository key.
 * @param {string} element Logical locator name.
 * @param {string} page Registered page name.
 */
When('I select data {string} in {string} on page {string}', (dataKey, element, page) => {
  InputActions.selectDropdown(PageRegistry.get(page), element, DataRepository.get(dataKey));
});
```

## Level 8: add API and database checks

- Use `ApiClient` for ordinary first-party calls and `ApiResponseValidator` for focused assertions.
- Use `ThirdPartyApiMonitor.verify()` for permissions/contracts owned by another application. It disables automatic status failure, compares the agreed contract, redacts secrets, attaches response diagnostics, then fails with expected-versus-actual details.
- Use `cy.db2Query(sql, params)` or `cy.snowflakeQuery(sql, binds)`. Always bind external values; never concatenate them into SQL.
- Query the minimum columns/rows needed. Clean up test-owned rows in non-production environments.
- Production accepts only `SELECT`, `WITH`, `SHOW`, `DESCRIBE`, `DESC`, and `EXPLAIN` unless the explicit mutation switch is enabled. Treat the switch as break-glass, not normal configuration.
- See `database-integrations.md` for setup and examples.

### Run the database Cucumber examples

The repository includes real, opt-in examples—not only mocks:

- feature: `cypress/e2e/features/database/database-connections.feature`;
- steps: `cypress/e2e/step-definitions/database.steps.js`;
- queries/expected value: `cypress/test-data/database/health-checks.json`;
- private connection configuration: `.env` based on `.env.example`.

The feature is tagged `@database @requires-external-services`; its scenarios add `@db2` or `@snowflake`. Normal, headed, recorded, and parallel suites exclude the external-services tag so a new engineer cannot accidentally contact a database.

After selecting and configuring an approved environment, run:

```powershell
# IBM Db2 using DB2_DEV_CONNECTION_STRING
$env:CYPRESS_environment = "dev"
npm run test:database:db2

# Snowflake using the SNOWFLAKE_STAGING_* variables
$env:CYPRESS_environment = "staging"
npm run test:database:snowflake
```

For the IBM Db2 scenario, select exactly one endpoint profile. The framework resolves `DB2_<ENVIRONMENT>_<PROFILE>_CONNECTION_STRING`:

```powershell
# Local developer/on-premise endpoint -> DB2_DEV_LOCAL_CONNECTION_STRING
$env:CYPRESS_environment = "dev"
$env:DB2_CONNECTION_PROFILE = "local"
npm run test:database:db2

# IBM Cloud endpoint -> DB2_DEV_CLOUD_CONNECTION_STRING
$env:CYPRESS_environment = "dev"
$env:DB2_CONNECTION_PROFILE = "cloud"
npm run test:database:db2
```

To record the selected Db2 scenario in Cypress Cloud, configure `CYPRESS_PROJECT_ID` and `CYPRESS_RECORD_KEY`, then run `npm run test:database:db2:record`. In GitLab, supply the same variables through protected/masked CI/CD settings and use the hidden `.db2_cloud_template` as the starting job template. Connection profile and execution platform are independent: a local Cypress process can test cloud Db2, and a GitLab runner can test a private Db2 only when its network permits it.

Expected flow: the step reads its SQL from `DataRepository`, calls `cy.db2Query` or `cy.snowflakeQuery`, the Node task applies safety/configuration, the driver opens and executes, `finally` closes the connection, and the final step validates/attaches the `HEALTH` result. Do not run either command until the corresponding secrets and runner network access are ready.

## Level 9: execute and investigate

Useful commands:

```powershell
npm run cy:open
npm run test:the-internet
npm run test:all
npm run test:unit
npm run lint
npx cypress run --env environment=staging,tags="@account and not @wip"
npx cypress run --headed --browser chrome --spec "cypress/e2e/features/account/*.feature"
```

Investigate in this order: failed Gherkin step, Cypress command log, attached API/database diagnostic, automatic failure screenshot, per-scenario screenshot, video, browser console/network behavior, then server correlation ID. Cucumber HTML is primary; Allure is secondary. Generated artifacts are ignored by Git and should be published as CI artifacts, not committed.

## Level 10: review and deliver

- Scenario is independent, deterministic, data-safe, and parallel-ready.
- No raw selector exists outside its page/component object.
- No reusable input or expected value is duplicated in feature/step code.
- No credential or sensitive response appears in source or reports.
- Public methods, steps, features, data, templates, and utilities contain standard notes.
- Negative/API permission behavior gives expected/actual status, missing fields, and correlation identifiers.
- Database statements are parameterized and environment-safe.
- `npm run lint`, `npm run test:unit`, and the focused Cypress suite pass.
- Reports, screenshots, and videos provide enough evidence for another engineer to diagnose the result.
- Git diff contains only intended source/templates; generated artifacts remain ignored.

The engineer is onboarded when they can complete this checklist, explain the flow in `framework-flow-diagrams.md`, and submit one reviewed scenario without duplicating framework behavior.

## Jira Cloud and CI handoff

`scripts/update-jira-from-ci.js` is an opt-in Jira Cloud REST v3 adapter. Configure protected variables `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_ISSUE_KEY`, `JIRA_PASS_TRANSITION`, and `JIRA_FAIL_TRANSITION`, then set `JIRA_ENABLED=true`. The API user must be allowed to browse and transition the issue and add comments. Transition names must be available in the issue's current workflow state.

Review `ci/gitlab/.gitlab-ci.yml.template`, then copy it to `.gitlab-ci.yml` only when CI is approved. It publishes reports/screenshots/videos with `when: always`. Review `ci/docker/Dockerfile` and `docker-compose.yml` for the pinned Linux execution image. Keep GitLab variables protected and masked; never place secrets in YAML.

## Zephyr Scale Cloud story handoff

The Zephyr script reads a Jira story and previews test cases by default:

```powershell
npm run zephyr:create-from-story -- --jira-id QA-123 --description-file ".\story-details.txt"
```

Review names, preconditions, steps, test data, expected results, labels, project/folder, and missing negative/boundary coverage. Creation requires both `ZEPHYR_ENABLED=true` and `--confirm`. Existing linked coverage blocks duplicates unless `--allow-existing` is deliberately supplied after review. Follow `docs/zephyr-scale-integration.md` for credentials, custom fields, failure recovery, and CI gating.
