# Contributing to UI/UX Icons

Thanks for helping make this icon library better.

## Requesting an icon

Open an [icon request](https://github.com/uiuxassets/uiuxicons/issues/new?template=icon-request.yml). Concrete use cases help us prioritize.

## Reporting a bug

Open a [bug report](https://github.com/uiuxassets/uiuxicons/issues/new?template=bug-report.yml) with the affected package/area and version.

## Contributing icons or code

1. Fork the repo and create a branch.
2. For icons: add SVGs to all 9 variant folders under `exports/{style}/{weight}/` (line, duotone, solid x light, regular, bold). Icons are 24x24 with `currentColor` - see the [README specs](README.md#specs).
3. Run `npm run sync` to update metadata, then review the generated entries in `icons.meta.json`.
4. Run `npm test` - this typechecks both packages and validates icon-set integrity (all 9 folders must contain identical icon sets).
5. Run `npm run build` to verify the full pipeline passes.
6. Open a pull request. CI must be green before merge.

## What CI checks

Every push and PR runs: TypeScript checks for both packages, the unit and integrity test suites, a full build, and post-build integration tests. Deploys to [uiuxicons.com](https://uiuxicons.com) only happen from `main` after all of these pass.

## Releases (maintainers)

```bash
npm run release -- patch|minor|major   # bumps versions in lockstep, commits, tags
git push origin main vX.Y.Z            # tag push triggers the npm publish workflow
```

## License

By contributing, you agree your contributions are licensed under the [MIT License](LICENSE).
