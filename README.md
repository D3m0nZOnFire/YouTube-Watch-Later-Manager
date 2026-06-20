# YouTube Watch Later Manager

A Chrome/Brave extension for bulk-cleaning your YouTube Watch Later playlist. It injects a cleanup mode directly into the Watch Later page — no popup workflow, no manual clicking through menus.

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

- **Inline cleanup mode** — a "Clean up" button is injected into the Watch Later page header; no popup required
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
git clone https://github.com/D3m0nZOnFire/YouTube-Watch-Later-Manager.git
```

2. Open `chrome://extensions/` (or `brave://extensions/`)

3. Enable **Developer mode** (toggle in the top-right corner)

4. Click **Load unpacked** and select the cloned folder

5. Navigate to your [Watch Later playlist](https://www.youtube.com/playlist?list=WL)

---

## Usage

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

- **Content script** (`content.js`) runs on every `youtube.com` page and activates only on the Watch Later URL
- **SPA navigation** is handled by a `MutationObserver` watching the full document, so the extension re-initializes correctly after YouTube's client-side navigation
- **Progress labels** are read from `ytd-thumbnail-overlay-resume-playback-renderer #progress` (inline `style.width`)
- **Deletion** simulates YouTube's own UI: opens the video's context menu, finds the "Remove from Watch Later" item, and clicks it — no API calls
- **Responsive layout** detects whether YouTube is in wide or compact mode (`offsetWidth` check on `.wide-screen-form` / `.small-screen-form`) and places the button accordingly

---

## Project Structure

```
youtube-watch-later-manager/
├── manifest.json      # Extension configuration (Manifest V3)
├── content.js         # All page logic: state machine, UI injection, deletion
├── styles.css         # Styles for injected UI elements
├── popup.html         # Minimal popup (opens the Watch Later page)
├── popup.js           # Popup script
├── icons/             # Extension icons (16, 32, 48, 128px PNG)
└── README.md
```

---

## Privacy and Permissions

**Permissions requested:**

- `https://www.youtube.com/*` — required to inject the content script into YouTube pages

No data is collected, no external requests are made, and nothing leaves your browser. All operations interact only with YouTube's own DOM.

---

## Known Limitations

- Only works on the Watch Later playlist (`/playlist?list=WL`)
- YouTube's rate limiting may slow down large batch deletions
- If YouTube updates its DOM structure, selectors may need updating
- Newly lazy-loaded videos (from scrolling) are picked up automatically, but very fast scrolling may outpace the debounce
