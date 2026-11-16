# Changelog

Versions follow [Semantic Versioning](https://semver.org/). Dates use Asia/Shanghai.
These entries describe local deliverables; a version is publicly available only
when its files have actually reached the GitHub `main` branch.

## [0.7.0] - 2026-11-16

### Added

- Reviewed Source-File 1–15 effects and selected in-game Markdown documentation,
  including basic mechanics, Source-Files, BitNodes, sleeves, grafting, offline
  behavior and troubleshooting. See `docs/documentation-coverage.json` for exact pages.
- GitHub main-branch update/download URLs, bilingual project documentation,
  one-file install link, license notices and reproducible release checks.
- GitHub Actions checks for syntax, committed build freshness, metadata/version
  agreement, dictionary tests and local React/DOM regressions.

### Fixed

- Recognize documentation pages and standalone guide popups without changing game
  routing. Preserve links, search input, code blocks, inline code spans and formulas.
- Allow translated documentation links to wrap within the available width, and keep the prose column clear of the overview panel.

### Compatibility

- Retains the existing `@name` and `@namespace` (`bitburner-zh-cn-local`) so script
  identity remains stable. Existing manual installs must replace the old script's
  entire contents once to acquire update metadata; avoid duplicate installations.
- Full combined distribution retains Apache 2.0 with Commons Clause for upstream
  material. Independent code is MIT licensed; see `LICENSE`.

## [0.6.0] - 2026-11-16

- Added 794 reviewed entries for Gang, Bladeburner and Corporation.
- Preserved player-defined names, action identifiers, console logs and formulas.
- Verified local React/MUI interaction; unlocked live saves were not tested.

## [0.5.0] - 2026-11-16

- Added 373 entries for jobs, crimes, training, grafting, darknet, casinos and
  infiltration introduction. Fixed same-name company/faction recognition and layout.

## [0.4.1] - 2026-11-16

- Added an independent Chinese overlay for 56 ASCII map location labels across
  six cities, without changing the original map text, spacing or hit targets.

## [0.4.0] - 2026-11-16

- Added city/location labels, achievements and offline messages.
- Fixed faction Join button sizing.

## [0.3.0] - 2026-11-16

- Expanded faction and augmentation descriptions and reviewed dynamic templates.

## [0.2.0] - 2026-11-16

- Added reversible direct Chinese text display alongside hover translation.

## [0.1.0] - 2026-11-16

- Initial standalone hover translation userscript, scoped dictionary and reader.
