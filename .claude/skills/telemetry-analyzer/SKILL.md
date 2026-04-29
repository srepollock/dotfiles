---
name: telemetry-analyzer
description: Parses logs, performance profiles, and telemetry data to identify bottlenecks and runtime errors.
capabilities: [fs_read, run_terminal_cmd]
---

# 📈 Telemetry Analyzer

This skill provides data-driven insights to the Performance Analyzer and Bug-Fixer.

## ⚖️ Usage Protocol

1. **Data Ingestion**: Read local log files or invoke a CLI tool to fetch metrics from a database/telemetry provider.
2. **Pattern Matching**: Identify recurring stack traces, slow query logs, or memory spikes.
3. **Complexity Verification**: Provide the Performance Analyzer with real-world timing data to validate LaTeX complexity analysis ($O(n)$ vs measured $ms$).
4. **Reporting**: Generate a summary of the top 3 bottlenecks found.

## 🛠️ Technical Standards

- Mask PII and secrets automatically during ingestion.
- Group similar errors into "Incident Buckets" to avoid log noise.
- Always compare current telemetry against a "Stable Baseline" if available.
