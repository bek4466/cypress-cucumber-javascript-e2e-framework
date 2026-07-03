# Framework Design Review

## Decision summary

This repository uses Cypress 15, Cucumber/Gherkin, JavaScript, Node.js 24, centralized page/component objects, data repositories, Node-side integrations, Multiple Cucumber HTML Reporter, and Allure. It is optimized for web E2E and API-assisted testing by SDETs on Windows, with Linux CI templates.

The design separates business intent from implementation:

- features describe behavior;
- step definitions adapt parameters;
- actions/services implement reusable behavior;
- page/components own locators;
- data repositories own non-secret values;
- Node tasks isolate databases and secrets;
- reporters collect steps, logs, attachments, screenshots, and video.

## Strengths

- Cypress command retrying and time-travel UI make web failures easier to reproduce.
- Gherkin gives product, QA, and engineering a shared scenario vocabulary.
- Locator centralization and parameterized steps reduce change cost.
- Native `cy.origin` support allows sequential workflows across unrelated domains.
- `cy.session` avoids unnecessary repeated login while retaining validation.
- Node tasks support Db2 and Snowflake without leaking credentials into browser code.
- Mock drivers validate integration behavior without requiring enterprise systems during onboarding.
- Primary Cucumber HTML and secondary Allure serve different reporting comparisons.
- Pinned runtime/dependencies and a lockfile improve reproducibility on Windows and CI.
- Inactive templates prevent unfinished API/CI examples from being discovered accidentally.

## Costs and constraints

- Cypress uses a browser-centric command queue; engineers must not treat commands as ordinary synchronous promises.
- Cross-origin work requires explicit `cy.origin` boundaries and serializable arguments.
- Parallelization is spec-based and Cypress Cloud orchestration requires a project and record key.
- Cucumber adds preprocessing, expression management, and reporting complexity compared with plain Cypress specs.
- `ibm_db` includes a native/CLI dependency and may require proxy, compiler, client-license, or Docker preparation.
- Direct database manipulation can create brittle tests and governance risk; API setup is preferable when available.
- Two reporters increase artifact size and configuration/triage work.
- Browser E2E remains slower and more failure-prone than component or service tests, so critical paths should be selected deliberately.

## Comparison

| Option | Best fit | Advantages | Tradeoffs for this repository |
| --- | --- | --- | --- |
| Cypress + Cucumber (selected) | Web workflows with readable acceptance behavior | Strong interactive debugging, automatic waits, network control, established current codebase | Command queue learning curve; cross-origin ceremony; Cucumber complexity |
| Cypress without Cucumber | Engineering-owned web tests | Less preprocessing and fewer abstraction layers | Loses required Gherkin collaboration and step-level business reporting |
| Playwright Test | Multi-browser, multi-tab, multi-context, highly parallel web testing | Excellent context isolation, browser control, tracing, first-class parallel workers | Migration cost; replaces current actions/reporting; no native Cucumber requirement without an adapter |
| WebdriverIO + Cucumber | Browser/device grids and WebDriver ecosystems | Mature Cucumber support, broad service integrations, native multi-window model | More synchronization/grid complexity and generally heavier local debugging |
| Selenium + Cucumber | Organizations standardized on WebDriver/JVM stacks | Broad language/grid/vendor support and long ecosystem history | More infrastructure/boilerplate; weaker JavaScript developer experience than current stack |
| Robot Framework | Keyword-driven teams and heterogeneous automation | Accessible syntax and wide library ecosystem | Custom keywords can become opaque; less natural fit for this JavaScript Cypress codebase |

The selected framework remains appropriate while the dominant workload is browser-based E2E with stakeholder-readable Gherkin. Reconsider Playwright if multi-tab/multi-context testing or browser-level concurrency becomes a dominant requirement. Reconsider service-first tooling if API/database checks grow larger than UI orchestration.

## Key architecture decisions

### Page objects contain locators, not workflows

This keeps selector changes local and actions reusable. A page-specific workflow belongs in a service only when it represents cohesive behavior that cannot be expressed by existing actions.

### Test data is separate from secrets

JSON provides versioned inputs and expected values. `.env`/CI variables provide credentials. Browser-side code cannot receive full database or Jira configuration.

### Database access uses Cypress tasks

Db2 and Snowflake drivers execute in Node. Connections are opened per task and closed in `finally`, avoiding shared mutable state across parallel workers. SQL batches are rejected and production writes are blocked by default. These controls complement—not replace—least-privilege database accounts.

### Third-party calls fail with diagnostic contracts

Automatic HTTP status failure is insufficient when permissions drift. The monitor captures actual status, duration, missing/different fields, selected correlation headers, and a redacted body before failing. Request headers are never attached.

### Jira is opt-in and CI-owned

Ordinary local tests do not mutate work items. The CI adapter runs only when `JIRA_ENABLED=true`, comments with the result/build link, resolves a currently available transition, and moves the issue. Jira should not be the source of test assertions.

### Reports are artifacts, not source

Reports, screenshots, and videos remain ignored. GitLab `artifacts: when: always` is the durable sharing mechanism, preventing repository history from accumulating binaries and generated HTML.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Duplicate step expressions | Search first; keep expressions parameterized and domain-focused. |
| Fragile selectors | Require stable test/accessibility attributes and centralize ownership. |
| Secret leakage | Node-only config, allow-listed secret access, redaction, suppressed request logs. |
| Destructive production SQL | Default read-only classification plus least-privilege production accounts. |
| Parallel data collisions | Unique scenario data, per-task DB connections, no scenario ordering. |
| External outage obscures product defect | Structured dependency diagnostics and correlation IDs. |
| Jira workflow mismatch | Resolve available transitions dynamically and report available choices. |
| Native Db2 installation failure | Pinned driver, Windows prebuilt path, documented compiler/proxy/client options, mock tests. |
| Reporter disagreement | Cucumber HTML is authoritative; Allure is a comparison view. |

## Future review triggers

Review the design when Cypress/Cucumber major versions change, CI parallelism is enabled, live database writes are introduced, production execution is proposed, Jira workflow automation becomes mandatory, or more than one team/application shares this repository.
