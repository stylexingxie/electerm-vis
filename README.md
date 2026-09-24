# vis远程工具 (VISYSTEM internal build)

Windows-only, internally trimmed build of **electerm**, maintained by VISYSTEM.

| | |
| --- | --- |
| Brand | VISYSTEM |
| Product name | vis远程工具 |
| Package name | `vis-remote-tool` |
| Internal version | `5.5.6-vis-rc3` (decoupled from upstream) |
| Upstream base | electerm 5.5.6 |
| Target platform | Windows x64 (NSIS installer) |
| Package manager | pnpm >= 11 |

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

- Node.js `^20.19.0 || >=22.12.0` (the range vite 8 declares)
- pnpm >= 11
- Windows x64 for producing the installer

## Install dependencies

```bash
pnpm install
```

Native modules (`node-pty`, `@serialport/bindings-cpp`) are built through the
`allowBuilds` allowlist in `pnpm-workspace.yaml` — that file is the single source
of truth. Since pnpm 11 an `.npmrc` is only read for auth/registry settings, so
build-script and `nodeLinker` settings must not be put there.

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
pnpm run pb             # copy build/electron-builder.json to the project root
pnpm run build-win      # electron-builder --win nsis -> dist/, then verify-package
```

The installer is written to `dist/` as
`vis远程工具-win-x64-installer.exe`. The version and `rc` suffix deliberately do
**not** appear in the artifact name; the version lives in `package.json` only.

`pnpm run build-win` ends with `verify-package`, which fails the build when the
packaged app violates any of these invariants:

- native binaries for any platform other than `win32-x64`
- the arm64 conpty copy under `node-pty/third_party`
- `node-pty/lib/unixTerminal.js` (Unix-only terminal implementation)
- third-party sourcemaps (`*.map`) inside `app.asar`

It also reports Authenticode signing status. Because a package built before a
source change is just as wrong as a mis-trimmed one, re-run the full chain
(`pnpm run b && pnpm run pb && pnpm run build-win`) after touching anything under
`src/app`, `src/client` or `src/server`.

## Code signing

The installer is **not signed** unless a certificate is supplied, so Windows
SmartScreen will warn on first run. To sign, provide the certificate through
electron-builder's standard environment variables and re-run the packaging step:

```bash
CSC_LINK=/path/to/cert.pfx CSC_KEY_PASSWORD=<password> pnpm run build-win
```

`CSC_LINK` accepts a local `.pfx` path, a `file://` URL, or a base64-encoded
certificate. SHA-256 is used for the signature and the timestamp is taken from
`http://timestamp.digicert.com` (both configured in `build/electron-builder.json`).

`verify-package` fails the build when `CSC_LINK`/`CSC_KEY_PASSWORD` are set but
the produced installer is not validly signed, so a misconfigured certificate
cannot slip through silently. An intentionally unsigned build still succeeds and
just prints a warning.

## Uninstall and user data

Uninstalling **keeps** the user's data — `deleteAppDataOnUninstall` is explicitly
`false` in `build/electron-builder.json`. Bookmarks, sessions, profiles and
settings live in `%APPDATA%\vis-remote-tool` and survive both uninstall and
reinstall, which is the intended behaviour for a tool that stores connection
profiles.

To remove everything by hand, uninstall the application and then delete:

```
%APPDATA%\vis-remote-tool
```

Note that this directory is separate from upstream electerm's
`%APPDATA%\electerm`, which this build never reads or writes.

## Tests

```bash
pnpm run test-unit-ci       # node --test src/test/unit-ci/*.spec.js
pnpm run test-integration   # node --test src/test/integration/*.spec.js
pnpm run test               # playwright e2e (see src/test/e2e)
```

`@playwright/test` is a normal devDependency. The e2e suite additionally needs a
local SSH target (see `src/test/integration/lib/ssh-test-server.js`) configured
via `.env`, and must run with `ELECTRON_RUN_AS_NODE`/`NODE_OPTIONS` unset and
`DISABLE_GPU=1` on machines without a usable GPU.

## License

MIT — see [LICENSE](./LICENSE). The original copyright (c) ZHAO Xudong and the
electerm contributors is retained in full.
