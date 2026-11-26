# Bitburner Simplified Chinese · v0.8.2

[中文](README.md) · [Changelog](CHANGELOG.md) · [Verification](docs/verification.md) · [Maintenance](docs/maintenance.md)

An unofficial Tampermonkey userscript for the [official Bitburner web game](https://bitburner-official.github.io/), pinned to **v3.0.1**. It offers reversible inline Chinese, hover translations, a pinned reader and ASCII map labels. **Install one script only. The dictionary is embedded; users do not need Node.js or extra files.**

**[Install userscript](https://raw.githubusercontent.com/darkrio326/bitburner-zh-cn/main/bitburner-zh-cn.user.js)**

> The [GitHub repository](https://github.com/darkrio326/bitburner-zh-cn) is public, and the install/update endpoint has been verified. [Releases](https://github.com/darkrio326/bitburner-zh-cn/releases) · [GitHub Actions](https://github.com/darkrio326/bitburner-zh-cn/actions/workflows/check.yml). A user confirmed successful v0.7.0 installation; real v0.7.1 installation and automatic updates remain unverified.

Version 0.8.2 fixes the faction/augmentation name collision for The Black Hand, restores faction prose and campaign translations, and completes donation-placeholder and faction-rumor text. It retains the v0.8 advanced-gameplay and result-dialog translations. The install/update URL above follows the GitHub `main` branch.

## Installation and updates

1. Install [Tampermonkey](https://www.tampermonkey.net/) and allow it to run on the official game site.
2. Follow the install link, or create a userscript and paste the complete `.user.js` contents, including its metadata block.
3. Reload the game. The bottom-right toolbar should show the Chinese toggle, display mode and reader button.

When upgrading a previous manual installation, **replace the existing script's entire contents** once to acquire the update metadata. Avoid enabling two copies. The original `@name` and `@namespace` remain stable.

Tampermonkey checks the GitHub `main` Raw file and downloads newer versions according to the extension's update settings. Both `@updateURL` and `@downloadURL` point to the same standalone file. You may also trigger a manual update check. See the [Tampermonkey metadata documentation](https://www.tampermonkey.net/documentation.php). A user confirmed successful v0.7.0 installation. Real v0.7.1 installation and update downloads remain **unverified**.

## Controls

- **中文：开/关**: enable/disable Chinese. Disabling restores English still owned by the script and stops translation observers and queued work.
- **显示：直接/悬停**: inline or hover mode. Hover mode keeps English and shows a translation after about 180 ms.
- **阅读**: pin the most recent translation for scrolling; collapse it or press Esc to close. Ordinary hover overlays do not intercept mouse clicks.
- The Tampermonkey menu can remove the translation completely for the current page; reloading restores it.

Only the enabled flag and display mode are saved in Tampermonkey storage. The script does not access saves, localStorage or IndexedDB, send game data, use a translation API or fetch a remote dictionary. Extension-managed GitHub update checks are separate from the game-page runtime.

## Coverage

v0.8.2 audits 12 pinned faction source files: 184 prose/label/template items match; 60 ASCII-art fragments, encoded clues and symbols are retained. See [faction coverage](docs/faction-coverage.json). This source inventory does not establish every runtime branch or real-save acceptance.

v0.8.1 adds 26 result-dialog entries and fixes augmentation-install receipts after navigation to Terminal. Names, levels and list newlines stay verbatim. Work, grafting, Source-File and reset results are also covered; see [dialog coverage](docs/dialog-coverage.json).

v0.8.0 adds 410 reviewed entries: Sleeves (169), Stanek’s Gift (62), and IPvGO (179), including 31 constrained templates and advanced page/dialog recognition. See [advanced coverage](docs/advanced-coverage.json).

The dictionary contains **4,844 reviewed entries**, including **187 constrained templates**: 1,683 entries from the reference translation diff and 3,161 attributed supplements. An additional 56 map labels cover 76 locations across six city maps.

Existing coverage includes navigation, stats, factions, augmentations, Hacknet, settings, tutorials, cities, jobs, crimes, training, grafting, darknet UI, achievements, offline messages, Gang, Bladeburner and Corporation.

Version 0.7.1 adds **29 entries** and corrects four existing entries: augmentation purchase receipts, reputation/favor labels and the filter placeholder, descriptions/effects of 11 hash upgrades, and stock order labels. It also fixes transient English flashes in work timers. See the [supplement coverage](docs/supplement-v0.7.1-coverage.json).

Version 0.7 adds **1,737 entries**:

- Effects of **Source-File 1–15**, preserving identifiers, API names and values.
- Prose in **33 Markdown guide pages**, including the full beginner guide, all 18 basic-mechanics guides, ten advanced introductions, programming resources, offline mechanics and frozen-game troubleshooting.
- Guide popups, document navigation and safe handling of the game's styled inline-code spans.

See the [exact coverage manifest](docs/documentation-coverage.json). The Corporation guide includes its overview and contents, not all linked specialist chapters. Matching coverage is not proof that every unlocked gameplay path has been tested. Locked spoiler links remain under game control.

## Implementation and limits

Inline prose changes existing `Text.data`. Approved filter hints change only the input’s `placeholder` attribute, never its value. It does not replace, wrap or remove React nodes, set game elements' `innerHTML`/`textContent`, modify React state, alter game source/builds or access saves. Restoration only reverts text or placeholders still equal to the script's own translation.

The toolbar, reader and map overlay use independent Shadow DOM. Original ASCII maps and click targets stay unchanged. Delegated events and batched observers handle dynamic updates without periodic full-page scans. Batches visit up to 400 nodes with a 6 ms soft time budget. Recognized elapsed/remaining work timers are translated immediately after the game updates them, before the next paint; the game remains responsible for all time values.

Input contents, editors, terminals, logs, code blocks, styled inline code and formulas are excluded. Player-defined names are protected at their known DOM positions. Document prose and translated location headings avoid the overview panel. Matching is exact and scoped; dynamic templates preserve constrained variable values and never use unrestricted wildcards.

Uncovered content includes all NS API reference prose, some advanced guides, changelogs, migration documents, arbitrary errors and minigame content. Real v0.8.2 Tampermonkey/GM APIs, automatic update downloads, Firefox, Safari, Steam and mobile are unverified. Real unlocked saves for Source-Files, management modules, Sleeves, Stanek, IPvGO and augmentation purchases/installs were not tested. Other game versions or DOM-modifying plugins may conflict; switch to hover mode or disable the script if needed.

## Development

Node.js 22+ and npm are required for development. Local browser tests use Chrome by default.

```sh
npm ci
npm run build
npm run check
npm run test:browser
```

Without Chrome: run `npx playwright install chromium`, then `PW_CHANNEL=chromium npm run test:browser`. Official-site tests are opt-in with `npm run test:live` and use fresh isolated contexts. See [verification](docs/verification.md) and [maintenance](docs/maintenance.md).

GitHub Actions runs syntax, build-freshness, metadata/version, unit and local browser checks on pushes, pull requests and manual dispatch. It does not publish, commit or bump versions automatically.

## Attribution and license

Bitburner is by Daniel Y Xie and contributors. The target commit is `3162fd2590e221eadd0c0fbd46151913f7c4c41c`. Reference Chinese text comes from **FRzhuizhu**'s [PR #3068](https://github.com/bitburner-official/bitburner-src/pull/3068), which was closed without merge. Entries retain source commits, locations and review notes; supplements are identified separately. Current review is by Codex with `humanReviewed: false`, not human or official approval.

Independent implementation code is MIT licensed. Upstream material, derivative translations and reference fixtures retain **Apache 2.0 with Commons Clause**. The combined distribution is **source-available**, not unrestricted MIT, plain Apache-2.0 or an OSI-approved open-source distribution. Both license notices are embedded in the userscript. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
