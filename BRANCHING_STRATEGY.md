# Branching Strategy

The repository follows a formalized branching model designed to isolate work-in-progress code from production-ready code.

## Core Branches
- **`main`**: The absolute source of truth for the production environment. This branch is highly protected. Direct pushes are disabled; all changes must enter via a reviewed Pull Request.
- **`release/vX.Y`**: Long-lived branches created from `main` to stabilize a specific version before tagging. Used for final QA, bug fixing, and patching older versions.

## Ephemeral Branches
- **`feature/*`**: Branched from `main`. Used for developing new features. Must be merged back into `main` via PR.
- **`bugfix/*` or `hotfix/*`**: Branched from `main` (or a `release/*` branch). Used for resolving defects.
- **`chore/*`**: For maintenance, dependency updates, or documentation changes.

## Security Constraints
- **Container Publishing Restrictions**: No image is ever built and pushed to the GHCR registry from an ephemeral branch (feature, bugfix, chore).
- **PR Validation**: Pull Requests from ephemeral branches to `main` must pass the CI workflow (Lint, Test, Build) before the merge button is unlocked.
