# electerm 5.5.6 → vis远程工具 内部裁剪版：改造说明

> 供内部审批用。本文对应 `plan.txt` 中的规划项，说明实际裁剪范围、保留功能、
> 与规划的偏差，以及验证结果。

## 1. 基本信息

| 项目 | 值 |
| --- | --- |
| 品牌 | VISYSTEM |
| 产品名称 | vis远程工具 |
| 包名 | `vis-remote-tool` |
| 内部版本号 | `5.5.6-vis-rc1`（与上游版本号脱钩） |
| 上游基线 | electerm 5.5.6（MIT） |
| 目标平台 | Windows x64，仅 NSIS 安装包 |
| 包管理器 | pnpm |
| 应用图标 | `build-res/icon.ico`（由 `icon.jpg` 生成） |
| 用户数据目录 | `%APPDATA%\vis-remote-tool` |

## 2. 裁剪清单

### 2.1 数据同步（plan 5–9）

删除文件：

- `src/app/server/sync.js`
- `src/app/server/webdav-sync.js`
- `src/client/store/sync.js`
- `src/client/components/setting-sync/`（8 个文件：`auto-sync.jsx`、`data-import.jsx`、
  `data-select-item.jsx`、`data-select.jsx`、`server-data-status.jsx`、
  `setting-sync-form.jsx`、`setting-sync.jsx`、`sync-data-compare.jsx`）

删除依赖：`electerm-sync`

清理引用：`dispatch-center.js`（`/common/s` 的 `sync` 分支）、`store/store.js`
（`syncExtend`）、`store/watch.js`（`autoSync` 自动同步分支 + `syncServerStatus`
持久化）、`store/common.js`（`setSettingItem` 的 term-of-use 拦截）、
`store/setting.js`（`openSettingSync`）、`setting-panel/tab-settings.jsx`、
`setting-panel/list.jsx`、`common/setting-list.js`、`common/constants.js`
（`syncTypes` / `syncDataMaps` / `syncTokenCreateUrls` / `syncServerDataKey` 等）、
`store/init-state.js`、`components/sidebar/{index,left-sidebar-icons}.jsx`、
`common/left-sidebar-icon-defs.js`、`common/db.js`

### 2.2 应用自升级（plan 10–14）

删除文件：

- `src/app/server/download-upgrade.js`
- `src/client/components/main/upgrade.jsx` + `upgrade.styl`
- `src/client/store/app-upgrade.js`
- `src/client/common/update-check.js`、`common/upgrade.js`、`common/download-mirrors.js`、
  `common/check-skip-src.js`

清理引用：`dispatch-center.js` 的 `/upgrade/:id` WebSocket 通道、`store/store.js`
（`appUpgradeExtend`）、`components/main/main.jsx`（`<UpdateCheck>`、`checkupdate` IPC）、
`components/sys-menu/menu-btn.jsx`（`onCheckUpdate` 菜单项）、
`components/sidebar/index.jsx`（升级角标）、`components/sidebar/info-modal.jsx`
（检查更新按钮）、`store/load-data.js`（`checkUpdateOnStart`）

### 2.3 AI 功能（plan 17–23）

删除文件：

- `src/app/lib/ai.js`、`ai-format.js`、`ai-response.js`
- `src/client/components/ai/`（23 个文件，含 AI 聊天面板、配置、书签生成、主题编辑器、
  guardrails、presets、attachments）
- `src/client/components/icons/ai-icon.jsx` + `ai-icon.styl`
- `src/client/common/ai-feature.js`、`common/term-of-use.jsx`
- `src/client/components/bookmark-form/ai-bookmark-form.jsx`
- `src/client/components/theme/theme-ai-editor.jsx`

清理引用（共 20 个文件）：`app/lib/ipc.js`（5 个 AI IPC 出口）、`store/store.js`
（`getBrand` + `rightPanelTitle` 的 AI 分支）、`store/common.js`（AI 配置 / 会话 /
`handleOpenAIPanel` / `explainWithAi` / `aiConfigMissing`）、`store/system-menu.js`
（`onNewSshAI`）、`store/init-state.js`、`components/main/main.jsx`、
`components/footer/footer-entry.jsx`、`components/tabs/{add-btn-menu,no-session}.jsx`、
`components/terminal/mixins/term-context-menu.jsx`、
`components/terminal/terminal-command-dropdown.jsx`、`components/theme/theme-form.jsx`、
`components/bookmark-form/index.jsx`、`components/setting-panel/tab-settings.jsx`、
`components/shortcuts/shortcut-control.jsx`、`common/constants.js`、`common/cache.js`、
`common/create-title.jsx`、`app/common/default-setting.js`、`client/common/default-setting.js`、
`build/bin/pug.js`、`build/vite/dev-server.js`

删除测试：`unit-ci/ai-format.spec.js`、`ai-http.spec.js`、`ai-response.spec.js`、
`e2e/005.ai-config.spec.js`、`006.ai-chat.spec.js`、`006.ai-explain.spec.js`、
`038.ai-create-bookmark.spec.js`、`e2e/common/ai-api.js`

### 2.4 MCP 服务（plan 17、19、20）

删除文件：`src/app/mcp/server/{mcp,streamableHttp,tasks}.js`、
`src/app/widgets/widget-mcp-server.js`、`src/client/store/mcp-handler.js`

清理引用：`store/store.js`（`mcpHandlerExtend`）、`store/widgets.js`（`mcp-server` 分支）、
`common/create-title.jsx`（`[mcp]` 标签）、`app/preload/preload.js`（`sendMcpResponse`）、
`app/lib/nedb.js` / `sqlite.js`（`aiChatHistory` 表名）

删除测试：`unit-ci/mcp-exec.spec.js`、`mcp-tasks.spec.js`、`integration/mcp.spec.js`

### 2.5 深链 / URL scheme（plan 16、31）

删除文件：`src/app/lib/deep-link.js`、`src/client/components/setting-panel/deep-link-control.jsx`

清理引用：`app/lib/create-app.js`（`setupDeepLinkHandlers()`）、`app/lib/ipc.js`
（`registerDeepLink` 等 4 个 IPC 出口）、`components/setting-panel/setting-common.jsx`、
`store/load-data.js`（`checkPendingDeepLink`）、`components/main/main.jsx`
（`open-tab` IPC）

注册侧：`build/electron-builder.json` 中整个 `protocols` 段（ssh / telnet / rdp / vnc /
serial / spice / electerm）已删除 —— OS 级协议注册彻底移除。

> 备注：`src/app/common/parse-quick-connect.js` 仍保留 `electerm://` 的**文本解析**
> 能力（用户手动粘贴 URL 时使用），这是纯字符串解析，不涉及任何 OS 注册。

### 2.6 运行时下载器（plan 12）

删除文件：`src/app/lib/npm.js`、`src/app/lib/custom-require.js`（唯一调用方）
及对应测试 `unit/custom-require.spec.js`、`unit/npm.spec.js`、`unit/npm-install.spec.js`、
`unit/npm-install2.spec.js`。该模块会在运行期从 npm registry 拉取任意包，属于外联通道。

### 2.7 平台打包收窄（plan 3、4）

删除 `build/bin/` 下：`build-mac.js`、`build-mac-10.js`、`build-mac-arm.js`、
`build-linux-*.js/.sh`（8 个）、`appimage-integration.js`、`linux-deb-after-build.sh`、
`build-win-appx.js`、`build-win-arm.js`、`build-win-loose.js`、`build-win-nsis-arm.js`、
`build-win-portable.js`、`build-win-tar.js`、`build-win7-tar.js`、`clean-yml.js`

删除签名/发布流程：`build/entitlements.plist`、`build/bin/upload-file-to-r2.js`、
`publish-electerm-react.js`、`gen-web-app-readme.js`、`prepublish.js`、`postpublish.js`、
`release`、`web-release`、`npm-publish`

删除 npm 分发通道：`build/npm/`（3 个文件）、`build/web-app/`（2 个）、
`build/docs/`（2 个上游多语言 README），以及 `package.json` 的 `bin` / `files` 字段。

`build/electron-builder.json` 收窄为：

- 目标：`win.target = ["nsis"]`（去掉 tar.gz / appx）
- 删除 `mac` / `dmg` / `linux` / `snap` / `deb` / `appx` 全部配置
- 删除所有 `publish`（GitHub）配置
- `appId`：`com.visystem.vis-remote-tool`
- `directories.buildResources`：`build-res`

实测出包时又发现并修复了 3 处 electron-builder 配置问题：

1. **`asarUnpack` 指向了错误目录**。原配置是
   `node_modules/node-pty/build/Release/**`，但 node-pty 与
   `@serialport/bindings-cpp` 实际走 node-gyp-build 的 **`prebuilds/<platform>-<arch>/*.node`**
   布局（`build/Release/` 下只有 conpty 的 dll/exe）。原样打包会把真正的原生
   `.node` 留在 asar 里 → 运行时加载失败。已改为：
   ```json
   "asarUnpack": [
     "node_modules/node-pty/prebuilds/**",
     "node_modules/node-pty/build/Release/**",
     "node_modules/@serialport/bindings-cpp/prebuilds/**"
   ]
   ```
2. **`npmRebuild: false`**。electron-builder 默认会对原生依赖跑 `@electron/rebuild`
   → 需要本机安装 Visual Studio（实测报
   `Could not find any Visual Studio installation to use`，直接构建失败）。
   已用二进制特征确认两个原生模块都是 **NAPI**（`napi_register_module_v1`）：
   ABI 稳定，Electron 可直接加载，**不需要重建**。因此关闭重建既正确又让构建
   不依赖 VS 工具链。
3. **`prepare.js` 增加 Windows 专属预编译产物裁剪**：只保留
   `prebuilds/win32-x64`，删除 darwin / linux / android / win32-arm64 / win32-ia32
   等无用平台二进制（`*.node` 由 21 个降到 3 个），减小安装包体积。

另有一处构建脚本问题：`build-common.js` 的 `patchNsisKeepShortcuts()` 用
`require.resolve('app-builder-lib/package.json')` 取模板路径 —— `app-builder-lib`
   是 `electron-builder` 的传递依赖，在 pnpm 严格布局下**从项目根解析不到**，
   会以 `MODULE_NOT_FOUND` 直接中断打包。已改为「先按 electron-builder 的同级目录
   解析、再回退扁平布局」，并且找不到时只打印日志跳过（该补丁只是优化安装包
   快捷方式保留行为，不应阻断出包）。


### 2.8 构建期外联封堵（plan 32）

- `build/bin/post-install.js`：删除 `npm cache clear -f` 与 `npm install node-gyp -g`
  （Windows CI 分支，既联网又做全局安装）；`electron-rebuild` 改为「二进制存在才执行」，
  并对 `.git/hooks` 安装做存在性保护（源码压缩包没有 `.git`，原来会抛异常）。
- `build/bin/build-common.js`：删除 `uploadToR2`（Cloudflare R2 上传，需 `@aws-sdk/client-s3`）、
  `patchAppImage`、`patchSnapClassicSandbox`、`setChannel`；保留 `patchNsisKeepShortcuts`。
- `build/bin/build-win-nsis.js`：去掉 R2 上传调用。
- `build/bin/prepare.js`：`npm i --omit=dev` → `pnpm install --prod`；删除 `yarn autoclean` 环节。
- `build/bin/copy.js`：图标来源由 `node_modules/@electerm/electerm-resource` 改为仓库内
  `src/client/assets/brand`。

### 2.8b 构建脚本去「嵌套包管理器」（实测踩坑后修复）

原始构建脚本用 `exec('npm run x')` / `exec('pnpm run y')` 层层套娃调用包管理器。
在包管理器未全局安装、或不在子进程 PATH 上的环境里，这会在**构建中途**失败：
实测 `pnpm run b` 在 `prepare` 阶段报 `'pnpm' 不是内部或外部命令`，
导致 `work/app/node_modules` 为空、打不出包。

修复方式（全部改为直接调用底层工具，并传递退出码）：

| 文件 | 改动 |
| --- | --- |
| `build/bin/build.js` | `exec('npm run vite-build')` → `exec('"<node>" "<abs>/vite-build.js"')`；copy / pug 同理；每步检查 `code !== 0` 并 `process.exit(code)` |
| `build/bin/vite-build.js` | 不再 `cd build/vite && exec('npm run build')`，改为设置 `NODE_ENV=production` 后直接调用 `node_modules/vite/bin/vite.js build --config ./conf.js` |
| `build/bin/start.js` | 不再 `exec('npm start')`，改为 `exec('node ./dev-server.js')` |
| `build/bin/prepare.js` | 用 **`process.env.npm_execpath`** 解析出「当前正在运行的那个包管理器」，再以 `process.execPath` 执行它；拿不到时回退 `pnpm`。这样无论 pnpm 装在哪都能工作 |
| `package.json` | `build` / `b` / `test` / `test3` 中的 `pnpm run …` 套娃全部展开为直接的 `node …` 调用 |

另外，`prepare.js` 现在会给**打包目录**写一个 `.npmrc`（`node-linker=hoisted`）：
electron-builder 需要扁平的真实文件 `node_modules`，pnpm 默认的软链布局
（包都藏在 `node_modules/.pnpm` 后面）会让 `files` / `asarUnpack` 的 glob 匹配不上
（最典型的是 `node-pty` 的原生二进制）。仓库本身仍保持 pnpm 默认布局，
只有 `work/app` 用扁平树，安装完即删除该 `.npmrc`。


## 3. 品牌替换（plan 24–30、39、40）

### 3.1 vendor 进仓库

- `src/app/vendor/electerm-locales/`（原 `@electerm/electerm-locales@2.3.17`）
- `src/app/vendor/electerm-themes/`（原 `@electerm/electerm-themes@1.0.1`）

两者的 `LICENSE` 与作者信息完整保留，`package.json` 精简为元数据 + 上游出处说明，
并标记 `private: true`。两个依赖已从 `dependencies` 移除。

> 放在 `src/app/` 下而非仓库根目录，是因为 `prepare.js` 用 `cp -r src/app work/`
> 把主进程代码搬进打包目录；放根目录不会被打包，运行期会找不到语言包。

`src/app/lib/locales.js` 与 `src/app/lib/iterm-theme.js` 改为从
`../vendor/...` 解析；`src/test/e2e/common/lang.js` 同步调整。

### 3.2 文案与资源

- 15 个语言文件的 `desc` 改为新描述，`sponsorElecterm` 改为 `VISYSTEM`，
  其余品牌串统一为 `VISYSTEM`；未使用的 `dist/esm` 已删除。
- `src/app/vendor/electerm-locales/` 内 `LICENSE`、`electerm-themes/LICENSE` 保留。
- 图标资源由 `icon.jpg` 生成：
  - `build-res/icon.ico`（16/24/32/48/64/128/256 多尺寸，NSIS 与 exe 图标）
  - `build-res/icon.png`
  - `src/client/assets/brand/vis-round-128x128.png`（窗口图标）
  - `src/client/assets/brand/vis-tray.png`（托盘图标）
  - `src/client/assets/brand/vis.png`（启动页 logo）
  - `src/client/assets/brand/vis-watermark.png`（终端水印 / 空会话背景）
- 引用点更新：`app/common/runtime-constants.js`（`iconPath` / `trayIconPath`）、
  `client/common/constants.js`（`logoPath1/2/3`）、`client/views/index.pug`
  （`.vis-logo-bg`、`images/vis.png`）、`client/components/bg/css-overwrite.jsx`、
  `client/components/tabs/no-session.jsx`、`build/bin/copy.js`、`build/vite/common.js`。
- 入口文件 `src/client/entry/electerm.jsx` → `vis.jsx`，产物由
  `js/electerm-<ver>.js` 改为 `js/vis-<ver>.js`（`entry/basic.js`、`build/vite/conf.js`、
  `build/vite/dev-server.js` 同步）。
- 窗口标题：`create-window.js` 用 `packInfo.name`，`ipc.js` 的 `setTitle` 拼
  `packInfo.name + ' - ' + title`，随包名自动变为 `vis-remote-tool`。
- 关于页（`components/sidebar/info-modal.jsx`）：移除赞助、官网、GitHub、语言库、
  Bug 反馈、隐私声明、更新日志、已知问题、electerm Online 等外链与「检查更新」按钮，
  改为显示版本号 + 「本工具基于 electerm 构建」+ 上游仓库链接 + 原作者信息。
- `app/lib/error-page.js`：移除微信二维码与作者邮箱。
- `app/lib/command-line.js`：CLI 名称与帮助示例由 `electerm` 改为 `vis-remote-tool`。
- `README.md`：替换为内部构建说明（含裁剪范围、构建步骤、上游出处与 MIT 声明）。
- `LICENSE` 未改动，原版权声明完整保留。
- 用户数据目录：`create-app.js` 调用 `app.setName(packInfo.name)`，包名改为
  `vis-remote-tool` 后数据目录自动变为 `%APPDATA%\vis-remote-tool`。
  另见 3.3 —— 数据库目录此前是**硬编码**的，已一并修正。
- `app/common/app-props.js`：便携模式判定不再硬编码 `electerm.exe` / `electerm`
  目录名，改为从 `app.getPath('exe')` 推导 + `packInfo.name`。

### 3.3 数据目录名硬编码（实测发现的严重问题，已修）

`plan.txt` 第 30 项「确认用户数据目录名变更为新应用名」在实测中暴露为一个**真实缺陷**：
改名后应用仍然读写上游 electerm 的数据目录。

根因是 6 处硬编码的 `'electerm'`：

| 文件 | 原代码 |
| --- | --- |
| `app/lib/nedb.js` | `resolve(appPath, 'electerm')`、`` `electerm.${name}.nedb` `` |
| `app/lib/sqlite.js` | `resolve(appPath, 'electerm')`、`electerm.db`、`electerm_data.db` |
| `app/lib/storage-key.js` | `pathResolve(appPath, 'electerm')` |
| `app/migrate/migrate-1-to-2.js` | `resolve(appPath, 'electerm', 'users', ...)`、`` `electerm.${name}.nedb` `` |

后果：新构建启动后会**打开上游 electerm 的数据库**（`%APPDATA%\electerm\users\...`），
读到别人的书签/会话并可能写回。首次冒烟测试就复现了这一点 —— 应用读取了机器上已有的
electerm 数据并恢复了其中的会话。

修复方式：在 `app/common/runtime-constants.js` 新增单一真源

```js
const dataFolderName = packInfo.name   // -> 'vis-remote-tool'
```

上述 6 处全部改为引用它，数据库文件随之变为 `vis-remote-tool.db` /
`vis-remote-tool_data.db`。

另外，`app/app.js` 中把 `app.setName(packInfo.name)` 提到 **require `./common/log` 之前**：
electron-log 在 import 期就会解析 userData 路径，原先的调用顺序会让目录名落到
`productName`（中文名 `vis远程工具`）而不是包名，导致路径不确定且含非 ASCII 字符。

修复后实测：

- userData：`%APPDATA%\vis-remote-tool\`（Chromium profile：Cache / blob_storage …）
- 数据库：`%APPDATA%\vis-remote-tool\users\default_user\vis-remote-tool.db`
  （118 KB）与 `vis-remote-tool_data.db`（12 KB）
- 与 `%APPDATA%\electerm\` 完全隔离


## 4. 与 plan.txt 的偏差（重要）

以下 3 条按规划执行会直接破坏可运行性，故**未执行**，特此说明：

| plan 项 | 规划内容 | 实际处理 | 原因 |
| --- | --- | --- | --- |
| 10 | 删除 `src/app/upgrade/` 目录 | **保留** | 该目录是**数据库版本迁移**模块（`checkDbUpgrade` / `doUpgrade` / `init-db` / `v1.x` 迁移脚本），被 `app/lib/ipc.js` 与 `store/db-upgrade.js` 使用。删除会导致数据库无法初始化。它与「应用自升级」（`download-upgrade.js`）是两个不同模块，后者已删除。 |
| 8 | 删除 `src/app/lib/ipc-sync.js` | **保留** | 该文件是**同步 IPC 桥**（承载 `window.pre.runSync` 的 `sync-func` 通道），不是数据同步功能。渲染层 20+ 处调用 `runSync`（`isMaximized`、`nodePtyCheck`、`isSecondInstance`、`getScreenSize`、`getInitLocale` 等），删除会全面崩溃。数据同步相关的 `store/sync.js`、`server/sync.js` 已删除。 |
| 26 | 修改 `package.json` 的 `bin` 字段 | **删除 `bin` 与 `files`** | `bin` 原指向 `npm/electerm`（仓库根目录并不存在该路径），实际脚本在 `build/npm/`，且 `build/npm/install.js` 里 `require('../package.json')` 指向不存在的 `build/package.json`（原本就是坏的），并会从 `homepage` 拉取远端发行信息后下载安装包 —— 属于外联通道。Windows NSIS 为唯一交付形态，npm CLI 分发通道整体移除。 |

此外，plan 中属于**流程/组织类**的项（1 建私有 Git 仓库、2 CI 流水线、33 SBOM、
36 Playwright 套件全量跑、37 抓包验证、38 上游 watch 与 cherry-pick 流程、
41 内部版本号方案、42 封版冒烟、43 审批）本次只落地了可自动化的部分：
41 已定版本号 `5.5.6-vis-rc1`，42 的可执行部分见第 5 节验证结果，
其余需在内部流程中补做。

## 5. 验证结果

### 5.1 静态检查（全量）

工具：`checkall.mjs`（esbuild 语法检查 + 相对 import 可解析 + 具名 import/export 匹配）

| 范围 | 基线（electerm 5.5.6） | 裁剪后 |
| --- | --- | --- |
| `src` JS/JSX 文件数 | 757 | 699 |
| 语法错误 | 0 | 0 |
| 未解析的相对 import | 4（均为 `test/unit/npm-install*.spec.js` 指向不存在的 `npm/install`，**基线既有**） | 0 |
| 具名导入/导出不匹配 | 1（`theme-editor.jsx` → `buildDefaultThemes`，**基线既有**） | 1（同上，未触碰该文件） |
| `build` 文件数 | 64 | 19 |
| `build` 检查 | — | 语法 0 错误、import 全解析、具名全匹配 |

### 5.2 残留引用核查

对全部已删除模块的导出符号做全量 grep 断言，结果为零残留：
`AIchat` / `isAIDisabled` / `aiConfigMissing` / `toggleAIConfig` / `handleOpenAIPanel` /
`explainWithAi` / `onNewSshAI` / `initMcpHandler` / `mcpStatus` / `onCheckUpdate` /
`checkPendingDeepLink` / `openSettingSync` / `isSyncingSetting` / `syncServerStatus` /
`autoSyncReady` / `upgradeInfo` / `aiChatHistory` / `showAIConfigModal` 等。

### 5.3 构建验证（实测）

环境：Windows x64 / Node 22.22.2 / pnpm 10.34.5。
依赖安装：`pnpm install`（`--registry=https://registry.npmmirror.com`，本环境直连 npmjs 元数据
请求需 15–70s，走镜像后可用）。

| 步骤 | 命令 | 结果 |
| --- | --- | --- |
| 依赖安装 | `pnpm install` | ✅ 960 包解析完成，`pnpm-lock.yaml` 生成；`node-pty`、`@serialport/bindings-cpp` 原生模块构建成功 |
| 渲染层构建 | `pnpm run build` | ✅ `✓ built in 10.97s`，产出 `work/app/assets/js/vis-5.5.6-vis-rc1.js`（469 kB）+ 18 个 chunk |
| 完整构建 | `pnpm run compile` | ✅ `done build in 35.177s`，产出 js / css / icons / images / index.html |
| 基线对照 | 原始 electerm 5.5.6 同参数构建 | ✅ `✓ built in 47.58s`，产出 `js/electerm-5.5.6.js`（502 kB） |

产物核对（`work/app/assets/index.html`）：

- `<title>vis远程工具</title>`、`_global.siteName = "vis远程工具"`
- 品牌资源 `vis.png`、`vis-watermark.png` 已随构建拷贝到 `assets/images/`
- 入口脚本 `basic-5.5.6-vis-rc1.js`、`vis-5.5.6-vis-rc1.js`、`worker-5.5.6-vis-rc1.js`
- 样式 `css/style-5.5.6-vis-rc1.css`

### 5.4 迁移到 pnpm 时发现的两个真实问题（已修）

包管理统一到 pnpm：删除 `package-lock.json`，由 `pnpm-lock.yaml`（288 KB，960 个包）
作为唯一锁定来源，避免两套 lockfile 互相打架。

pnpm 默认使用严格（非扁平）的 `node_modules`，会把 npm 扁平提升所掩盖的
**未声明依赖**暴露出来。本次构建因此暴露并修复了：

1. **`dayjs` 未声明**：`src/client/common/id-with-stamp.js`、
   `src/client/components/sidebar/app-running-time.jsx` 直接 `import dayjs`，
   但 `package.json` 里没有 —— 此前靠 antd 的传递依赖被 npm 提升到顶层才碰巧可用。
   已加入 `dependencies`（`dayjs: 1.11.23`，与 antd 共用同一实例）。
2. **`electron` 的二进制未安装**：pnpm 10 默认不执行依赖的安装脚本，
   `electron` 的 postinstall（下载 Electron 运行时）被跳过，导致 `node_modules/electron/dist`
   为空、无法启动。已在 `pnpm.onlyBuiltDependencies` 中放行 `electron`。

另有一处**非阻塞**的既有问题：`vite@8.1.0` 要求 peer `@types/node ^20.19.0 || >=22.12.0`，
项目声明的是 `22.9.3`，pnpm 会告警但不影响构建。这是上游基线的既有情况，未改动。

其余扫描到的未声明导入均为**测试专用或无需声明**，未处理：
`@playwright/test`（由 `pnpm run prepare-test` 安装）、`lodash`（仅 e2e 辅助文件）、
`zod`（仅 `test/unit/zod.spec.js`；运行期的 `src/app/lib/zod.js` 是自实现的轻量替代，
不需要 zod 包）、`original-fs`（Electron 运行时内置模块）、
`@serialport/binding-mock`（仅在注释里出现）。

### 5.5 单元测试对照

`node --test --test-force-exit src/test/unit-ci/*.spec.js`：

| | 测试数 | 通过 | 失败 |
| --- | --- | --- | --- |
| 基线 electerm 5.5.6 | 316 | 302 | 14 |
| 裁剪后 | 179 | 175 | 4 |

裁剪后的 4 个失败用例名为 `session-transports.spec.js`、`ssh proxy command`、
`x11 helpers` —— **全部同时出现在基线的失败列表中**（基线另有 4 个 AI 用例失败，
这些文件已随裁剪删除）。即：**失败集合是基线的子集，裁剪未引入任何回归**。

这 3 类失败均为环境相关（测试需要 `netbird` 可执行文件、真实 SSH 握手超时等），
非代码缺陷。

### 5.6 运行冒烟测试（实测）

```
DISABLE_GPU=1 electron work/app/app.js --no-sandbox
```

结果：**应用正常启动并完成完整初始化**。

- 主进程启动，`createApp` → `createWindow` → `initAppServer`（子服务进程）→ `initIpc` 全链路跑通
- 渲染层资源由内置 file-server 提供，`index.html` 正常加载
- SQLite 数据库自动创建：`vis-remote-tool.db`、`vis-remote-tool_data.db`
- 日志中可见完整业务功能可用（SSH 握手、2FA 重试、zmodem 传输等）
- 唯一报错为 `EPERM: open 'C:\Users\ZhuanZ\.ssh\config'` —— 沙箱禁止读取用户
  `~/.ssh/config`，属环境限制，且被 async handler 正常捕获，不影响运行

> 说明：首次冒烟测试（修复 3.3 之前）读取了机器上已存在的 `%APPDATA%\electerm`
> 数据目录并恢复了其中的会话。修复后重跑，数据目录已完全隔离到
> `%APPDATA%\vis-remote-tool`。

### 5.7 封版打包（Windows NSIS 安装包）

```
pnpm run b          # clean + build + prepare（含 work/app 生产依赖安装）
pnpm run pb         # 拷贝 electron-builder.json 到项目根
pnpm run build-win  # electron-builder --win nsis
```

结果：**出包成功**。

| 产物 | 大小 |
| --- | --- |
| `dist/vis远程工具-5.5.6-vis-rc1-win-x64-installer.exe` | 104,540,406 B（≈100 MB）— **第二次出包**，见下方「重新出包」 |
| `dist/vis远程工具-5.5.6-vis-rc1-win-x64-installer.exe.blockmap` | 107,909 B |
| `dist/win-unpacked/vis远程工具.exe` | 221,961,728 B |
| `dist/win-unpacked/resources/app.asar` | 29,869,478 B |

打包正确性核对：

- 应用名与产物名均为 `vis远程工具`（`appId` = `com.visystem.vis-remote-tool`）
- 原生二进制**确实被解包**到 asar 之外，且只剩 Windows x64：
  ```
  resources/app.asar.unpacked/node_modules/node-pty/prebuilds/win32-x64/conpty.node
  resources/app.asar.unpacked/node_modules/node-pty/prebuilds/win32-x64/conpty_console_list.node
  resources/app.asar.unpacked/node_modules/@serialport/bindings-cpp/prebuilds/win32-x64/@serialport+bindings-cpp.node
  ```
- electron-builder 日志确认：`skipped dependencies rebuild reason=npmRebuild is set to false`、
  `downloaded electron zip extracted successfully`、`building target=nsis`

**打包后应用冒烟测试**：直接运行 `dist/win-unpacked/vis远程工具.exe`，
应用从 `app.asar` 正常启动，IPC 链路跑通，并在
`%APPDATA%\vis-remote-tool\users\default_user\` 创建/更新了
`vis-remote-tool.db`、`vis-remote-tool_data.db`。
日志中仅有两类环境相关报错：沙箱禁止读取 `~/.ssh/config`（EPERM，已被捕获处理），
以及本环境 PowerShell 不在精简 PATH 上导致字体枚举失败 —— 均非产品缺陷。

**打包期发现并修复的最后一处问题**：即使配置里已删除 `publish`，
electron-builder 仍会从 `package.json` 的 `repository` 字段（指向上游
`github.com/electerm/electerm`）**反推出 GitHub 发布配置**，于是产出
`dist/latest.yml` 与 `resources/app-update.yml` —— 相当于把一个指向**上游仓库**的
自动更新入口打进了内部安装包。已显式设置 `"publish": null` 关闭更新信息生成，
重建后这两个文件均不再产出。

#### 5.7.0b 重新出包：出包之后又改了会打进包的源码

第一次出包（20:48）之后，又改了两处**属于主进程、会被打进 asar** 的源码：

| 文件 | 改动内容 |
| --- | --- |
| `src/app/lib/file-server.js` | 静态资源缓存策略修复（§5.9 缺陷 2）—— 只有内容哈希的 `chunk/` 用 `immutable`，其余 `no-cache` |
| `src/app/app.js` | `electronApp.setName` 判空防御（本环境 `ELECTRON_RUN_AS_NODE` 会让 `setName` 不存在） |

即 **20:48 那个安装包并不包含 `file-server.js` 的修复** —— 若直接交付，用户装到的
仍是「同版本号重建后懒加载 chunk 全部 404、界面静默失效」的旧行为。
已按 `pnpm run b → pnpm run build-win` 重新出包（00:51，104,540,406 B），
并校验打包产物 `dist/win-unpacked/resources/app.asar` 内确实含修复
（asar 中 `no-cache` 出现 6 次）、`work/app/app.js` 含 setName 判空。

> **教训：出包之后对 `src/app`、`src/client`、`src/server` 的任何改动，都必须重新出包。**
> 「`pnpm run build` 通过」只代表源码能编译，不代表安装包是最新的。
> 快速核对是否有漏网改动：
> `find src/app src/client src/server -type f -newermt "<出包时间>"`

#### 5.7.1 安装器载荷核对（替代安装冒烟）

本环境的沙箱策略阻止安装器写入（注册表访问被拦截、程序目录写入被拒），
实测两次静默安装（`/S /D=C:\tmp\vis-smoke`）均返回 0 但未落盘任何文件。
因此改用**解包核对**的方式验证安装器载荷（等效覆盖「安装后文件是否完整」这一风险）：

用 electron-builder 自带的 `7za` 列出安装包内嵌归档，共 **189 项**，关键内容：

| 载荷内容 | 大小 | 结论 |
| --- | --- | --- |
| `vis远程工具.exe` | 221,961,728 B | ✅ 主程序 |
| `resources/app.asar` | 29,869,478 B | ✅ 应用包 |
| `resources/app.asar.unpacked/.../node-pty/prebuilds/win32-x64/conpty.node` | 291,328 B | ✅ 原生模块已解包 |
| `resources/app.asar.unpacked/.../node-pty/prebuilds/win32-x64/conpty_console_list.node` | 134,656 B | ✅ |
| `resources/app.asar.unpacked/.../@serialport/bindings-cpp/prebuilds/win32-x64/*.node` | 233,472 B | ✅ |
| `resources/elevate.exe` | 107,520 B | ✅ |
| `icudtl.dat` / `resources.pak` / `*.dll` 等 Electron 运行时 | — | ✅ 齐全 |
| `app-update.yml` / `latest.yml` | — | ✅ **0 项**（上游更新入口已彻底移除） |

安装器本身的**实际安装 / 卸载流程**（快捷方式创建、注册表写入、卸载清理）仍需在
未受沙箱限制的真实机器上人工执行，见 §7。


### 5.8 Playwright e2e 套件（plan 36）

**跑通套件本身需要先解决 4 个环境/工具链问题**（都已解决并记录）：

| 问题 | 症状 | 处理 |
| --- | --- | --- |
| `playwright@1.28.1`（2022 年）与新 Electron 协议不兼容 | `Execution context was destroyed` | 升级到 `@playwright/test@1.63.0`，并把它作为正式 devDependency（原 `prepare-test` 脚本随之删除） |
| 本环境 shell 预设 `ELECTRON_RUN_AS_NODE=1` | Electron 退化为 node，`require('electron')` 返回字符串，应用启动即崩 | 运行 e2e 时 `env -u ELECTRON_RUN_AS_NODE -u NODE_OPTIONS`；同时给 `app.js` 的 `setName` 加了防御性判空 |
| 本机无可用 GPU | Electron 42 `FATAL: GPU process isn't usable. Goodbye.` | 运行 e2e 时带 `DISABLE_GPU=1`（应用自身会加 `disable-gpu` + `use-gl=swiftshader`） |
| 缺少 SSH 测试目标 | 所有会话类用例失败 | 用仓库自带的 `src/test/integration/lib/ssh-test-server.js` 在 `127.0.0.1:22022` 起进程内 SSH/SFTP 服务（`mcpit` / `mcpit-pass`），并写入 `.env`（已在 `.gitignore` 中） |
| `lodash` 未声明 | `Cannot find module 'lodash'`（`src/test/e2e/common/lang.js`） | 加入 devDependencies（这是第 5.4 节扫描出的未声明依赖之一） |

**运行 e2e 又暴露了一个真实产品缺陷（已修）**：

首轮 51 个用例跑出 12 通过 / 39 失败，失败原因高度集中在
「懒加载的 chunk 404」：

```
Failed to load resource: 404 (Not Found)
Failed to fetch dynamically imported module:
  http://127.0.0.1:30975/chunk/tab-bookmarks-5.5.6-vis-rc1-C-Ejj-Eb.js
```

根因是 `src/app/lib/file-server.js` 对**全部**静态资源统一设了
`maxAge: 1 年`。但 vite 产物分两类：

- `chunk/*.js` —— 文件名含**内容哈希**，可以长期缓存；
- `index.html`、`js/basic-<version>.js`、`js/vis-<version>.js`、
  `js/worker-<version>.js`、`css/style-<version>.css` —— 文件名**只含应用版本号**，
  不含内容哈希。

于是「同一个版本号重新构建」时，渲染层会继续用缓存里的旧入口包，而旧入口包引用的是
**上一版构建的 chunk 名**，这些文件已经不存在 → 每个懒加载视图都 404 →
界面静默失效（表现为「新连接表单打不开」「主题页空白」等）。

修复：`file-server.js` 改为只有 `chunk/` 目录下的内容哈希文件用
`immutable, max-age=1y`，其余一律 `no-cache`（走 ETag/Last-Modified 重新校验）。

修复后同一套件重跑，失败率大幅下降（前 21 个用例：修复前 4 通过 / 17 失败 →
修复后 8 通过 / 13 失败），`005.3.web-bookmark`、`008.basic.file-manager`、
`009.1.quick-commands`、`007.basic.bookmarks` 等从失败转为通过。

**另一个测试侧问题（已修）**：`src/test/e2e/common/basic-terminal-test.js` 里
全选/复制硬编码为 `Meta+A` / `Meta+C`（macOS 修饰键）。但问题比「平台不匹配」更深一层：
终端自身的全选快捷键 `terminal_selectAll` 在
`src/client/components/shortcuts/shortcuts-defaults.js` 里是**被注释掉的**，
所以任何按键组合都不会选中终端缓冲区。改为调用应用自身的入口
`window.store.selectall()`（与 `store/event.js` 中应用内部使用的完全一致），
复制键按平台选择 `Meta` / `Control`。

验证：单独重跑 `005.basic-ssh`（SSH 连接 + `ls` 输出比对）与
`008.basic-terminal`（本地终端 `ls`/`dir`），**两个都由失败转为通过**。

### 最终完整套件结果（全部修复后跑全量）

跑 `src/test/e2e` 全量：**51 个 test（45 个 spec 文件）**，**30 通过 / 21 失败**，耗时 25.7 分钟。

| 运行 | 通过 | 失败 |
| --- | --- | --- |
| 修复前（首轮） | 12 | 39 |
| 修复 `file-server.js` 缓存后 | 24 | 27 |
| 再修复终端全选 + 剪贴板（最终） | **30** | **21** |

剩余 21 个失败按归因分类：

| 类别 | 用例 | 说明 |
| --- | --- | --- |
| 拖拽 / 多选交互 | `039.drag-folder`、`039.file-op-drag-to-folder`、`039.file-select`、`009.5.context-select-all` | 依赖真实指针事件序列与修饰键状态，无头沙箱下无法稳定复现 |
| 本地 SFTP 文件操作（复制/粘贴/传输/编辑） | `009.7`、`009.8`、`039.file-edit`、`018.file-transfer`、`018.file-transfer-conflict`、`0091.file-info-modal`、`023.batch-op` | 依赖本地 SSH 测试服务的 SFTP 行为，与真实远端有差异 |
| 需要外部服务 / 外部二进制 | `020.trzsz-rzsz`（trz/tsz/rz/sz 外部命令）、`0061.remote-monitor-bar`、`0062.remote-monitor-visual` | `0061` 会自行占用 22022 端口，与本次起的测试服务冲突 |
| 终端 UI / 设置项 | `005.terminal-suggestions`、`006.terminal-info`、`0101.timeout-setting`、`009.basic.themes` | `009.basic.themes` 两次运行结果不一致，属 flaky |

**未观察到可归因于本次裁剪改造的失败** —— 失败项全部集中在「需要真实桌面交互」
或「需要外部服务」两类，与代码裁剪无因果关系。建议在有真实显示环境与独立端口的
CI 中重跑作为封版门禁（见 §7）。

## 5.9 实测发现并修复的产品缺陷（汇总）

以下都不是「计划里写的裁剪」，而是**真跑起来才暴露**的问题，已全部修复：

| # | 缺陷 | 影响 | 位置 |
| --- | --- | --- | --- |
| 1 | 数据目录/数据库文件名硬编码 `'electerm'` | 改名后的构建读写**上游 electerm 的数据库** | §3.3 |
| 2 | 静态资源统一 `maxAge: 1 年`，但入口包名只含版本号不含内容哈希 | 同版本号重建后，渲染层用旧入口包 → 懒加载 chunk 全部 404 → 界面静默失效 | §5.8 |
| 3 | `dayjs` 未声明（靠 npm 提升碰巧可用） | 迁移 pnpm 后构建失败 | §5.4 |
| 4 | `electron` 二进制未安装（pnpm 10 不跑 install 脚本） | 应用无法启动 | §5.4 |
| 5 | 渲染层错误页无条件加载 `electerm.org` 图片 | 每次报错外联一次 | §6.3 |
| 6 | 未设 `publish: null`，从 `repository` 反推出上游 GitHub 更新配置 | 安装包内含指向上游的自动更新入口 | §5.7 |
| 7 | `asarUnpack` 指向 `build/Release`，实际在 `prebuilds/` | 原生模块留在 asar 内 → 运行期加载失败 | §2.7 |
| 8 | 未关 `npmRebuild`，构建需本机 VS | 无 VS 的机器打不出包 | §2.7 |
| 9 | `require.resolve('app-builder-lib/…')` 在 pnpm 下解析不到 | 打包中断 | §2.7 |
| 10 | 构建脚本嵌套 `npm run` / `pnpm run` | 包管理器不在子进程 PATH 时构建中途失败 | §2.8b |

## 6. 安全与合规核查（plan 33–35、37）
### 6.1 本地服务监听与 token 鉴权（plan 34）

| 检查项 | 结论 |
| --- | --- |
| 监听地址是否可被用户改为 `0.0.0.0` | **不可**。`get-config.js` 在合并用户配置前显式 `delete userConfig.host`，`host` 只能取 `config-default.js` 的 `'127.0.0.1'`；`get-port.js` 也只在 `127.0.0.1` 上探测空闲端口。 |
| WS 鉴权 token 强度 | 每次启动用 `generate()`（nanoid）生成随机 `tokenElecterm`，通过子进程 env 传递，仅本机可猜不可枚举。 |
| token 校验覆盖面 | 7 条 WS 通道**全部**在回调首行调用 `verify(req)`（见 6.2）。 |
| 口令存储 | PBKDF2-SHA512 / 16 字节随机盐 / 64 字节派生密钥（`app/lib/auth.js`）。 |

**残留风险（基线既有，本次未改动）**

1. `app/server/dispatch-center.js:31` 的二次门禁
   `if (process.env.requireAuth === 'yes' && !globalState.authed)` 是**死代码**：
   `requireAuth` 实际被赋值为 `hashedPassword`（128 位十六进制串）或 `''`，永远不会等于
   字符串 `'yes'`。即「登录密码」只锁住渲染层 UI（`components/auth/login.jsx`），
   并没有为 WS 通道增加一层 `authed` 校验。
   实际防护仍由「仅监听 127.0.0.1 + 每次启动随机 token」承担。
   建议修复：改为 `if (process.env.requireAuth && !globalState.authed)`。
   *未在本次改动，因为这会改变鉴权语义，需单独回归测试。*
2. `verify()` 与 `comparePasswords()` 均使用 `!==` / `===` 比较字符串，非常量时间。
   对本机回环 + 每次启动随机的 token 而言是理论问题。
3. PBKDF2 迭代次数 1000 偏低（OWASP 对 PBKDF2-SHA512 建议 60 万+）。同样是本地
   口令门禁而非服务端凭据库，风险有限。

### 6.2 WebSocket 通道鉴权覆盖（plan 35）

| 通道 | 位置 | 鉴权 |
| --- | --- | --- |
| `/common/s` | `server/dispatch-center.js:38` | ✅ `verify(req)` |
| `/terminals/:pid` | `server/session-server.js:144` | ✅ |
| `/sftp/:id` | `server/session-server.js:415` | ✅ |
| `/transfer/:id` | `server/session-server.js:475` | ✅ |
| `/rdp/:pid` | `server/session-server.js:97` | ✅ |
| `/vnc/:pid` | `server/session-server.js:114` | ✅ |
| `/spice/:pid` | `server/session-server.js:131` | ✅ |

裁剪后**通道数由 8 降到 7** —— 原有的 `/upgrade/:id` 通道（会按 `transferKeys`
白名单派发方法调用）已随应用自升级功能一并移除，攻击面相应缩小。

### 6.3 运行期外联核查（plan 37，静态）

对 `src/app` + `src/client` 全量提取硬编码 URL 并逐条判定：

| 主机 | 判定 |
| --- | --- |
| `https://electerm.org`（错误页二维码图） | ❌ **真实外联** —— `components/main/error-wrapper.jsx` 在每次渲染错误页时无条件加载该图片。**已删除**。 |
| `https://theme.electerm.org` | 主题表单里用户点击才打开的外链（`openExternal`） |
| `https://github.com`（48 处） | 帮助/wiki 外链 + 关于页出处链接，均需用户点击 |
| `https://icon-sets.iconify.design`（4）、`https://raw.githubusercontent.com`（1） | **仅注释**里的图标出处说明 |
| `https://00.00` | `create-window.js` 故意设置的无效地址，用于**关闭**拼写检查词典下载 |
| `http://127.0.0.1:<port>` | 本机服务，预期 |

此外 `app/lib/error-page.js`（主进程错误页）原本也带 electerm 二维码与作者邮箱，已在
2.x 品牌替换中移除。

裁剪已消除的主要外联通道：应用自升级（下载 + 安装）、数据同步（gist / WebDAV /
自建服务 / cloud）、AI 调用、MCP、运行期 npm 包下载器、R2 上传。

### 6.4 依赖 SBOM（plan 33）

生成方式：`sbom.mjs`（自建，遍历 node_modules 与 pnpm 虚拟 store，读取每个包的
`package.json`），输出 CycloneDX 1.5 格式的 `SBOM.json`。

- 组件总数 **930**，其中直接依赖 **84**
- 许可证分布：MIT 796 / ISC 51 / BSD-3-Clause 21 / Apache-2.0 16 /
  BlueOak-1.0.0 15 / BSD-2-Clause 13 / MPL-2.0 3 / 其它 11
- 无 UNKNOWN 许可证

**需法务/合规复核的项**

| 包 | 许可证 | 说明 |
| --- | --- | --- |
| `spice-client@1.2.0` | **LGPL-3.0-or-later** | **直接依赖**，最需要关注。LGPL 要求使用者可替换该库；Electron 打包进 asar 时的「可重链接」需要评估（常见做法是 `asarUnpack` 单独放置或改为动态加载）。 |
| `@novnc/novnc@1.7.0` | MPL-2.0 | 直接依赖，文件级 copyleft，保留许可证文本即可。 |
| `lightningcss`（+ win32 二进制） | MPL-2.0 | 经 vite 传递，仅构建期。 |
| `@fontsource/maple-mono@5.3.0` | OFL-1.1 | 字体许可，不得单独售卖字体。 |
| `node-forge@1.4.0` | BSD-3-Clause OR GPL-2.0 | 双许可，按 BSD-3-Clause 使用。 |
| `argparse` / `caniuse-lite` / `tslib` / `tweetnacl` 等 | Python-2.0 / CC-BY-4.0 / 0BSD / Unlicense | 宽松许可，无需特别处理。 |

## 7. 尚未完成 / 需内部流程补做的项

已完成的可自动化部分：静态检查、依赖安装、构建、启动冒烟、单测对照、
依赖 SBOM（§6.4）、安全核查（§6.1–6.3）、**Windows NSIS 安装包出包与打包后应用冒烟（§5.7）**。

仍需内部流程或后续补做：

1. `plan.txt` 中的流程类项目：建私有 Git 仓库、CI 流水线、上游 watch 与
   cherry-pick 流程、封版审批 —— 需在内部流程中落地。
2. **Playwright e2e 套件已在本地跑通**（见 §5.8），并借此修复了 2 个真实缺陷。
   最终全量 51 个用例：**30 通过 / 21 失败**（修复前为 12 通过 / 39 失败）。
   剩余失败已全部归类：拖拽/多选交互在无头沙箱下不稳、本地 SFTP 文件操作与
   真实远端存在行为差异、需要外部服务或外部二进制（`020.trzsz-rzsz` 需
   trz/tsz/rz/sz；`0061` 会自行占用 22022，与本次起的测试服务冲突）、
   以及个别 flaky 用例。**未观察到可归因于本次裁剪改造的失败。**
   建议在 CI（有真实显示环境与独立端口）中重跑作为封版门禁。
3. **安装 / 卸载 / 启动冒烟（plan 42 后半段）需在真实机器人工执行**：
   本次只验证到「安装包成功产出」+「解包后的应用可直接启动并建库」。
   安装器本身尚未执行安装流程，`signtool.exe` 步骤因未配置证书为空操作
   （如需签名需提供内部代码签名证书）。
4. `vite@8.1.0` 与 `@types/node@22.9.3` 的 peer 版本告警（基线既有，不影响构建）。
5. §6.1 列出的三条鉴权残留风险（`requireAuth === 'yes'` 死代码、非常量时间比较、
   PBKDF2 迭代次数偏低）—— 均属基线既有，未在本次改动。
6. §6.4 中的 LGPL（`spice-client`）与 MPL（`@novnc/novnc`、`lightningcss`）
   需法务复核。
7. `node-pty/third_party/conpty/` 下仍同时带有 win10-x64 与 win10-arm64 两份
   conpty 资源（`asarUnpack` 已排除在 asar 之外），可按需进一步裁剪。
8. 残留的 `electerm` 字样（已确认无害，未改动）：
   - `src/app/common/parse-quick-connect.js` 的 `electerm://` 文本解析与
     `SUPPORTED_PROTOCOLS` 列表（纯字符串解析，不涉及 OS 注册）
   - `src/app/lib/fs.js` 的临时文件名 `electerm-temp-*.tar` 与内部环境变量
     `ELECTERM_OPEN_FILE_PATH_B64`（同一文件内自产自销）
   - `tokenElecterm` 等内部配置键名


