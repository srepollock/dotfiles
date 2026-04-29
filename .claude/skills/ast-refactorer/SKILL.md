---
name: ast-refactorer
description: Executes safe, automated code transformations using Abstract Syntax Tree (AST) manipulation.
capabilities: [edit_file, fs_read, run_terminal_cmd]
---

# 🧹 AST Refactorer

This skill enables the Maintainer and Implementer to apply large-scale refactors safely.

## ⚖️ Usage Protocol

1. **Analysis Phase**: Parse the target files into an AST to identify specific patterns (e.g., all instances of a deprecated function).
2. **Transformation Phase**: Apply a "Codemod" to restructure the code without breaking logic (e.g., converting callbacks to async/await).
3. **Post-Process Phase**: Run the project's linter/formatter to ensure the code matches the `.editorconfig` style.
4. **Validation Phase**: Invoke the Tester to run a baseline check on the refactored files.

## 🛠️ Technical Standards

- Never use RegEx for complex structural changes; always use an AST-based tool.
- Every refactor must include a "Dry Run" report showing exactly what will change.
- Limit transformations to 50 files per batch to allow for manual review.
