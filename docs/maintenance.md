# 维护与发布 / Maintenance and publishing

## 目录

- `src/`：已验证的运行时，包含匹配、DOM 翻译、浮层及地图标签。
- `translations/zh-CN.json`：唯一正式词库；`candidates.json` 保留未经自动采用的 PR 候选。
- `scripts/`：构建、提取、来源覆盖审计、发布检查和打包。
- `tests/`：词库测试、按固定源码构造的 React/MUI 场景、官网隔离测试。
- `tests/fixtures/`：固定目标版本的摘录；沿用上游许可。
- `docs/*coverage.json`：可审计的覆盖清单，不代表真实解锁存档验收。
- `bitburner-zh-cn.user.js`：提交到仓库的最终单文件产物，用户安装此文件。

## 翻译维护

`en`、`zh`、`id` 分别为原文、采用译文和稳定标识。`scopes` 限定页面；`segment` 允许在悬停段落中组合；`selector` 可限定短词的元素；`inline: false` 表示仅悬停。模板需注明 `match: template` 和限定类型的 `slots`，中英文占位符必须完全一致。

`source` 保留源文件、提交、行号、原文摘录与原 PR 译文；补译标记为 `kind: supplement`。`review` 记录状态、执行者、日期及修改理由。未审校条目保持 `pending`；只有批准条目进入产物。`attribute: placeholder` 只用于明确审校过的输入提示；不得把用户输入值当作词条处理。不要直接编辑生成的 `.user.js`。

游戏结果弹窗可能在页面跳转后仍然存在。完整、已审校的消息可使用 `dialogs` 作用域，仅在弹窗内匹配；短片段仍使用按内容识别的业务作用域。`augmentationLines` 只接受已知强化名称及 NeuroFlux Governor 的整数等级，并保留原始名单与换行。

文档按 Markdown 实际渲染的文本节点分段。修改时必须检查链接、强调、代码相邻片段的中文语序和否定词，不能把匹配计数当作翻译质量验收。代码示例、命令、原生代码节点及 `span[class*="-code"]` 保留原文。

来源审计需要先下载参考源码：

```sh
npm run sources
npm run extract
node scripts/audit-primary.mjs
node scripts/audit-secondary.mjs
node scripts/audit-deep-pages.mjs
node scripts/audit-management.mjs
node scripts/audit-documentation.mjs
node scripts/audit-v071.mjs
node scripts/audit-advanced.mjs
node scripts/audit-dialogs.mjs
```

目标固定为 Bitburner v3.0.1 的 `3162fd2590e221eadd0c0fbd46151913f7c4c41c`，官方默认分支是 `dev`；它的更新不会自动改变适配目标。审计命令会刷新覆盖快照，修改后应查看实际差异。普通构建和单测不依赖源码缓存或网络。

## 本地验证

```sh
npm ci
npm run build
npm run check
npm run test:browser
npm run test:live
```

- `check` 检查所有 JS 语法、已提交产物是否等于重新构建结果、版本/元数据/许可与词库单测。
- 本地浏览器测试默认使用本机 Chrome；可使用 `PW_CHANNEL=chromium` 与 Playwright Chromium。
- 官网测试使用新建隔离上下文，只执行测试中注明的操作，不读取用户配置或存档。不要把脚本注入结果描述成真实 Tampermonkey 安装验收。
- `output/` 和 `test-results/` 是本地结果，不提交。对外验证记录写在 `docs/verification.md`，不得把本机绝对路径或原始浏览器配置放入公开证据。

派系回归：`node scripts/audit-factions.mjs` 核对固定源码文本和来源；`tests/factions.spec.mjs` 复现 The Black Hand 名称冲突、同名强化弹窗、特殊行动、捐赠输入与恢复。

## 版本与更新

采用 `MAJOR.MINOR.PATCH`：破坏性变更升主版本，兼容的新功能/覆盖扩展升次版本，修复升补丁版本。`package.json` 是版本真源；构建生成 `@version`，检查同时核对 lockfile、README 与 CHANGELOG。每次更新词库或代码，都应提高版本，否则 Tampermonkey 可能不会获取更新。

`@name` 和 `@namespace` 保持稳定，避免改变脚本身份。地址按 `package.json` 的 repository 派生：

- `@homepageURL`：GitHub 仓库。
- `@supportURL`：仓库 Issues。
- `@updateURL` / `@downloadURL`：`main/bitburner-zh-cn.user.js` 的 Raw 地址。

发布步骤：

1. 完成译文、来源与功能检查，更新版本、两份 README、CHANGELOG 和验证记录。
2. 运行 `npm install --package-lock-only`、`npm run build`、`npm run check` 与相关浏览器回归。
3. 运行 `npm run package`，生成完整 ZIP 和 `SHA256SUMS`。打包使用系统 Python 3 的标准库，不需要额外 Python 包。
4. 初次公开时，将本项目文件推送到 `darkrio326/bitburner-zh-cn` 的 `main`。后续通过正常 PR 更新。检查 exact commit 的 Actions 结果。
5. 读取 GitHub Raw 文件，核对版本和哈希；确认一键安装可用后，更新 README 中的发布准备说明。可为同一提交添加 `vX.Y.Z` tag 和 GitHub Release，附上单文件脚本与完整包。
6. 最后用真实 Tampermonkey 安装/更新检查，确认扩展收到新版本；未完成时在交付说明中保留这个限制。

GitHub Actions 只有读取权限，运行检查，不自动发布或 bump。指向 main 的更新意味着进入 main 的新版本会供用户获取；维护者应在合入前完成检查。公开发布无需上传 `.cache`、`node_modules`、历史 ZIP、原始测试输出或用户存档。

## 许可

独立实现使用 MIT。上游英文、中文 PR 派生文本和固定测试摘录保留 Apache 2.0 with Commons Clause；完整分发物同时包含两类材料。不能用独立代码的 MIT 许可覆盖上游限制，也不能省略 FRzhuizhu 或 Bitburner 的署名。详见根目录 `LICENSE` 和 `THIRD_PARTY_NOTICES.md`。

## English release checklist

Bump the semantic version, update both READMEs and the changelog, rebuild the
standalone file, run `npm run check` and relevant browser regressions, then run
`npm run package` (Python 3 standard library required). Publish the same checked
files to `main`, verify the exact GitHub Actions run and Raw file, and test the
real Tampermonkey install/update path before claiming that acceptance. Preserve
both licenses and all translation provenance. Local test output and caches do
not belong in the public repository.
