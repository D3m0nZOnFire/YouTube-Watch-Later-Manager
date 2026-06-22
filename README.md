# YouTube Tools

A Chrome/Brave extension that enhances YouTube with sitewide filters and a bulk Watch Later cleanup tool.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Privacy and Permissions](#privacy-and-permissions)
- [Known Limitations](#known-limitations)

---

## Features

### Sitewide
- **Hide members-only videos** — toggle in the popup to hide members-only content across channel pages, the home feed, search results, and anywhere else on YouTube

### Watch Later cleanup
- **Inline cleanup mode** — a "Clean up" button is injected into the Watch Later page header; no popup workflow, no manual clicking through menus
- **Watch progress labels** — every video shows a label at all times: "Watched", a partial percentage, or "Not started"
- **Filter chips** — select videos by category (Watched / Partial / Not started); chips are cumulative and toggleable
- **Per-video checkboxes** — select individual videos on top of chip selections
- **Review before deleting** — a modal lists everything you're about to remove before any action is taken
- **Real-time deletion feedback** — a progress modal shows each video's status (pending, deleting, done, failed) as it happens
- **Retry on failure** — if any deletions fail, a retry option appears for just the failed items
- **Responsive** — adapts to YouTube's compact layout on smaller windows
- **Multi-language** — deletion works regardless of YouTube's interface language

---

## Installation

### From source (developer mode)

1. Clone the repository
```bash
git clone https://github.com/D3m0nZOnFire/Youtube-Tools.git
```

2. Open `chrome://extensions/` (or `brave://extensions/`)

3. Enable **Developer mode** (toggle in the top-right corner)

4. Click **Load unpacked** and select the cloned folder

5. Navigate to [youtube.com](https://www.youtube.com) — the extension is active immediately

---

## Usage

### Hide members-only videos

1. Click the extension icon
2. Toggle **Hide members-only** on — members-only cards disappear sitewide immediately
3. The setting persists across sessions and page reloads

### Watch Later cleanup

1. Go to [youtube.com/playlist?list=WL](https://www.youtube.com/playlist?list=WL)

2. Click **Clean up** in the page header (below the playlist title and play buttons)

3. Use the filter chips in the toolbar to select videos by watch status — chips are additive, click again to deselect a group

4. Adjust individual checkboxes if needed

5. Click **Review** to see the full list of videos to be deleted

6. Confirm — the extension deletes each video one by one using YouTube's native menu

7. A summary shows how many were removed and how many remain; retry any failures directly

8. Click **Exit** at any point to leave cleanup mode without deleting anything

---

## How It Works

- **Members-only filter** injects a single `<style>` tag targeting `ytd-rich-item-renderer:has(.ytContentMetadataViewModelMetadataRowMetadataRowWrap)` — no iteration needed, the CSS selector handles lazy-loaded content automatically
- **Settings** are stored via `chrome.storage.sync` and applied on every page load; toggling in the popup instantly messages all open YouTube tabs
- **Content script** (`content.js`) runs on every `youtube.com` page; the Watch Later cleanup UI activates only on the Watch Later URL
- **SPA navigation** is handled by a `MutationObserver` watching the full document, so the extension re-initializes correctly after YouTube's client-side navigation
- **Progress labels** are read from `ytd-thumbnail-overlay-resume-playback-renderer #progress` (inline `style.width`)
- **Deletion** simulates YouTube's own UI: opens the video's context menu, finds the "Remove from Watch Later" item, and clicks it — no API calls
- **Responsive layout** detects whether YouTube is in wide or compact mode (`offsetWidth` check on `.wide-screen-form` / `.small-screen-form`) and places the button accordingly

---

## Project Structure

```
youtube-tools/
├── manifest.json      # Extension configuration (Manifest V3)
├── content.js         # Page logic: members filter, Watch Later state machine, UI injection, deletion
├── styles.css         # Styles for injected UI elements
├── popup.html         # Settings panel (filters, Watch Later shortcut, GitHub link)
├── popup.js           # Popup script: reads/writes storage, messages open tabs
├── icons/             # Extension icons (16, 32, 48, 128px PNG)
└── README.md
```

---

## Privacy and Permissions

**Permissions requested:**

- `storage` — saves your filter preferences locally via `chrome.storage.sync`
- `https://www.youtube.com/*` — required to inject the content script into YouTube pages

No data is collected, no external requests are made, and nothing leaves your browser. All operations interact only with YouTube's own DOM.

---

## Known Limitations

- YouTube's rate limiting may slow down large batch deletions on Watch Later
- If YouTube updates its DOM structure, selectors may need updating
- Newly lazy-loaded videos (from scrolling) are picked up automatically by the Watch Later cleanup, but very fast scrolling may outpace the debounce
