# Zephyr Scale Cloud Test-Case Generation

## Purpose

`scripts/create-zephyr-tests-from-jira.js` reads a Jira Cloud user story and creates linked Zephyr Scale Cloud test cases. It accepts a Jira issue key or numeric ID and optional additional story text. Jira remains the source of the summary, description, project, labels, and numeric issue ID.

The generator is deterministic and does not call an AI service:

1. Explicit `Scenario`/`Given`/`When`/`Then` blocks become cases with ordered Zephyr steps.
2. Without Gherkin, each bullet or numbered acceptance criterion becomes one case.
3. Without either structure, one traceability case is generated from the story summary/description.

This avoids inventing requirements. An SDET must review the preview for missing negative, boundary, security, accessibility, API, database, and data-variation coverage before creation.

## Authentication

Copy `.env.example` to ignored `.env` and configure:

```text
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=sdet@example.com
JIRA_API_TOKEN=<jira-api-token>

ZEPHYR_ENABLED=false
ZEPHYR_SCALE_BASE_URL=https://api.zephyrscale.smartbear.com/v2
ZEPHYR_SCALE_API_TOKEN=<zephyr-scale-api-token>
```

Jira and Zephyr tokens are separate. The Jira account must be able to read the story. The Zephyr token owner must be able to create test cases in the target project and link coverage to that Jira issue. In GitLab, store every token as a protected/masked CI/CD variable.

Optional Zephyr defaults:

```text
ZEPHYR_PROJECT_KEY=QA
ZEPHYR_FOLDER_ID=123
ZEPHYR_PRIORITY_NAME=Normal
ZEPHYR_STATUS_NAME=Draft
ZEPHYR_OWNER_ACCOUNT_ID=<atlassian-account-id>
ZEPHYR_LABELS=generated,review-required
ZEPHYR_MAX_TEST_CASES=20
ZEPHYR_CUSTOM_FIELDS_JSON={"Automation Candidate":true}
```

When `ZEPHYR_PROJECT_KEY` is empty, the Jira story's project key is used. Required Zephyr custom fields must be supplied through `ZEPHYR_CUSTOM_FIELDS_JSON` using the exact configured field names/value types.

## Preview first

Read only the Jira story:

```powershell
npm run zephyr:create-from-story -- --jira-id QA-123
```

Add description/acceptance details from the command line:

```powershell
npm run zephyr:create-from-story -- --jira-id QA-123 --description "The locked user receives an access-denied message."
```

For multi-line content, use a local text file:

```powershell
npm run zephyr:create-from-story -- --jira-id QA-123 --description-file ".\story-details.txt"
```

Preview prints the exact Zephyr payloads and changes nothing in Zephyr. Supplied text augments rather than replaces the Jira description.

## Create and link reviewed cases

After reviewing the preview:

```powershell
$env:ZEPHYR_ENABLED = "true"
npm run zephyr:create-from-story -- --jira-id QA-123 --confirm
```

For every generated case the script:

1. calls Zephyr `POST /testcases`;
2. replaces the automatic empty step through `POST /testcases/{key}/teststeps` with `OVERWRITE` mode;
3. links coverage through `POST /testcases/{key}/links/issues` using the numeric ID returned by Jira.

Before creation, it calls `GET /issuelinks/{issueKey}/testcases`. Existing linked coverage stops the operation. Only after reviewing those cases should an engineer override protection:

```powershell
npm run zephyr:create-from-story -- --jira-id QA-123 --confirm --allow-existing
```

Creation is sequential to preserve step/case ordering and produce a precise partial-failure message. If case creation succeeds but step writing or Jira linking fails, the error identifies the orphan/incomplete Zephyr key for manual correction.

## Input structure examples

Preferred Jira description:

```gherkin
Scenario: Valid customer signs in
  Given an active customer account
  When valid credentials are submitted
  Then the account page is displayed

Scenario: Locked customer is rejected
  Given a locked customer account
  When valid credentials are submitted
  Then an access-denied message is displayed
```

Alternative acceptance-criteria list:

```text
Acceptance Criteria
- Valid customers are redirected to the account page.
- Locked customers receive the approved access-denied message.
- Five consecutive invalid attempts lock the account.
```

The structured version produces more useful action/expected-result steps.

## CI template

Use a manual, protected GitLab job for test-case creation. Required variables are `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_ISSUE_KEY`, `ZEPHYR_ENABLED=true`, and `ZEPHYR_SCALE_API_TOKEN`.

```yaml
create_zephyr_cases:
  stage: quality
  when: manual
  allow_failure: false
  script:
    - npm run zephyr:create-from-story -- --jira-id "$JIRA_ISSUE_KEY" --confirm
```

Keep preview/review as a required human gate. Do not automatically generate new test cases on every normal Cypress build.

## Implementation map

| File | Responsibility |
| --- | --- |
| `jira-cloud-client.js` | Reads Jira REST v3 issue fields. |
| `user-story-test-case-generator.js` | Converts ADF and explicit criteria into deterministic cases. |
| `zephyr-scale-client.js` | Creates cases, overwrites steps, links Jira coverage. |
| `zephyr-story-service.js` | Enforces limits, duplicate protection, and orchestration. |
| `create-zephyr-tests-from-jira.js` | CLI input, `.env`, preview, confirmation, and output. |
| `test/integrations/zephyr-scale.test.js` | Mock verification without external mutations. |

## Official references

- [Zephyr Scale Cloud REST API](https://support.smartbear.com/zephyr-scale-cloud/api-docs/)
- [Jira Cloud REST API v3](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/)
