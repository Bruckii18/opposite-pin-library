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
- Apply a pin or a whole set: **Apply** replaces the pins that are active on the report. When pins
  are already active, **Add to current** keeps them and adds these instead.
- Optionally save the report view (tab, ability, layout) with a pin or set, so applying it also
  opens that view. Saved views work on any report.
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
- **Also save current view (tab, ability, layout):** tick this box in either save form to store
  the report view you are looking at (for example *Damage Taken*, ability 1304424, *Events*)
  with the pin or set. Only the tab, the ability and the layout are stored. Fight, boss,
  difficulty, source and the other report settings are not, so the view works on any report. The
  fields stay editable before you save.
- **Pins / Sets tabs:** search by name, description, tag or pin expression, and filter by tag
  chips. **+ New pin** accepts a pasted pin string or a bare filter expression. An expression is
  saved as a Filter pin (`2$Off$#244F4B$expression$…`), exactly as WCL's *Filter Expression* box
  would create it. Expressions cannot contain `$` or `^`. **+ New set** lets you pick pins from the
  library.
- **Edit a pin or set:** the form has the same view checkbox with a field each for the tab (for
  example `damage-taken`), the ability (a numeric spell ID) and the layout (for example `events`
  or `timeline`). An empty field is removed from the URL when you apply, so an empty layout means
  *Tables*, and a ticked box with all fields empty switches to the default view. Untick the box to
  remove the saved view. Pins and sets with a saved view show a **View: …** label.
- **Apply / Add to current:** **Apply** applies a pin or set to the report in the current tab and
  replaces the pins that are active there, so only these remain. When pins are already active,
  **Add to current** shows up next to it: it keeps them and adds these (pins that are already
  active are not added twice). If the pin or set has a saved view, the report switches to it in
  the same step and keeps its fight, boss and other settings. Items without a saved view leave the
  view as it is.
- **Conflicting views:** a set's pins can have saved views of their own. When a set is applied,
  its pins count in set order and the set itself counts last, and the last saved view wins. So a
  view saved on the set beats the views of its pins. The status message says which view was used
  when they differ.
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

Checked on 2026-10-19, for saved views:

- **The report view lives in the URL next to `pins`**, for example
  `/reports/<code>?boss=3513&difficulty=5&wipes=1&view=events&type=damage-taken&ability=1304424&pins=…`.
  - `type` is the tab (`damage-taken`, `auras`, `debuffs`, `casts`, `deaths`, …).
  - `ability` is the ability dropdown. It is a spell ID, a game ID, so it is the same in every
    report.
  - `view` is the layout. It is missing for *Tables*, otherwise `events`, `timeline`, ….
- **Only report-independent params are saved.** The allow-list (`type`, `ability`, `view`) is
  `ViewQueryParam` in [wclContract.ts](src/wcl/wclContract.ts). Report-specific params (report code,
  `fight`, `source`, `target`, `boss`, `difficulty`, `wipes`, `start`, `end`) are never stored or
  overwritten. When a view is applied, every param outside the allow-list stays exactly as it is
  in the current URL. Anything else in stored or imported data is dropped when it is read. To
  support another view param, add it to `ViewQueryParam` and give it a form field in
  [viewFormModel.ts](src/sidepanel/forms/viewFormModel.ts) (TypeScript reports the missing field).
- **`window.queryRouting.set(query)` replaces the whole query.** Calling it with only `{ pins }`
  drops `boss`, `difficulty`, `type`, `view` and the rest. The page bridge always starts from
  `queryRouting.get()`, replaces only `pins`, `modal` and (when a view is applied) the
  allow-listed view params, and passes the merged query to `set()`.
- **Pin string format:** `<type>[$extra…]$<graph>$<color>$<component>[$<component>…]`
  - type: 0 Decorator, 1 Badge, 2 Filter, 3 Summary (2 extra fields), 4 DPS Weight (1 extra field)
  - component: `expression$…`, `script$…` or a query (`damage$…`, `casts$…`, …)

  The extension stores pin strings unchanged and only reads them to show a label.

### Apply strategy: why the URL comes first

`applyPins({ pins, mode, view })` ([src/apply/applyPins.ts](src/apply/applyPins.ts)) builds a plan
with the target pin list and, if a saved view differs from the current one, the target view. It
then tries these strategies in order. The first one that succeeds wins:

| # | Strategy | How | When it is used |
|---|----------|-----|-----------------|
| 1 | **URL via page router** | A tiny script in the page merges the new `pins` value (and the saved view params) into `queryRouting.get()` and passes the result to WCL's `queryRouting.set()`, the same call WCL's *Create Pin* makes. | Default. Instant, no reload, supports whole sets, replacing the active pins and saved views. |
| 2 | **Add Pin dialog (UI automation)** | Opens the dialog, switches to *From Paste*, pastes `pin^pin^…`, clicks *Create Pin*. | When the router is missing or ignores the change. It can only **add** pins and cannot change the view, so it steps aside when the plan changes the view. |
| 3 | **URL via full page load** | Navigates to the report URL with the new `pins` parameter and the saved view params. | Last resort, for example replacing active pins or a view change when the router is gone. |

Pins and view always change in the same step: one `queryRouting.set()` call or one navigation.
Because the dialog cannot set URL params, it doesn't apply pins without the view; the page load
applies both instead. Strategies 1 and 2 are checked: the extension waits until the report URL
shows exactly the expected pins (and the expected view params, if a view is applied), otherwise
it moves on to the next strategy. When the dialog fallback is used, the status message says so,
which is your hint that WCL changed something.

The URL strategy was chosen as the primary path because Step 0 showed that the URL is WCL's own
source of truth for pins. It handles a whole set in one step, can replace the active pins, and depends on one
documented-by-behavior parameter rather than on dialog markup.

### Architecture

```
src/
  wcl/           Everything WCL-specific (the only place to touch when WCL changes)
    wclContract.ts     hostnames, URL params, view param allow-list, separators, router global, dialog selectors
    pinString.ts       pin string validation, splitting, labels
    viewParams.ts      the saved view type: allow-list filtering, validation, comparison
    reportUrl.ts       read/write the pins and view params on report URLs
    pinDialog.ts       Add Pin dialog automation
    pageBridgeProtocol.ts / pageRouterClient.ts   messages to the in-page router bridge
    strategies/        page router, pin dialog, page reload
  apply/         applyPins orchestration and replace / add planning (WCL-agnostic)
  content/       content-script.js (isolated world) and page-bridge.js (page's own scripts)
  library/       schema (zod) and migrations, pure operations, search, storage, import/export,
                 apply targets (which pins and which saved view a pin or set applies)
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
| A saved view no longer opens the right tab, ability or layout | `ViewQueryParam` in [wclContract.ts](src/wcl/wclContract.ts). Compare it with the params WCL writes into the URL when you switch tabs. |
| Applying pins resets the fight, boss or other settings | The query merge in [pageBridge.ts](src/content/pageBridge.ts). `queryRouting.set()` must always get the full query from `queryRouting.get()`. |
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
  "schemaVersion": 2,
  "pins": [{ "id": "…", "name": "Raid deaths", "description": "", "tags": ["raid"],
             "pinString": "1$Off$#A33C3C$expression$type = \"death\"",
             "createdAt": "…", "updatedAt": "…" }],
  "sets": [{ "id": "…", "name": "Mythic review", "description": "", "tags": [],
             "pinIds": ["…"],
             "viewParams": { "type": "damage-taken", "ability": "1304424", "view": "events" },
             "createdAt": "…", "updatedAt": "…" }]
}
```

`viewParams` is optional on pins and sets. Without it, applying leaves the view alone. With it,
the listed params are set and the other allow-listed params are removed, so `{}` means the default
view.

Export files add `"format": "opposite-pin-library"` and `"exportedAt"`. A set export contains the set
and only its own pins. Older data is migrated when it is read: version 1 libraries and export files
(from before saved views) load as version 2 with no saved views, and the stored library is written
as version 2 on the next change. Data with a newer `schemaVersion` is rejected with a clear message
instead of being overwritten, and damaged stored data is never replaced silently.

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
