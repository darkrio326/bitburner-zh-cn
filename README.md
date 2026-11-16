# Bitburner 简体中文汉化 · v0.7.0

[English](README.en.md) · [更新记录](CHANGELOG.md) · [验证范围](docs/verification.md) · [维护与发布](docs/maintenance.md)

适用于 [Bitburner 官方网页版](https://bitburner-official.github.io/) **v3.0.1** 的非官方 Tampermonkey 用户脚本。默认直接显示中文，支持悬停翻译、长文阅读和随时恢复英文。**只需安装一个脚本，词库已内嵌，无需其他文件或 Node.js。**

**[一键安装 / Install](https://raw.githubusercontent.com/darkrio326/bitburner-zh-cn/main/bitburner-zh-cn.user.js)**

> 发布准备状态：本地文件已整理好；该链接及自动更新需在仓库 `darkrio326/bitburner-zh-cn` 公开并推送到 `main` 后才可用。请勿把本地构建视为已公开发布。现在也可直接安装本目录的 `bitburner-zh-cn.user.js`。

## 安装与升级

1. 安装并启用 [Tampermonkey](https://www.tampermonkey.net/)，允许其在官方游戏网站运行。
2. 点击上方安装链接并确认，或新建用户脚本，粘贴 `bitburner-zh-cn.user.js` 的完整内容并保存。
3. 刷新游戏。右下角应出现“中文：开”“显示：直接”“阅读”。

旧版手动安装用户：**编辑原有脚本，替换全部内容后保存**，以获得更新元数据。不要同时启用两份汉化脚本。保留了原来的 `@name` 与 `@namespace`，以维持脚本身份。

发布后，Tampermonkey 根据版本号从 GitHub `main` 分支检查并下载更新；更新检查频率和启用状态由扩展设置控制，也可手动检查。`@updateURL` 与 `@downloadURL` 都指向同一个独立 `.user.js` 文件。参见 [Tampermonkey 元数据文档](https://www.tampermonkey.net/documentation.php)。**本轮未实测真实扩展安装或自动更新下载。**

## 使用

- **中文开关**：关闭后恢复脚本仍持有的原文，停用翻译观察器和待处理任务。
- **直接 / 悬停**：直接模式原位显示中文；悬停模式保留英文，鼠标停留约 180ms 后显示译文。
- **阅读**：固定最近译文，可滚动阅读长文；“收起”或 Esc 关闭。普通浮层不拦截点击。
- Tampermonkey 菜单中的“本页完全移除汉化（刷新恢复）”会恢复英文并清理宿主、监听和菜单，不改保存的偏好。

只把启停和显示模式保存在 Tampermonkey 存储中。脚本不访问游戏存档、localStorage 或 IndexedDB，不调用翻译 API、不上传游戏数据，也不加载远程词库。扩展自身的 GitHub 更新检查独立于游戏页面中的脚本运行。

## 覆盖

当前有 **4377 条已审校词条**，含 **150 条固定句式模板**；其中 1683 条来自中文 PR 差异，2694 条为标明来源的补译。另有 56 种 ASCII 地图地点标签，覆盖六城的 76 处显示。

| 区域 | 已收录内容 |
| --- | --- |
| 主界面 | 侧栏、概览、属性、设置、教程、脚本列表和创建程序 |
| 派系与强化 | 邀请、工作、捐赠、购买说明；137 项强化介绍及静态/动态效果 |
| 城市与工作 | 城市/地点、地图、36 类职位、12 类犯罪、课程训练与结算 |
| 其他玩法 | Hacknet、股票、移植、暗网界面、成就、离线提示、赌场主要控件和潜入说明 |
| 经营模块 | 帮派、Bladeburner、公司经营的主要页面、任务、说明和弹窗 |
| **v0.7 Source-File** | **Source-File 1–15 全部效果说明**，保留名称标识符、函数和数值 |
| **v0.7 文档** | **33 篇指南的正文文本**：首页、完整新手指南、18 篇基础机制、10 篇进阶介绍，以及编程入门、离线机制、冻结排查；含独立帮助弹窗识别 |

v0.7 新增 **1737 条**译文。精确文档清单见 [覆盖记录](docs/documentation-coverage.json)。公司经营本轮覆盖总览文档及目录，目录链接下的专题长文尚未全部补译。文档和列表中的程序、命令、代码、公式、API/数据标识符保留英文；未解锁的剧透入口仍由游戏控制。

这些数字表示固定源码中的匹配覆盖，**不代表全部游戏分支或解锁流程都已实测**。

## 实现与兼容边界

保留原有翻译实现：直接模式只写入现存节点的 `Text.data`，不替换、包裹或删除 React 节点，不写游戏元素的 `textContent` / `innerHTML`，不修改 React 状态、游戏源代码、构建文件或存档。游戏更新文字后重新匹配；恢复时只撤销脚本仍拥有的译文，不覆盖游戏的新内容。

- 独立 Shadow DOM 承载工具栏、悬停阅读和地图标签。地图原始 ASCII、空格、连线及点击字母不变，覆盖层穿透鼠标。
- 输入框、编辑器、终端、日志、代码块、文档行内代码和公式不翻译。公司/部门/产品/帮派成员等用户名称按源码 DOM 位置保护。
- 只匹配审校过的完整文本或明确分段；动态模板使用限定类型的变量，不使用模糊匹配、任意文本通配或在线翻译。
- 监听采用事件委托；动态更新合并处理，每批最多 400 个节点、6ms 软时间预算，无周期性全页扫描。
- 长按钮可换行；地点标题与文档正文避让右上角概览。停用时清理脚本添加的样式标记。

未来游戏版本、其他 DOM 插件或依赖英文显示文字的脚本可能发生冲突。遇到问题可切换悬停或关闭汉化。

## 验证与限制

本轮在 macOS Chrome 中检查了原有功能、33 篇文档的动态渲染与恢复、全部 Source-File 效果、链接与搜索，以及 900/1280 像素布局。官网测试使用**全新隔离上下文注入**，不使用用户存档。实际结果和证据见 [验证记录](docs/verification.md)。

尚未完成：全部 NS API 参考正文、所有进阶专题/更新日志/迁移文档、任意动态错误、全部小游戏内容。未验证真实 Tampermonkey/GM API、自动更新下载、Firefox、Safari、Steam、移动端，以及官网真实解锁存档中的 Source-File、经营模块、强化购买/安装和股票交易。代码与命令有意保留原文。

## 开发

需要 Node.js 22+ 与 npm；测试默认使用本机 Chrome。

```sh
npm ci
npm run build
npm run check
npm run test:browser
```

没有 Chrome 时：`npx playwright install chromium`，然后执行 `PW_CHANNEL=chromium npm run test:browser`。官网测试单独运行 `npm run test:live`。源码审校、词库维护、打包与发布流程见 [维护说明](docs/maintenance.md)。

GitHub Actions 在 push、pull request 和手动触发时检查语法、构建一致性、元数据/版本、单测与本地浏览器回归。它不会自动提交、发布或改动版本号。

## 来源、署名与许可

- Bitburner：Daniel Y Xie 及贡献者；目标提交 `3162fd2590e221eadd0c0fbd46151913f7c4c41c`。
- 参考译文：**FRzhuizhu** 的 [中文 PR #3068](https://github.com/bitburner-official/bitburner-src/pull/3068)；该 PR 已关闭，未合并。
- 原文、译文、来源提交/行号与审校说明保存在 `translations/zh-CN.json`；2255 条原始候选单独保留。当前审校由 Codex 完成，`humanReviewed: false`，不代表真人或官方审核。

独立实现代码采用 MIT；上游文本、派生译文与相关快照保留 **Apache 2.0 + Commons Clause**。因此完整分发物应称为**源码可用项目**，不能标成无附加限制的 MIT、纯 Apache-2.0 或 OSI 认可的开源发行物。完整脚本内嵌两类许可；详见 [LICENSE](LICENSE) 与 [第三方声明](THIRD_PARTY_NOTICES.md)。

## English overview

An unofficial, self-contained Simplified Chinese userscript for Bitburner v3.0.1. It provides reversible inline translation, hover reading, dynamic React support and ASCII map labels, while preserving code, commands, identifiers and save data. GitHub update metadata targets `darkrio326/bitburner-zh-cn/main`. The combined bundle is source-available under the licensing terms above. See [README.en.md](README.en.md) for installation, scope and limitations.
