# Contributing

## Contents of this file

### For contributors

- [Updating Changelog](#updating-changelog)

### For maintainers

- [Releasing a new version](#releasing-a-new-version)

## Changes and additions

### Summary

To submit a feature to this repo, clone the repo
and create a new branch. Once you have committed your changes to the
branch push them to the repo. This will trigger the create pull request
option when you browse to the [repo](https://github.com/Kong/workspace-config-apply-nodejs).
From the browser you can agree to create the pull request, this will start
the approval process (you will need to request at least one reviewer).

## Updating Changelog

If you open a GitHub pull request on this repo, please update `CHANGELOG` to
reflect your contribution.

Add your entry under `Unreleased` as `Breaking changes`, `New features`, `Fixes`.

Internal changes to the project that are not part of the public API do not need
change log entries, for example fixing the CI build server.

These sections follow [semantic versioning](https://semver.org/), where:

- `Breaking changes` corresponds to a `major` (1.X.X) change.
- `New features` corresponds to a `minor` (X.1.X) change.
- `Fixes` corresponds to a `patch` (X.X.1) change.

See the [`CHANGELOG_TEMPLATE.md`](CHANGELOG_TEMPLATE.md) for an example for how
this looks.

## Releasing a new version

Each merge to `main` branch will create a GitHub release using semver 1.2.3
syntax.
