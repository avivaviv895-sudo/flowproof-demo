# Draft community post

**Title:** A workflow can finish successfully and still send the wrong number of requests

I am building FlowProof, a local QA tool for automation workflows. I have prepared a small, inspectable example around one failure: repeated delivery results in two mocked welcome requests, when the test expects one.

The example records each attempt and generates an HTML report plus JSON evidence. It needs no customer data, account or API key. A single-execution control passes, so the failed result is not simply preloaded.

Important boundary: this public example is a narrow offline interpreter, not native n8n execution. The broader local prototype is shown in the attached video, with its current limitations stated explicitly.

I would like feedback from people who deliver or maintain n8n automations: would repeatable expected-result checks and client-facing reports be useful in your delivery process? What would stop you from using this?

I am also open to discussing a one-time handoff of the full project with an interested agency or software company. Please do not share client workflows or data publicly.

Repository: add the approved public repository URL before posting.

Publication note: review each community's promotion rules, disclose that you are the builder, and post only where relevant. Remove this note before posting.
