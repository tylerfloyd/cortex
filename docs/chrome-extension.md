# Chrome Extension

The Cortex Capture browser extension lets you save any web page to your knowledge base with one click. It works in Chrome and any Chromium-based browser (Edge, Brave, Arc, etc.).

## Installation

The extension is not published to the Chrome Web Store — you load it directly from the source directory.

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** using the toggle in the top-right corner of the page
3. Click **Load unpacked**
4. In the file picker, navigate to and select the `browser-extension/` directory in your Cortex repository
5. The extension appears in your toolbar as "Cortex Capture" with a brain icon

If the icon is not immediately visible in the toolbar, click the puzzle piece icon (Extensions) and pin Cortex Capture.

> **Minimum Chrome version:** 103

---

## Configuration

Before you can save pages, you need to connect the extension to your Cortex instance.

1. Right-click the Cortex Capture icon in the toolbar and choose **Options**, or left-click the icon and look for a settings/gear link
2. The Options page has two fields:
   - **API URL** — the base URL of your Cortex instance (e.g. `http://localhost:3000`). Include the scheme, no trailing slash.
   - **API Key** — your `API_KEY` value from `.env`
3. Click **Test Connection** to verify the extension can reach your Cortex instance and the API key is valid
4. Click **Save**

Settings are stored in Chrome's extension storage and persist across browser restarts.

---

## Usage

### Popup: Save the current page

Click the Cortex Capture icon on any page to open the popup. The popup shows:

- The current page URL (pre-filled, read-only)
- A **Category** dropdown populated from your Cortex categories
- A **Notes** text field for any context you want to attach
- A **Save** button

Adjust the category and notes as needed, then click **Save**. The popup shows a success message and closes. Processing happens in the background — the item will appear in your Cortex library once the worker finishes extracting and summarizing it.

### Context menu: Right-click to save

Right-click anywhere on a page and choose **Save to Cortex** from the context menu. This saves the current page using your default settings (no category or notes). Useful for quickly saving pages without opening the popup.

### Badge: Already-saved indicator

When you visit a page that is already in your knowledge base, the extension icon shows a green checkmark badge. This lets you see at a glance whether a page has been saved before.

If you click the icon on an already-saved page, the popup shows an "Already saved" message with a link to open that item in Cortex.

---

## Permissions

The extension requests these permissions (defined in `manifest.json`):

| Permission | Why it is needed |
|---|---|
| `activeTab` | Read the URL and title of the current tab when you click Save |
| `contextMenus` | Add the "Save to Cortex" option to the right-click menu |
| `storage` | Persist your API URL and API key settings locally |
| `tabs` | Detect the current tab URL to check if a page is already saved (badge indicator) |

The extension does not have access to page content — it only reads the URL and title. The actual content extraction happens server-side after you submit the URL.

---

## Troubleshooting

**"Connection failed" when testing settings**
- Check that Cortex is running (`npm run dev` or `docker compose up app`)
- Confirm the API URL has no trailing slash and uses the correct port
- Confirm the API key matches `API_KEY` in your `.env`

**Extension shows "Already saved" but you want to update the item**
- Cortex deduplicates by URL — each URL can only be saved once. To re-process an item, delete it from the Cortex UI first, then save again.

**Badge does not update**
- The badge check runs each time you navigate to a new page. If you saved an item while on that page, try refreshing.
