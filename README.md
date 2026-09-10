# FlowProof: make the expected outcome testable

A small, reproducible example of a workflow finishing while violating a business expectation.

**This repository is a limited offline showcase, not the complete FlowProof product, not an n8n runtime and not a production QA certification.** No accounts, API keys, customer data or network access are required to run the example.

## See the product

[Watch the English product overview](media/FlowProof-Product-Overview.mp4) · [Read the generated report](reports/demo.html) · [Inspect the evidence](reports/demo.json)

The video shows the broader local FlowProof evaluation release, including features that are **not included in this public example**. Its screenshots use synthetic development data. The voice is AI-generated.

## Reproduce the result

Install Node.js 22 or newer. No npm dependency installation is necessary.

```sh
npm test
npm run demo
```

On Windows PowerShell, use `npm.cmd` if your execution policy blocks `npm.ps1`.

The second command intentionally exits with **code 1**, writes `reports/demo.html` and `reports/demo.json`, and prints:

```text
status: failed
gate: stopped
expected mocked requests: 1
observed mocked requests: 2
```

Open the HTML report locally in your browser. GitHub's file viewer shows HTML source rather than running it. Exit 0 means the assertion passed. Exit 2 means input or execution was blocked; it never counts as a passing expected error.

## What actually happens

1. The runner validates the supplied inactive, two-node n8n-shaped JSON example.
2. It interprets its Manual Trigger followed by one HTTP Request with a literal JSON body.
3. An in-memory mock records each request and returns the synthetic response.
4. The same payload is processed twice. Two request attempts are recorded.
5. The declared expectation for this example is one request across the repeated deliveries, so the assertion fails. This small demo does not implement the private product's approval workflow.

The observed count is calculated from recorded calls, not hard-coded. Automated tests include a **single-execution control** that passes with the same expected count. That control is not a deduplication fix.

There is no persistent deduplication store in this example. It does not prove that a real provider would deliver two messages, and it does not test provider-side idempotency. A real deduplication fix would need its own state model and tests.

## Deliberately narrow scope

Supported: exactly the documented Manual Trigger v1 and HTTP Request v4.2 shape, literal synthetic POST body, a synthetic HTTP 200 response and a request-count assertion. URL targets are restricted to `*.example.test` and are never contacted. Unknown configuration, expressions, credentials and unsupported graphs are blocked.

The file is n8n-shaped for inspection. Running `npm run demo` does **not** import or execute it in n8n. Do not activate it in a live environment. There is no hosted upload service or hidden telemetry.

## The broader FlowProof project

The private local evaluation release contains a workflow/case editor, explicit version-bound approvals, a broader restricted fixture runner, HTML/JSON reports, baseline comparisons and a CLI/Actions handoff. Native n8n execution is experimental and unverified in the development environment. Code/AI Agent support, authenticated teams and production readiness are not claimed.

Those private components are not included here. This example was written separately to make one QA principle inspectable without exposing the complete product engine.

## Interested in the full project?

The owner is exploring a **one-time software and source-code handoff**, subject to an agreed scope and terms. This is not a subscription offer or a claim of existing customers.

Once this repository is published, open an issue titled **Technical evaluation** to start a conversation. Describe your use case in general terms only. Do not attach workflows, credentials, customer data or confidential business logic. Any evaluation involving your data should run on infrastructure you control.

## Attribution and release status

FlowProof is independent and is not affiliated with or endorsed by n8n. The example does not bundle n8n.

Public-release preparation draft. The owner must approve the publication scope and license terms before upload. No license to the private FlowProof codebase is granted by this showcase.
