---
name: security-scanner
description: Automated wrapper for security analysis tools (Snyk, Bandit, npm audit, etc.) to confirm vulnerabilities.
capabilities: [run_terminal_cmd, fs_read]
---

# 🛡️ Security Scanner

This skill provides the Security Reviewer with automated evidence of vulnerabilities.

## ⚖️ Usage Protocol

1. **Tool Selection**: Detect the stack and choose the appropriate scanner (e.g., `Bandit` for Python, `npm audit` for Node).
2. **Scan Phase**: Execute the scanner on the current diff or the entire workspace.
3. **Validation Phase**: Filter results to remove false positives based on project-specific `@workspace` context.
4. **Handoff**: Provide the Security Reviewer with a structured list of Severity, Location, and Remediation.

## 🛠️ Technical Standards

- Scans must be non-destructive.
- Focus on OWASP Top 10 categories.
- Report "Vulnerable Dependencies" separately from "Logic Flaws."
