# CI/CD Workflow Verification

## Requirement Verification Checklist

- [x] **Implement workflow files only, no publishing or execution**: Verified. Only `.github/workflows/ci.yml` and `release.yml` were generated. No pushes occurred.
- [x] **No PAT usage, `GITHUB_TOKEN` only**: Verified. `release.yml` relies exclusively on `${{ secrets.GITHUB_TOKEN }}`.
- [x] **Separate Build, Test, Publish into independent jobs**: Verified. The YAML definitions cleanly separate the environment validation (`build-and-test`) from the containerization logic (`publish-backend`, `publish-frontend`).
- [x] **Required Order of Execution**: Verified. The order explicitly follows: Checkout -> Install -> Lint -> TS Build -> Tests -> Security Scan -> Docker Build -> Docker Verification (Trivy) -> Publish -> Generate Artifacts.
- [x] **Pull requests build and test only**: Verified. Handled by `ci.yml` which has zero publishing logic.
- [x] **Main branch build and test only (unless tagged)**: Verified. Pushes to `main` trigger `ci.yml`. Publishing logic is sequestered entirely within `release.yml`, which only triggers on `tags`.
- [x] **Required workflow permissions defined**: Verified. `contents: read` and `packages: write` are explicitly declared.
- [x] **Image names strictly defined**: Verified. Outputs strictly map to `ghcr.io/<owner>/peravia/backend` and `ghcr.io/<owner>/peravia/frontend`.
- [x] **Release trigger restriction**: Verified. `release.yml` now correctly triggers solely on standard semver glob patterns (`v[0-9]*.[0-9]*.[0-9]*`).
- [x] **Semantic, SHA, and Latest tagging applied**: Verified via `docker/metadata-action`. The `latest` tag is statically applied using `type=raw,value=latest` because the workflow inherently only triggers on tagged releases.
- [x] **Deployment package validation**: Verified. The `generate-deployment-artifacts` job uses a strict bash script to fail the pipeline if the client package mistakenly contains `.env`, `.git`, `src/`, or database dumps before zipping.

## Status
**GITHUB ACTIONS READY**
