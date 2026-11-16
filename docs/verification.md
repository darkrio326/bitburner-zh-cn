# v0.7.0 验证记录

日期：2026-11-16（Asia/Shanghai）。目标：Bitburner v3.0.1，提交 `3162fd2590e221eadd0c0fbd46151913f7c4c41c`。本机环境：macOS arm64、Node.js 25.9.0、Playwright 1.56.1、Chrome 157。GitHub Actions 已在 Ubuntu 24.04 + Node.js 22 + Playwright Chromium 上通过；精确提交与运行链接见下方。

本轮扩展 Source-File 和文档词库，并完成公开仓库与安装/更新地址验证。保留既有匹配器、Text.data 替换、悬停阅读、地图覆盖和恢复机制，仅扩展文档识别、行内代码排除与文档布局。

## 实际检查

| 层次 | 验证范围 |
| --- | --- |
| 来源审计 | 15 个 Source-File 的效果正文；33 篇指南的 Markdown 文本节点；新增 1737 条补译的原文摘录、固定提交与行号。未执行游戏源码或读取存档。 |
| Node 单测 | 20 项：新增文档/Source-File 覆盖与作用域隔离；保留原有词库、模板、标识符、成就、城市、经营模块与独立构建检查。 |
| 本地 Chrome/React | 42 项：原有 38 项及新增 4 项。逐页验证 33 篇文档的每个可翻译文本节点、代码文本一致、英文恢复、链接事件和搜索输入；Source-File 1–15 切换、数值和名称保留；弹窗、悬停阅读与清理；900/1280 像素文档避让概览。 |
| 官网 Chrome 注入 | 4 项：原有导航/编辑器、地图/成就/离线、深层城市/课程回归；新增文档首页、完整新手指南、终端/脚本说明、NS API 搜索、代码原文、返回首页、英文恢复与 900/1280 布局。 |
| 发布检查 | JS 语法、重复构建字节一致、package/lockfile/元数据/README/CHANGELOG 版本一致、GitHub main Raw 地址、单文件无运行时依赖、两类完整许可内嵌。 |
| 许可来源 | 本地保存的上游许可与固定 v3.0.1、中文 PR head 的 `license.txt` 字节一致；两个固定版本根目录均无 NOTICE 文件。 |

执行命令：`npm ci`、`npm run check`、`npm test`、`npm run test:live`，以及五项 `audit-*.mjs` 来源审计。默认浏览器运行中的官网项为显式跳过，由 `test:live` 单独执行。汇总见 [verification-v0.7.0.json](verification-v0.7.0.json)。

## GitHub 托管与下载验证

- 公开仓库：[darkrio326/bitburner-zh-cn](https://github.com/darkrio326/bitburner-zh-cn)，默认分支 `main`。
- [GitHub Actions 通过记录](https://github.com/darkrio326/bitburner-zh-cn/actions/runs/43829562032)，测试提交 `4dafdb219855fd534a4b517d165a119d0b61eaf3`：20 项单测、42 项浏览器回归通过，4 项官网测试按配置跳过；官网测试仍以上方本机独立执行结果为准。
- 首次托管发现 Ubuntu 26.04 与 Playwright 1.56.1 不兼容，已固定 runner 为 Ubuntu 24.04。文档悬停用例显式分别定位链接和正文，避免不同字体换行使鼠标中心落在嵌套链接上；本机该用例连续执行 3 次通过。
- 匿名访问 [main Raw 安装/更新文件](https://raw.githubusercontent.com/darkrio326/bitburner-zh-cn/main/bitburner-zh-cn.user.js) 返回 HTTP 200，版本 `0.7.0`，SHA-256 为 `dc24bd5709693fc1b7495445d5e1315555643de7745929f54ace789458c2f859`，与本地构建一致。`@updateURL`、`@downloadURL` 与安装链接均指向该文件。
- 本记录指向已经完成的测试提交；最终发布提交、CI 和附件校验值见 [GitHub Releases](https://github.com/darkrio326/bitburner-zh-cn/releases)。地址可用不等于真实 Tampermonkey 自动更新验收。

## 操作范围

官网用例各自使用全新隔离浏览器上下文，不读取用户浏览器配置或存档。原有回归仅在新测试游戏中进行导航、未保存的 Monaco 编辑、正常保存/重载离线测试、免费课程开始/停止，以及潜入介绍的查看/取消。新文档用例只导航、搜索和切换汉化。

没有执行脚本、购买、赌博、交易、导入或篡改存档、提交暗网密码、安装或移植强化，也没有访问内部 Player 状态。Source-File 和经营模块的真实解锁分支仍仅有源码与本地 React 场景覆盖。

## 证据

- [精确文档与 Source-File 覆盖](documentation-coverage.json)
- [强化覆盖](primary-coverage.json)、[城市/成就](city-achievements-coverage.json)、[深层页面](deep-pages-coverage.json)、[经营模块](management-coverage.json)
- [官网 900 像素新手指南](images/v0.7-beginner-900.png)
- [本地 Source-File 15 场景](images/v0.7-sourcefile-15.png)

原始 Playwright JSON、截图与失败时的 trace 留在本地 `output/playwright/`、`test-results/`，不进入公开包。公开汇总不包含本机绝对路径。

## 明确未验收

- 真实 Tampermonkey 安装、GM API、自动更新版本检查与下载。
- Firefox、Safari、Steam、移动设备、长时间高负载和其他游戏版本。
- 官网真实解锁存档中的 Source-File、经营模块、强化购买/安装与股票交易。
- 全部 NS API 参考正文、其他进阶专题、全部更新日志/迁移文档，以及任意游戏错误和小游戏内容。

**源码覆盖、机器审校、本地测试、官网注入、GitHub 发布及扩展安装/更新是不同层次，不能互相代替。**
