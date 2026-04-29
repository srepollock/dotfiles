---
name: workspace-indexer
description: Indexes and retrieves context from documentation, ADRs, and historical code comments to provide agents with design intent.
capabilities: [fs_read, run_terminal_cmd]
---

# 🔍 Workspace Indexer

This skill provides agents with a "long-term memory" of the project's design decisions and historical context.

## ⚖️ Usage Protocol

1. **Index Phase**: Scan the workspace for `docs/`, `ADR/`, and specific `.md` files to build a searchable knowledge base.
2. **Retrieval Phase**: Use keyword or semantic search to find design patterns or previous decisions relevant to the current task.
3. **Synthesis Phase**: Provide the Architect or Planner with a summary of found context to ensure new plans align with historical intent.

## 🛠️ Technical Standards

- Prioritize Architecture Decision Records (ADRs).
- Link code comments to documentation where cross-references exist.
- Flag "Stale Context" if documentation contradicts the current state of `main` branch code.
