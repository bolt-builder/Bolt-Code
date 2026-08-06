# Publishing Bolt Code

Bolt Code is published to the VS Code Marketplace (and, optionally, Open VSX)
under the `bolt-builder` publisher as `bolt-builder.bolt-code`. This document
covers the one-time setup a maintainer must do and the release flow.

## One-time setup (human, in GitHub repo settings)

### Secrets

| Secret            | Required for                | How to get it                                                                                                                                                                 |
| ----------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VSCE_PAT`        | Marketplace publish         | Azure DevOps PAT for the `bolt-builder` Marketplace publisher, with **Marketplace: Manage** scope. Create the publisher at https://marketplace.visualstudio.com/manage first. |
| `OVSX_PAT`        | Open VSX publish (optional) | Access token for the `bolt-builder` namespace at https://open-vsx.org. Remove the Open VSX steps from the publish workflows if you do not publish there.                      |
| `POSTHOG_API_KEY` | Telemetry (optional)        | Only needed if you run a PostHog project. Telemetry is opt-in and off by default (see `PRIVACY.md`); publishing works without this.                                           |
| `CODECOV_TOKEN`   | Coverage uploads (optional) | Only if you set up a Codecov project. Without it the upload steps fail softly.                                                                                                |

### Environments

Create these GitHub Actions environments (Settings → Environments). Add
required reviewers to gate publishing:

- `marketplace-production` — used by stable releases.
- `marketplace-prerelease` — used by manual nightly builds.

## Release flow (stable)

`.github/workflows/marketplace-publish.yml` runs on a pushed `v*.*.*` tag (or
manual dispatch from `main`). It refuses to publish unless:

- `src/package.json` identity is exactly `bolt-builder` / `bolt-code`,
- the tag version matches `src/package.json` version, and
- the commit came from an approved PR.

To cut a release:

1. Bump `version` in `src/package.json` and add a matching `## [x.y.z]` section to `CHANGELOG.md`.
2. Merge that through an approved PR.
3. Tag the merge commit `vX.Y.Z` and push the tag.

The workflow packages `bin/bolt-code-<version>.vsix`, publishes to the
Marketplace and Open VSX, and creates a GitHub release with the changelog body.

## Pre-release (nightly)

`.github/workflows/nightly-publish.yml` is **manual-only** (`workflow_dispatch`).
The fork does not auto-publish a pre-release on every push to `main`; trigger it
deliberately from the Actions tab when you want a pre-release build.
