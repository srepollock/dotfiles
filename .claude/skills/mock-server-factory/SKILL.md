---
name: mock-server-factory
description: Generates and manages local mock servers based on OpenAPI, GraphQL, or Protobuf specifications.
capabilities: [run_terminal_cmd, edit_file]
---

# 🎭 Mock Server Factory

This skill allows the Integration Specialist to test external service resilience without hitting production APIs.

## ⚖️ Usage Protocol

1. **Spec Discovery**: Locate the relevant API specification file.
2. **Configuration**: Generate a mock server configuration (e.g., for Prism or WireMock) including custom error states (429, 503).
3. **Start/Stop**: Manage the lifecycle of the mock process during the test phase.
4. **Verification**: Confirm that the client code handles the mock's response (and failure) correctly.

## 🛠️ Technical Standards

- Mocks should be deterministic by default but support "Chaos Mode" (latency/error spikes) on request.
- Ensure the mock server port does not conflict with standard project services.
