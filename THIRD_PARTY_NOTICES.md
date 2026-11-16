# Third-party notices / 第三方来源与许可

This is an unofficial companion to Bitburner, not an official Chinese release.
这是非官方伴随脚本，不代表 Bitburner 官方或参考译者认可。

## Bitburner

- Authors: Daniel Y Xie and Bitburner contributors.
- Repository: https://github.com/bitburner-official/bitburner-src
- Target: v3.0.1, commit `3162fd2590e221eadd0c0fbd46151913f7c4c41c`.
- Original license: [license.txt at the target commit](https://github.com/bitburner-official/bitburner-src/blob/3162fd2590e221eadd0c0fbd46151913f7c4c41c/license.txt).
- Applicable terms: **Apache 2.0 with Commons Clause**, reproduced verbatim in [licenses/Bitburner.txt](licenses/Bitburner.txt).
- Included material: English source excerpts, derived Simplified Chinese translations, city-map labels, source snapshots used by coverage tests, and provenance records.

## Reference Chinese translation

- Contributor: **FRzhuizhu**.
- Reference: [Chinese translation PR #3068](https://github.com/bitburner-official/bitburner-src/pull/3068), closed without merge.
- English base: `2dc5ab15a1d8a7acf50021cf32ea4108a4b672e7`.
- Chinese head: `b68cee85d4c507f8902ff5d0701641dc1edf59c7`.
- The PR's repository retains the upstream license. No separate permission to relicense the translation as MIT or unrestricted Apache-2.0 was identified. This project retains the upstream terms and credits the contributor.

Translations are selected from verified diff pairs, checked against v3.0.1, and edited for terminology, meaning and DOM segmentation. Additional translations are explicitly marked `source.kind: supplement`. The runtime is independently written. Machine review is recorded as `humanReviewed: false`; neither upstream nor independent human approval is claimed.

翻译并非直接发布整个中文分支：候选保留原文与原译文，只有已审校项目进入脚本；补译单独标记。原始来源、提交、行号、修改说明位于 `translations/zh-CN.json` 与 `translations/candidates.json`。

## Distribution boundary

Independent implementation code is MIT licensed. The full userscript includes upstream-derived material and retains **both** the MIT notice and the complete Bitburner license, including Commons Clause. See [LICENSE](LICENSE). Commons Clause includes a restriction on selling the covered software; the combined distribution is described here as **source-available**, not unrestricted open source. See the [Commons Clause project](https://commonsclause.com/) for its explanation.

The upstream license was compared with both the pinned target and the reference translation head. No upstream NOTICE file is present at those pinned revisions. Dependencies used only for building and testing are listed in `package-lock.json`; they are not bundled into the standalone script.
