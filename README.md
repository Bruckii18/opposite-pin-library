<img src="assets/icon/logo.svg" alt="" width="96" height="96">

# Opposite Pin Library

A Chrome extension (Manifest V3) that makes Warcraft Logs **pins** easy to save, organize and
re-apply. WCL removed its "saved pins from bookmarks" tab, so the only native way to reuse a pin
is to copy its pin string and paste it back by hand. This extension stores pin strings in a
searchable library, groups them into sets and applies them to the open report with one click.

- Save the pins that are active on the open report: one at a time, or all of them as a set.
- Paste pin strings manually (from WCL's **Copy Pin** button or from a guildmate), or paste a bare
  filter expression such as `type = "cast"` (from a guide, for example) and it becomes a Filter pin.
- Name, describe, tag, search, edit, duplicate and delete pins and sets.
- Apply a pin or a whole set: **Apply** keeps the pins that are already active, **Replace Current**
  swaps them out.
- Import and export the library, or a single set, as JSON to share it with a guild or coach.
- No backend, no tracking, no external requests. Data stays in `chrome.storage.local`.

## Install

Requirements: Node.js 22.18 or newer, and Chrome 141 or newer.

```bash
npm install
```

```bash
npm run build
```

1. Open `chrome://extensions` and switch on **Developer mode**.
2. Click **Load unpacked** and select the `dist/` folder.
3. Pin the extension to the toolbar if you like.

If a WCL tab was already open before you installed the extension, reload that tab once so the
content script gets injected.

### Arc and other Chromium browsers

Load it the same way through `arc://extensions` (or `edge://extensions`, `brave://extensions`).
Edge and Brave show the side panel like Chrome. Arc has no working side panel, so the first time you click the icon in Arc, the extension
switches to a **popup** and opens it right away. If Arc refuses to open it on that first click,
the next click does. The choice is remembered.

How that works: Chrome opens the side panel on an icon click and never fires
`chrome.action.onClicked`. Arc exposes `chrome.sidePanel` but never opens it (its calls never
resolve) and delivers the click to `onClicked` instead. The service worker treats that event as
the signal to switch the icon to a popup ([src/display/displayMode.ts](src/display/displayMode.ts)).

In popup mode:

- The popup closes when you click into the page, like any extension popup.
- **Import JSON** opens the library in a tab, because popups close as soon as a file dialog opens.
- The header has a **Side panel** button to switch back, in case a Chromium browser was
  misdetected. It takes effect on the next icon click.

## Usage

- **Open or close the panel:** click the toolbar icon (it toggles), press `Alt+Shift+P`, or use the
  `×` in the panel header. You can change the shortcut at `chrome://extensions/shortcuts`. In Arc
  the same actions open the popup (see above).
- **This report:** lists the pins that are active on the report in the current tab. **Save**
  stores one pin; pins already in the library show **✓ Saved**. **Save all as set** stores every
  active pin (reusing pins you already saved) and groups them into a new set.
- **Pins / Sets tabs:** search by name, description, tag or pin expression, and filter by tag
  chips. **+ New pin** accepts a pasted pin string or a bare filter expression. An expression is
  saved as a Filter pin (`2$Off$#244F4B$expression$…`), exactly as WCL's *Filter Expression* box
  would create it. Expressions cannot contain `$` or `^`. **+ New set** lets you pick pins from the
  library.
- **Apply / Replace Current:** applies a pin or set to the report in the current tab. Pins that are already
  active are not added twice.
- **⋯ menu:** copy the pin string, duplicate, export a set, or delete (click twice to confirm).
- **Import JSON / Export library** (panel footer): exports are versioned JSON files. When you
  import, pins whose pin string already exists are reused, and sets that already exist (same name,
  same pins) are skipped. Nothing is overwritten.

## How the WCL integration works

These findings were checked on a live report on 2026-10-16:

- **Active pins live in the report URL** as the `pins` query parameter. Several pins are joined
  with `^`, and the value is URL-encoded with standard `URLSearchParams` rules (`$` becomes `%24`,
  `^` becomes `%5E`, a space becomes `+`).
- **The URL value is exactly the "Copy Pin" string.** WCL's own *Create Pin* code literally does
  `pins += "^" + pastedString`. A cold page load with `pins=` applies every pin in it.
- **Inside a report, WCL is a single-page app.** Its router (`window.queryRouting`) changes the URL
  with `history.pushState` and re-renders without a reload.
- **The Add Pin dialog is not React.** It is server-rendered jQuery markup that is always in the
  DOM (`#pins-ui`). The *From Paste* textarea (`#pins-ui-paste-box`) is a plain `<textarea>`, so
  setting `.value` is enough; no native-setter trick is needed. The `input` event only refreshes
  the preview.
- **Filter Expression box:** pressing Enter in the query bar's *Filter Expression:* field makes
  WCL create a regular Filter pin (`2$Off$<color>$expression$<text>`) and add it to `pins`. Those
  pins are saved and applied like any other pin. Text you typed without pressing Enter is not stored
  anywhere, so it can't be saved.
- **Copy Pin** calls the browser's own `window.prompt()` with the pin string, so there is no DOM
  to hook. The extension doesn't need it, because the URL already contains the same strings.
- **Pin string format:** `<type>[$extra…]$<graph>$<color>$<component>[$<component>…]`
  - type: 0 Decorator, 1 Badge, 2 Filter, 3 Summary (2 extra fields), 4 DPS Weight (1 extra field)
  - component: `expression$…`, `script$…` or a query (`damage$…`, `casts$…`, …)

  The extension stores pin strings unchanged and only reads them to show a label.

### Apply strategy: why the URL comes first

`applyPins(pinStrings, mode)` ([src/apply/applyPins.ts](src/apply/applyPins.ts)) builds the target
pin list and tries these strategies in order. The first one that succeeds wins:

| # | Strategy | How | When it is used |
|---|----------|-----|-----------------|
| 1 | **URL via page router** | A tiny script in the page calls WCL's `queryRouting.set()` with the new `pins` value, the same call WCL's *Create Pin* makes. | Default. Instant, no reload, supports whole sets and Replace Current. |
| 2 | **Add Pin dialog (UI automation)** | Opens the dialog, switches to *From Paste*, pastes `pin^pin^…`, clicks *Create Pin*. | When the router is missing or ignores the change. It can only **add** pins. |
| 3 | **URL via full page load** | Navigates to the report URL with the new `pins` parameter. | Last resort, for example Replace Current when the router is gone. |

Strategies 1 and 2 are checked: the extension waits until the report URL shows exactly the
expected pins, otherwise it moves on to the next strategy. When the dialog fallback is used, the
status message says so, which is your hint that WCL changed something.

The URL strategy was chosen as the primary path because Step 0 showed that the URL is WCL's own
source of truth for pins. It handles a whole set in one step, supports Replace Current, and depends on one
documented-by-behavior parameter rather than on dialog markup.

### Architecture

```
src/
  wcl/           Everything WCL-specific (the only place to touch when WCL changes)
    wclContract.ts     hostnames, URL params, separators, router global, dialog selectors
    pinString.ts       pin string validation, splitting, labels
    reportUrl.ts       read/write the pins param on report URLs
    pinDialog.ts       Add Pin dialog automation
    pageBridgeProtocol.ts / pageRouterClient.ts   messages to the in-page router bridge
    strategies/        page router, pin dialog, page reload
  apply/         applyPins orchestration and Apply/Replace Current planning (WCL-agnostic)
  content/       content-script.js (isolated world) and page-bridge.js (page's own scripts)
  library/       schema (zod), pure operations, search, storage, import/export
  messaging/     side panel → content script message contract
  sidepanel/     React UI: services, hooks, components
  background/    service worker (side panel toggle, Arc popup fallback)
  display/       side panel vs. popup mode, and which surface a panel page runs in
```

- The content script is stateless. It reads `location.href` whenever it applies pins, so it keeps
  working when WCL navigates inside a report without reloading. It matches every
  `*.warcraftlogs.com` page, so navigating into a report from elsewhere on the site works too.
- The side panel reads the active tab's URL, which needs only the host permission and no `tabs`
  permission. It updates on `tabs.onUpdated`, which fires for WCL's `pushState` navigation.
- Permissions: `storage`, `sidePanel`, and host access to `https://*.warcraftlogs.com/*` (this
  covers www, classic, fresh, sod, vanilla and the language subdomains).

## When WCL changes something

| Symptom | Where to look |
|---------|---------------|
| Active pins don't show in the panel, or saved pins don't apply at all | `PINS_QUERY_PARAM` / `PIN_SEPARATOR` in [wclContract.ts](src/wcl/wclContract.ts), then [reportUrl.ts](src/wcl/reportUrl.ts) |
| Status says "…through the Add Pin dialog" | WCL renamed its router global. Update `PAGE_ROUTER_GLOBAL` in [wclContract.ts](src/wcl/wclContract.ts). In the page console, `Object.keys(window).filter(k => /rout/i.test(k))` helps find the new name. |
| Error "Add Pin dialog elements not found: #…" | Update `PIN_DIALOG_SELECTORS` in [wclContract.ts](src/wcl/wclContract.ts) (the message names the missing selector). |
| Pin labels look wrong (type, color, summary) | The format codes in [pinString.ts](src/wcl/pinString.ts). |
| Valid pins are rejected as "not a pin string" | `validatePinString` in [pinString.ts](src/wcl/pinString.ts) (it is deliberately lenient). |
| A new WCL subdomain or host | `WCL_HOSTNAME` in [wclContract.ts](src/wcl/wclContract.ts) and `host_permissions` / `matches` in [public/manifest.json](public/manifest.json). |

After a change, run `npm run check` and then `npm run build`, and reload the extension at
`chrome://extensions`.

## Data format

The library is stored under the `pinLibrary` key in `chrome.storage.local` (the 10 MB local area,
instead of the roughly 100 KB `storage.sync`):

```json
{
  "schemaVersion": 1,
  "pins": [{ "id": "…", "name": "Raid deaths", "description": "", "tags": ["raid"],
             "pinString": "1$Off$#A33C3C$expression$type = \"death\"",
             "createdAt": "…", "updatedAt": "…" }],
  "sets": [{ "id": "…", "name": "Mythic review", "description": "", "tags": [],
             "pinIds": ["…"], "createdAt": "…", "updatedAt": "…" }]
}
```

Export files add `"format": "opposite-pin-library"` and `"exportedAt"`. A set export contains the set
and only its own pins. Data with a newer `schemaVersion` is rejected with a clear message instead
of being overwritten, and damaged stored data is never replaced silently.

## Development

```bash
npm run check
```

```bash
npm run watch
```

- `npm run check` runs typecheck, ESLint and the Vitest suite.
- `npm run watch` rebuilds into `dist/` on change. Reload the extension after each rebuild.
- Tests run in jsdom, including the dialog automation against a fake WCL page and a round trip
  through the page bridge.
- Build: Vite builds the side panel and service worker as ES modules. Both content scripts are
  built as self-contained IIFE files ([scripts/build.ts](scripts/build.ts)), because content
  scripts cannot import modules.

### Icons

The logo is a map pin in the mascot's green, with a dragon eye and a gold crown. The sources are
[assets/icon/logo.svg](assets/icon/logo.svg) (used for 48 and 128 px, and in the panel header) and
[assets/icon/logo-small.svg](assets/icon/logo-small.svg) (bigger eye, bolder crown and no eye
highlight, so it stays readable at 16 and 32 px in the toolbar). After editing them, regenerate
the PNGs in `public/icons/`:

```bash
npm run icons
```

The script renders the SVGs with headless Chrome. Set `CHROME_PATH` if Chrome is not installed at
the default macOS location.

## Later (not in the MVP)

- Template pins with variables such as `{{spellId}}` or `{{player}}`, filled in when applied.
- Suggestions based on the boss or encounter.
- Optional sync backend.
