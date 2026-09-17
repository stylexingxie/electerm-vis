# vis远程工具 (VISYSTEM internal build)

Windows-only, internally trimmed build of **electerm**, maintained by VISYSTEM.

| | |
| --- | --- |
| Brand | VISYSTEM |
| Product name | vis远程工具 |
| Package name | `vis-remote-tool` |
| Internal version | `5.5.6-vis-rc1` (decoupled from upstream) |
| Upstream base | electerm 5.5.6 |
| Target platform | Windows x64 (NSIS installer) |
| Package manager | pnpm |

This tool is built on electerm. See `LICENSE` for the original MIT license and
copyright, and https://github.com/electerm/electerm for the upstream project.

## What this build is

A feature-narrowed fork for internal use. The following upstream capabilities
have been **removed** from the source tree:

- **Data sync** — GitHub / Gitee gist, WebDAV, custom server and electerm cloud
  sync (server routes, client store, settings UI, the `electerm-sync` dependency).
- **Application self-upgrade** — update check, download, install and the
  "check for update" UI, plus the `download-upgrade` WebSocket channel.
- **AI features** — AI chat panel, AI bookmark creation, AI theme editor,
  AI command suggestions, AI model configuration.
- **MCP server** — the MCP widget, the MCP server implementation and the
  MCP request handler in the renderer.
- **Deep links / URL scheme registration** — the ssh/telnet/rdp/vnc/serial/spice
  and `electerm://` protocol handlers are no longer registered with the OS.
- **Custom module downloader** — the runtime npm package downloader used by
  `customRequire` (an external network path).
- **macOS / Linux / non-NSIS packaging** — all platform build scripts, signing
  entitlements, AppImage/Snap/deb/rpm targets, AppX and the npm CLI
  distribution channel.

Everything else is upstream electerm: SSH/SFTP/FTP/Telnet/Serial/RDP/VNC/Spice
sessions, the terminal, file transfer, bookmarks, profiles, quick commands,
triggers, themes, widgets, workspaces and remote monitoring.

## Requirements

- Node.js >= 16
- pnpm (`npm i -g pnpm` or any equivalent installation)
- Windows x64 for producing the installer

## Install dependencies

```bash
pnpm install
```

Native modules (`node-pty`, `@serialport/bindings-cpp`) are built through
pnpm's `onlyBuiltDependencies` allowlist declared in `package.json`.

## Build the client bundle

```bash
pnpm run build          # vite bundle -> work/app/assets
pnpm run b              # clean + bundle + copy assets + render index.html
```

## Run locally

```bash
pnpm run start          # dev server + electron
# or, after a full `pnpm run b`:
pnpm run t              # electron work/app/app.js
```

## Package the Windows installer

```bash
pnpm run b              # prepare work/app (production deps + assets)
pnpm run pb             # copy electron-builder.json to the project root
pnpm run build-win      # electron-builder --win nsis -> dist/
```

The installer is written to `dist/` as
`vis远程工具-5.5.6-vis-rc1-win-x64-installer.exe`.

## Tests

```bash
pnpm run test-unit-ci       # node --test src/test/unit-ci/*.spec.js
pnpm run test-integration   # node --test src/test/integration/*.spec.js
pnpm run prepare-test       # install playwright (required for e2e)
pnpm run test               # playwright e2e
```

## License

MIT — see [LICENSE](./LICENSE). The original copyright (c) ZHAO Xudong and the
electerm contributors is retained in full.
