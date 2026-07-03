# Framework Flow Diagrams

## Authoring flow

```mermaid
flowchart TD
    A["Business behavior and acceptance criteria"] --> B["Feature and scenario tags"]
    B --> C["Non-secret data and expected values"]
    C --> D["Page or component locator map"]
    D --> E["Reusable action or service"]
    E --> F["Parameterized step definition"]
    F --> G["Focused GUI or headed run"]
    G --> H["Lint, mock tests, and tagged suite"]
    H --> I["Review reports and Git diff"]
```

## Runtime flow

```mermaid
sequenceDiagram
    participant Runner as Cypress Runner
    participant Feature as Gherkin Feature
    participant Step as Step Definition
    participant Data as Data Repository
    participant Page as Page Registry/POM
    participant Action as Action or Service
    participant Browser as Browser/Application
    participant Report as Cucumber and Allure

    Runner->>Feature: Select spec by path/tag
    Feature->>Step: Match parameterized expression
    Step->>Data: Resolve inputs/expected values
    Step->>Page: Resolve logical page and locator
    Step->>Action: Invoke reusable behavior
    Action->>Browser: Queue Cypress commands
    Browser-->>Action: Retry until condition/timeout
    Action->>Report: Add sanitized step log/evidence
    Browser-->>Step: Return observed result
    Step-->>Runner: Pass or actionable failure
    Runner->>Report: Add screenshot, video, metadata
```

## Multi-domain flow in one scenario

```mermaid
flowchart LR
    A["Primary application"] -->|"actions and assertions"| B["cy.origin domain 2"]
    B -->|"serialized arguments only"| C["cy.origin domain 3"]
    C --> D["Return to primary origin if needed"]
    S["Session Manager"] -. "cached validated login" .-> A
    R["Origin Service"] -. "central origin boundary" .-> B
    R -. "central origin boundary" .-> C
```

## UI, API, and database branches

```mermaid
flowchart TD
    Scenario["Scenario step"] --> Choice{"Validation type"}
    Choice -->|UI| POM["Page Registry and locator"]
    POM --> Actions["Actions/services"]
    Actions --> Browser["Application browser"]
    Choice -->|First-party API| Api["ApiClient"]
    Api --> Validator["ApiResponseValidator"]
    Choice -->|Third-party API| Monitor["ThirdPartyApiMonitor"]
    Monitor --> Contract["Contract comparison and redaction"]
    Contract --> Evidence["Diagnostic attachment or pass log"]
    Choice -->|Database| Task["Private Cypress Node task"]
    Task --> Safety["Environment and SQL safety"]
    Safety --> Db{"Provider"}
    Db --> Db2["ibm_db client"]
    Db --> Snowflake["snowflake-sdk client"]
    Db2 --> Result["Serialized rows"]
    Snowflake --> Result
```

## Database query lifecycle

```mermaid
sequenceDiagram
    participant Step as Test/Step
    participant Command as cy.db2Query or cy.snowflakeQuery
    participant Task as Cypress Node Task
    participant Guard as SQL Safety
    participant Config as Private Environment Config
    participant Driver as Db2/Snowflake Driver

    Step->>Command: SQL plus bind values
    Command->>Task: Serialized request
    Task->>Guard: Reject batch / enforce prod read-only
    Task->>Config: Resolve environment credentials
    Task->>Driver: Open isolated connection
    Driver->>Driver: Execute parameterized statement
    Driver-->>Task: Rows or error
    Task->>Driver: Close in finally
    Task-->>Command: JSON-serializable result
    Command-->>Step: Assert business state
```

## Failure and evidence flow

```mermaid
flowchart TD
    Failure["Assertion, HTTP contract, or task failure"] --> Detail["Sanitized expected-versus-actual detail"]
    Detail --> Cucumber["Cucumber step and attachment"]
    Detail --> Allure["Allure attachment"]
    Failure --> AutoShot["Automatic failure screenshot"]
    Hook["Scenario After hook"] --> ScenarioShot["Passed or failed scenario screenshot"]
    Spec["Headless spec run"] --> Video["Full spec video"]
    Cucumber --> Artifacts["Local ignored output or GitLab artifact"]
    Allure --> Artifacts
    AutoShot --> Artifacts
    ScenarioShot --> Artifacts
    Video --> Artifacts
```

## CI and Jira flow

```mermaid
sequenceDiagram
    participant GitLab as GitLab Pipeline
    participant Quality as Lint and Mock Tests
    participant E2E as Cypress E2E Job
    participant Artifacts as GitLab Artifacts
    participant Jira as Jira Cloud

    GitLab->>Quality: npm ci, lint, test:unit
    Quality-->>GitLab: quality status
    GitLab->>E2E: tagged test command
    E2E->>Artifacts: always publish reports/screenshots/videos
    alt JIRA_ENABLED is true
        E2E->>Jira: comment result and build URL
        E2E->>Jira: resolve available transition
        E2E->>Jira: transition pass/fail state
    else Jira disabled
        E2E-->>GitLab: explicit no-op message
    end
```
