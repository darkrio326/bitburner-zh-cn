# Changelog

Versions follow [Semantic Versioning](https://semver.org/). Dates use Asia/Shanghai.
These entries describe local deliverables; a version is publicly available only
when its files have actually reached the GitHub `main` branch.

## [0.8.2] - 2026-11-26

### Fixed

- Recognize The Black Hand as a faction on its main page, while retaining the
  augmentation scope inside its identically named purchase dialog. Existing
  faction descriptions, work options, donation text and campaigns now translate.
- Enable the reviewed donation input placeholder without changing typed values.
- Translate both prose segments of the Bladeburners rumor while preserving NSA.

### Verification

- Inventory 12 pinned faction source files: 184 prose/label/template items covered;
  60 ASCII-art fragments, encoded clues and multiplier symbols retained.
- Replay the reported page, all known faction headings, campaign/gang dialogs,
  the identically named augmentation, React updates, hover and cleanup locally.
- Real-save and Tampermonkey update verification remain with the user.

## [0.8.1] - 2026-11-25

### Fixed

- Translate the full augmentation-install result after the game navigates back to
  Terminal. Preserve the complete multiline augmentation list and NeuroFlux level.
- Match reviewed game-result dialogs independently of the underlying page in
  direct and hover modes; keep terminal, logs and unknown script messages intact.
- Recognize company/faction work, grafting results and Source-File award dialogs;
  reuse existing Source-File effect translations and retain the no-refund warning.

### Added

- 26 source-reviewed result texts, including five constrained templates for install
  receipts, Source-File upgrades, travel and sleeve/job notifications.
- A cross-module inventory of 144 direct dialog calls in 84 files, with the 10
  result-producing source files fixed here recorded in `docs/dialog-coverage.json`.
- Screenshot-based local receipt replay, name/newline/node preservation checks,
  900/1104/1280 layouts, React updates, hover, disable and removal regressions.

The installation result is replayed
from source and the screenshot, without installing augmentations in a real save.

## [0.8.0] - 2026-11-24

### Added

- 410 reviewed translations for Sleeves (169), Stanek's Gift (62), and IPvGO
  (179), including FAQ/help dialogs, task labels, fragment effects, scoring,
  history, opponent selection and fixed dynamic status/error messages.
- 31 constrained templates preserve game-provided progress, amounts, names and
  signed effects. Source provenance is checked against pinned v3.0.1.
- Local React/MUI regressions for original select values, task callbacks, input
  retention, dynamic node identity, portal dialogs, hover and cleanup.

### Fixed

- Recognize all three advanced pages and Covenant sleeve purchase dialogs.
- Allow translated buttons in these modules to wrap within the available width.

### Scope

- This is a local deliverable until published. Unlocked official-game saves,
  Tampermonkey installation and automatic updating have not been tested for 0.8.0.

## [0.7.1] - 2026-11-17

### Fixed

- Translate established elapsed/remaining work-timer nodes immediately after game
  updates, preventing the delayed English flash while keeping game-supplied values,
  React node identities and the existing batch processing for other content.
- Translate the augmentation-purchase success receipt while preserving the exact
  augmentation name and the warning that installation is required.
- Extend shared reputation/favor labels and favor help to the augmentation shop.
- Translate its reviewed filter placeholder without changing typed text, filtering
  events or fresh game-provided hints; restore it on disable, hover and removal.

### Added

- 29 reviewed entries, including descriptions and cumulative effects for all 11
  hash upgrades, three stock order selectors, four order-book labels and the receipt.
- Frame-sampled timer regressions, placeholder/input lifecycle checks, and local
  React/MUI tests for hash values, copied names and unchanged stock order parameters.
- Real v0.7.0 installation was confirmed by a user. This does not establish real
  v0.7.1 installation or automatic-update acceptance.

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
