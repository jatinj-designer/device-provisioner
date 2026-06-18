# Device Provisioner — Next.js PWA

The Device Provisioner rebuilt as a React / Next.js (App Router, TypeScript) PWA. Same 8-byte
binary, same Google-Sheets sync, now component-based.

## Run

```bash
cd device-provisioner-next
npm install
npm run dev            # http://localhost:3000
```

Production / static export (deploys anywhere — GitHub Pages, Netlify, an internal static host):

```bash
npm run build         # emits ./out (static files, PWA included)
npx serve out         # or any static server
```

> The service worker + install prompt only work over `http(s)` or `localhost`, not `file://`.

## Layout

```
app/
  layout.tsx        metadata: manifest, theme-color, icons
  page.tsx          composes the panels, wraps them in ToastProvider
  globals.css       ported styles
components/
  useProvisioner.ts central state + all actions (generate, sync, import/export…)
  Toast.tsx         toast context/provider
  HardwarePanel · GeneratePanel · HexDump · CloudSync · Registry
  InstallButton · ServiceWorkerRegister
lib/
  provision.ts      pure logic (fnv1a32, hwVersionInt, buildBin, makeId…)
  sheet.ts          Apps Script web-app client (GET/POST)
  storage.ts        localStorage persistence (SSR-safe)
public/
  manifest.webmanifest, sw.js, icons/
Code.gs             Google Apps Script backend (paste into your Sheet)
devices-template.xlsx  Sheet template (Devices + HardwareVersions tabs)
```

## Google Sheet sync

Configured **in code**, not in the UI. Deploy `Code.gs` as a Web app (see `../SETUP.md`), then
set the `/exec` URL + shared token in [`lib/config.ts`](lib/config.ts):

```ts
export const SYNC: SyncConfig = {
  url: 'https://script.google.com/macros/s/AKfy…/exec',
  token: 'your-shared-token',
};
```

When `url` is set, the app pulls the registry + hardware-version list on load and pushes new
devices / edits back automatically (silently). Leave `url` empty to run fully offline.
