# App icons

Tauri needs platform icons (`.png`, `.ico`, `.icns`) that are **generated**, not
hand-authored, so they are git-ignored (see `../.gitignore`).

Generate them once from the existing high-res brand mark:

```bash
# from the repo root, after installing the Tauri CLI
npx tauri icon public/icon-512.png
```

This produces `32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.icns`,
`icon.ico` and `icon.png` here — exactly the paths referenced by
`tauri.conf.json` (`bundle.icon` and `app.trayIcon.iconPath`).
