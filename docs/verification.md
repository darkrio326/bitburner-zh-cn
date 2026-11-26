# v0.8.2 验证记录

日期：2026-11-26（Asia/Shanghai）。目标：Bitburner v3.0.1，固定提交 `3162fd2590e221eadd0c0fbd46151913f7c4c41c`。

## 原因与修复

The Black Hand 同时出现在派系与强化名称表。`scopeResolver.page()` 原先先匹配强化标题，把派系主页面判定为 `augmentations`，导致已有派系词条未生效。主页面现在先识别派系名；公司地点仍优先依据 Return to World 区分，Modal 内的同名强化继续由独立弹窗识别。

启用现有捐赠金额词条的 placeholder 标记，保留输入值；为 Bladeburners 传闻添加两条限定于 `i` 元素的文本分段，保留 NSA。没有重写匹配、翻译或观察器实现。

## 截图场景复现

使用固定源码 FactionRoot、Info、GangCampaign 的 React/MUI 结构，在本地显示 The Black Hand 派系页面。v0.8.1 基线中派系简介和 Hacking Contracts 按钮保持英文；v0.8.2 下介绍、特殊行动、工作说明、捐赠门槛与购买强化按钮显示中文。

验证 34 个派系标题均使用派系范围；同名 The Black Hand 强化购买弹窗仍使用强化范围。打开特殊行动、创建帮派说明，检查密文线索保留；模拟工作、购买、帮派和捐赠回调参数保持原值，未执行实际游戏操作。声望从 1.125 更新为 98.765k，保留 React Text 节点。页面切换、悬停、启停和完全移除均检查。

## 来源覆盖

扫描 12 个固定源码文件、244 个文本项，其中 184 个普通文本/标签/模板匹配通过，60 个 ASCII 图案片段、密文线索或符号原样保留。包含两种帮派说明模板；这不代表所有动态分支、加入条件或游戏页面均已实机覆盖。详见 [派系覆盖记录](faction-coverage.json)。词库共 4844 条，含 187 条限定模板。

执行 `node scripts/audit-factions.mjs`、`npm run build`、`npm run check`、`npm run test:browser` 和 `npm run test:live`。最终计数与产物哈希见 [机器可读验证记录](verification-v0.8.2.json)。历史 [v0.8.1 验证记录](verification-v0.8.1.json)保留。

## 回归结果

- Node 单测 28 项通过，0 失败。
- 本地 Chrome/React 浏览器 60 项通过，0 失败；4 项官网测试另行运行。
- 官网隔离回归 4 项通过，0 失败，确认官网仍为 v3.0.1。
- 本地计时 110 帧、官网计时 194 帧无英文闪帧，React 节点身份保持。
- 构建、语法、版本元数据与来源审计通过。

## 证据边界

本记录及 JSON 保存发布前的本地验证快照；GitHub main、Actions 与公开脚本回读分别证明远端交付。派系截图为源码结构的本地复现。官网回归使用新建隔离上下文，不读取用户存档；用户自行更新 Tampermonkey 并验收真实存档汉化。原始截图、trace 和完整测试输出留在本地，不进入公开包。
