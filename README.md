<img src="assets/icon/logo.svg" alt="" width="96" height="96">

# Opposite Pin Library

A Chrome extension (Manifest V3) that makes Warcraft Logs **pins** easy to save, organize and
re-apply. WCL removed its "saved pins from bookmarks" tab, so the only native way to reuse a pin
is to copy its pin string and paste it back by hand. This extension stores pin strings in a
searchable library and applies them to the open report with one click. An entry in the library
holds one pin or several pins that you always use together.

- Save the pins that are active on the open report: one at a time, or all of them together.
- Paste pin strings manually (from WCL's **Copy Pin** button or from a guildmate), or paste a bare
  filter expression such as `type = "cast"` (from a guide, for example) and it becomes a Filter pin.
- Name, describe, tag, search, edit, duplicate and delete entries.
- Apply an entry: **Apply** replaces the pins that are active on the report. When pins
  are already active, **Add to current** keeps them and adds these instead.
- Optionally save the report view (tab, Friendlies/Enemies, ability, layout) with an entry, so
  applying it also opens that view. Saved views work on any report.
- Import and export the library, or a single entry, as JSON to share it with a guild or coach.
- No backend, no tracking, no external requests. Data stays in `chrome.storage.local`.

## Install

Requires Chrome 141 or newer (or Edge, Brave or Arc, see below). The extension is not in the Chrome
Web Store, so it is installed as an unpacked extension.

### From a GitHub release (no build tools needed)

1. Download `opposite-pin-library-vX.Y.Z.zip` from the
   [latest release](https://github.com/Bruckii18/opposite-pin-library/releases/latest).
2. Unzip it into a folder you will keep, for example `Documents/Opposite Pin Library`. Chrome
   loads the extension from that folder, so don't delete or move it.
3. Open `chrome://extensions` and switch on **Developer mode** (top right).
4. Click **Load unpacked** and select the unzipped folder (the one that contains `manifest.json`).
5. Pin the extension to the toolbar if you like.

If a WCL tab was already open before you installed the extension, reload that tab once so the
content script gets injected.

**Updating:** unpacked extensions don't update by themselves.

1. Export your library first (**Export library** in the panel footer), just in case.
2. Download the new ZIP and unzip it over the same folder, replacing the old files.
3. Click the reload icon on the extension's card in `chrome://extensions`, then reload open WCL
   tabs.

Your library is kept. Don't click **Remove** on the extension card: removing an extension deletes
its stored library.

### From source

Requirements: Node.js 22.18 or newer.

```bash
npm install
```

```bash
npm run build
```

Then load the `dist/` folder with **Load unpacked** as described above.

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
  stores one pin as its own entry; pins saved that way show **✓ Saved**. **Save all together**
  stores every active pin in one entry, which needs a name. A pin that is part of a saved entry
  with several pins shows **In <entry name>** next to **Save**.
- **Also save current view (tab, units, ability, layout):** tick this box in either save form to
  store the report view you are looking at (for example *Debuffs*, *Enemies*, ability 1282419,
  *Events*) with the entry. Only the tab, Friendlies/Enemies, the ability and the layout are
  stored. Fight, boss, difficulty, source and the other report settings are not, so the view works
  on any report. The fields stay editable before you save.
- **Library:** one list for everything you saved, no matter if an entry holds one pin or several.
  Search by name, description, tag or any pin expression, and filter by tag chips. Each entry lists
  its pins with their kind and expression. A pin that is also saved on its own shows that entry's
  name instead, so groups stay readable. **+ Add pins** takes one pin per line: a pasted pin string,
  several pin strings joined with `^` (as WCL copies them), or a bare filter expression. An
  expression is saved as a Filter pin (`2$Off$#244F4B$expression$…`), exactly as WCL's *Filter
  Expression* box would create it. Expressions cannot contain `$` or `^`. The name is suggested for
  a single pin and required for several.
- **Tags:** the tag field suggests the tags you already use, most used first.
  Typing narrows the suggestions (matches at the start of a tag come first), and tags you've
  already entered are left out. Click one to add it. A new tag is just typed, comma separated, as
  before.
- **Edit an entry** (⋯ menu, **Edit**): the pins field works like **+ Add pins**. The form has the
  same view checkbox with a **Tab** dropdown (named as on
  WCL: *Damage Taken*, *Buffs*, *Debuffs*, …), a **Friendlies / Enemies** toggle, an **Ability**
  field (a numeric spell ID) and a **Layout** dropdown (*Tables*, *Events*, *Timeline*). There are
  no free-text URL params. Whatever the view doesn't set is removed from the URL when you apply:
  *Friendlies* and *Tables* are WCL's defaults and are not written, an empty ability means all
  abilities, and **Default** as the tab leaves the tab out, so WCL opens its default tab. Untick
  the box to remove the saved view. Entries with a saved view show a label with the tab
  name, for example **View: Debuffs · 1282419**.
- **Apply / Add:** **Apply** applies all pins of an entry to the report in the current tab and
  replaces the pins that are active there, so only these remain. When pins are already active,
  **Add** shows up next to it: it keeps them and adds these (pins that are already active are not
  added twice). If the entry has a saved view, the report switches to it in the same step and
  keeps its fight, boss and other settings. Entries without a saved view leave the view as it is.
- **⋯ menu:** edit, copy the pin strings (joined with `^`, ready for WCL's *Add Pin* dialog), export
  as JSON, duplicate, or delete (click twice to confirm).
- **Import JSON / Export library** (panel footer): exports are versioned JSON files. When you
  import, entries that already exist (same name, same pins) are skipped. Nothing is overwritten.

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

Checked on 2026-10-19 and 2026-10-20, for saved views:

- **The report view lives in the URL next to `pins`**, for example
  `/reports/<code>?boss=3513&difficulty=5&wipes=1&view=events&type=damage-taken&ability=1304424&pins=…`.
  - `type` and `spells` select the tab. Most tabs are just a `type` (`damage-taken`, `threat`,
    `casts`, `deaths`, …), but **Buffs and Debuffs share `type=auras`**: Debuffs is
    `type=auras&spells=debuffs`, Buffs is `type=auras` without `spells`. `type=debuffs` and
    `type=buffs` are not valid WCL values. WCL half-loads the tab and its source dropdown shows
    "undefined".
  - `hostility` is the Friendlies / Enemies toggle: `1` for Enemies, `0` or missing for Friendlies.
  - `ability` is the ability dropdown. It is a spell ID, a game ID, so it is the same in every
    report.
  - `view` is the layout. It is missing for *Tables*, otherwise `events`, `timeline`, ….
- **Tabs are stored, not raw `type` values.** A saved view is `{ tab, hostility, ability, view }`.
  `WCL_TABS` in [wclContract.ts](src/wcl/wclContract.ts) maps each tab to its exact URL params (in
  the order of WCL's tab bar, verified by clicking every tab on a live report), and
  [viewParams.ts](src/wcl/viewParams.ts) converts in both directions: `tabFromQuery()` reads the
  tab from a URL (so a pin saved on the Debuffs tab stores `debuffs`, not Buffs), and
  `toQueryParams()` expands a tab back into `type` and `spells`. To support another tab, add it to
  `WclTab` and `WCL_TABS` (TypeScript reports a missing entry). It then shows up in the form
  dropdown.
- **Only report-independent params are saved.** The view keys (`type`, `spells`, `hostility`,
  `ability`, `view`) are `ViewQueryParam` in [wclContract.ts](src/wcl/wclContract.ts).
  Report-specific params (report code, `fight`, `source`, `target`, `boss`, `difficulty`, `wipes`,
  `start`, `end`) are never stored or written. Stored and imported views are sanitized when they
  are read: unknown keys, tabs, hostility values and layouts, non-numeric abilities, and missing
  values (`null`, `undefined`, `""`, and the strings `"null"`, `"undefined"` and `"NaN"`) are
  dropped.
- **`window.queryRouting.set(query)` replaces the whole query.** Calling it with only `{ pins }`
  drops `boss`, `difficulty`, `type`, `view` and the rest. It drops keys whose value is a real
  `null` or `undefined`, but keeps the strings `"null"` and `"undefined"` as literal values, and
  WCL's dropdowns then break.
- **The target query is built once**, by `buildReportQuery()` in
  [reportQuery.ts](src/wcl/reportQuery.ts), for both the page router and the page reload. It is
  the current query (from `queryRouting.get()` or the URL) without `pins`, `modal` and, when a view
  is applied, every view key, plus `toQueryParams(view)`, plus `pins`. So view keys the saved view
  doesn't produce are removed: switching from Debuffs to Damage Taken drops `spells`, and switching
  from Enemies to Friendlies drops `hostility`. Items without a saved view leave every view key as
  it is. All other params stay as they are, except missing or stringified-missing values, which
  are dropped from the whole query, including ones an earlier broken apply left in the URL.
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
| 1 | **URL via page router** | A tiny script in the page merges the new `pins` value (and the saved view params) into `queryRouting.get()` and passes the result to WCL's `queryRouting.set()`, the same call WCL's *Create Pin* makes. | Default. Instant, no reload, supports entries with many pins, replacing the active pins and saved views. |
| 2 | **Add Pin dialog (UI automation)** | Opens the dialog, switches to *From Paste*, pastes `pin^pin^…`, clicks *Create Pin*. | When the router is missing or ignores the change. It can only **add** pins and cannot change the view, so it steps aside when the plan changes the view. |
| 3 | **URL via full page load** | Navigates to the report URL with the new `pins` parameter and the saved view params. | Last resort, for example replacing active pins or a view change when the router is gone. |

Pins and view always change in the same step: one `queryRouting.set()` call or one navigation.
Because the dialog cannot set URL params, it doesn't apply pins without the view; the page load
applies both instead. Strategies 1 and 2 are checked: the extension waits until the report URL
shows exactly the expected pins (and the expected view params, if a view is applied), otherwise
it moves on to the next strategy. When the dialog fallback is used, the status message says so,
which is your hint that WCL changed something.

The URL strategy was chosen as the primary path because Step 0 showed that the URL is WCL's own
source of truth for pins. It handles many pins in one step, can replace the active pins, and depends on one
documented-by-behavior parameter rather than on dialog markup.

### Architecture

```
src/
  wcl/           Everything WCL-specific (the only place to touch when WCL changes)
    wclContract.ts     hostnames, URL params, view keys, tabs (WCL_TABS), hostility and layout values, separators, router global, dialog selectors
    pinString.ts       pin string validation, splitting, labels
    viewParams.ts      the saved view type: tab <-> URL params (tabFromQuery, toQueryParams), sanitizing, comparison
    reportQuery.ts     the target query for applying (buildReportQuery), shared by page router and page reload
    reportUrl.ts       read pins and view from report URLs, write a query change
    pinDialog.ts       Add Pin dialog automation
    pageBridgeProtocol.ts / pageRouterClient.ts   messages to the in-page router bridge
    strategies/        page router, pin dialog, page reload
  apply/         applyPins orchestration and replace / add planning (WCL-agnostic)
  content/       content-script.js (isolated world) and page-bridge.js (page's own scripts)
  library/       schema (zod) and migrations, pure operations, search, storage, import/export,
                 apply targets (which pins and which saved view an entry applies)
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
| A saved view opens the wrong tab, or WCL shows "undefined" in a dropdown after applying | `WCL_TABS` and `ViewQueryParam` in [wclContract.ts](src/wcl/wclContract.ts). Compare each tab's params with what WCL writes into the URL when you click that tab (Buffs and Debuffs differ only in `spells`). |
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
  "schemaVersion": 5,
  "entries": [
    { "id": "…", "name": "Raid deaths", "description": "", "tags": ["raid"],
      "pins": ["1$Off$#A33C3C$expression$type = \"death\""],
      "createdAt": "…", "updatedAt": "…" },
    { "id": "…", "name": "Mythic review", "description": "", "tags": [],
      "pins": ["1$Off$#A33C3C$expression$type = \"death\"", "2$Off$#244F4B$expression$overkill > 0"],
      "viewParams": { "tab": "debuffs", "hostility": "1", "ability": "1282419", "view": "events" },
      "createdAt": "…", "updatedAt": "…" }
  ]
}
```

An entry owns its pin strings: editing one entry never changes another. Each pin string is stored
once per entry, in the order it is applied.

`viewParams` is optional. Without it, applying leaves the view alone. With it, the URL params for
the listed fields are set and every other view key is removed, so `{}` means the default view.
`tab` is a key of `WCL_TABS` (`damage-taken`, `buffs`, `debuffs`, …), never a raw WCL `type`.
`hostility` is `"0"` (Friendlies) or `"1"` (Enemies), `ability` is a numeric spell ID, and `view`
is a layout (`events` or `timeline`; missing means *Tables*). All values are strings.

Export files add `"format": "opposite-pin-library"` and `"exportedAt"`. An entry export contains
just that entry. Older data is migrated when it is read, from storage and on import:

- Version 1 (from before saved views) gets no saved views.
- Version 2 stored WCL's raw `type`, so its views are converted to tabs: `auras` becomes `buffs`,
  and the invalid `debuffs` and `buffs` that version allowed become `debuffs` and `buffs`. An
  unknown `type` drops the tab and keeps the ability and layout.
- Versions 1 to 4 kept pins and sets apart. Every pin you saved becomes an entry with that one
  pin, and every set becomes an entry with its pins. Pins that "Save all as set" created with a
  generated name (untouched, and only used by sets) live on inside their set's entry only.

The stored library is written as version 5 on the next change. Data with a newer
`schemaVersion` is rejected with a clear message instead of being overwritten, and damaged stored
data is never replaced silently.

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
- `npm run package` builds and zips `dist/` into `opposite-pin-library.zip`, the same file a
  release attaches.

### Releasing

1. Bump `version` in [public/manifest.json](public/manifest.json) and [package.json](package.json).
2. Commit, then tag the commit with the same version and push the tag:

   ```bash
   git tag v0.2.0
   ```

   ```bash
   git push origin v0.2.0
   ```

3. The [Release workflow](.github/workflows/release.yml) checks that the tag matches the manifest
   version, runs lint and tests, builds, and publishes a GitHub release with
   `opposite-pin-library-v0.2.0.zip` attached and generated release notes.

The manifest contains a fixed public `key`, so the extension always gets the same ID
(`hmpbnifmjbmefcchdkflallonbijdpgd`), no matter which folder it is loaded from. Chrome stores the
library per extension ID, so this keeps the library across updates. Don't change or remove the
key: every install would then start with an empty library.

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
