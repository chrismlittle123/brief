# Agent Instructions

## Project Overview

brief is a monorepo application with API and frontend packages. Built with TypeScript.

- **Tier:** internal
- **Package:** `brief` (monorepo root)

## Quick Reference

| Task | Command |
|------|---------|
| Install | `pnpm install` |
| Build | `pnpm build` |
| Test | `pnpm test` |

## Architecture

```
packages/
  api/         # Backend API
  frontend/    # Frontend application
```

See `docs/` for detailed architecture documentation.

## Standards & Guidelines

This project uses [@standards-kit/conform](https://github.com/chrismlittle123/standards-kit) for coding standards.

- **Config:** `standards.toml` (extends `typescript-internal` from the standards registry)
- **Guidelines:** https://chrismlittle123.github.io/standards/

Use the MCP tools to query standards at any time:

| Tool | Purpose |
|------|---------|
| `get_standards` | Get guidelines matching a context (e.g., `typescript react`) |
| `list_guidelines` | List all available guidelines |
| `get_guideline` | Get a specific guideline by ID |
| `get_ruleset` | Get a tool configuration ruleset (e.g., `typescript-internal`) |

## Workflow

- **Branch:** Create feature branches from `main`
- **CI:** GitHub Actions runs build and test on PRs
- **Deploy:** CI deploy on push to `main`
- **Commits:** Use conventional commits (`feat:`, `fix:`, `chore:`, etc.)

## Project-Specific Notes

- Root-level code checks (lint, typecheck) are disabled — these run at the package level
- ESLint config lives in `packages/frontend`, not at monorepo root
