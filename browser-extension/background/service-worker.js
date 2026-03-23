// Cortex Capture - Background Service Worker
// Handles context menu, badge updates, and background API calls

const CONTEXT_MENU_ID = 'cortex-save';
const BADGE_COLOR_SAVED = '#22c55e';   // green
const BADGE_COLOR_ERROR = '#ef4444';   // red

// ---------------------------------------------------------------------------
// Installation
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Save to Cortex',
    contexts: ['page', 'link'],
  });
});

// ---------------------------------------------------------------------------
// Context menu handler
// ---------------------------------------------------------------------------

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) return;

  // Prefer the link URL when right-clicking a link, otherwise use the page URL
  const targetUrl = info.linkUrl || info.pageUrl;
  if (!targetUrl) return;

  const { apiUrl, apiKey } = await getSettings();

  if (!apiUrl || !apiKey) {
    // Badge indicates misconfiguration
    setBadge(tab.id, '!', '#f59e0b');
    return;
  }

  try {
    const result = await ingestUrl(apiUrl, apiKey, targetUrl);

    if (result.alreadySaved) {
      // Mark as saved in local cache regardless (it is saved)
      await markUrlSaved(targetUrl);
      setBadge(tab.id, '✓', BADGE_COLOR_SAVED);
    } else if (result.ok) {
      await markUrlSaved(targetUrl);
      setBadge(tab.id, '✓', BADGE_COLOR_SAVED);
    } else {
      setBadge(tab.id, '✗', BADGE_COLOR_ERROR);
    }
  } catch (err) {
    console.error('[Cortex] Context menu save failed:', err);
    setBadge(tab.id, '✗', BADGE_COLOR_ERROR);
  }
});

// ---------------------------------------------------------------------------
// Tab updates — refresh badge when user navigates
// ---------------------------------------------------------------------------

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only act when the page has finished loading and has a URL
  if (changeInfo.status !== 'complete' || !tab.url) return;
  await refreshBadgeForTab(tabId, tab.url);
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (!tab || !tab.url) return;
  await refreshBadgeForTab(tabId, tab.url);
});

// ---------------------------------------------------------------------------
// Messages from popup
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'URL_SAVED') {
    const { url, tabId } = message;
    markUrlSaved(url).then(() => {
      if (tabId != null) setBadge(tabId, '✓', BADGE_COLOR_SAVED);
      sendResponse({ ok: true });
    });
    return true; // keep channel open for async response
  }

  if (message.type === 'CHECK_SAVED') {
    const { url } = message;
    isUrlSaved(url).then((saved) => sendResponse({ saved }));
    return true;
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiUrl', 'apiKey'], (items) => {
      resolve({
        apiUrl: items.apiUrl || '',
        apiKey: items.apiKey || '',
      });
    });
  });
}

async function ingestUrl(apiUrl, apiKey, url, options = {}) {
  const body = {
    url,
    capture_source: 'extension',
    ...(options.categorySlug ? { category_slug: options.categorySlug } : {}),
    ...(options.notes ? { user_notes: options.notes } : {}),
  };

  const response = await fetch(`${apiUrl}/api/items/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (response.status === 409) {
    return { ok: true, alreadySaved: true };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return { ok: false, error: `HTTP ${response.status}: ${text}` };
  }

  const data = await response.json();
  return { ok: true, alreadySaved: false, data };
}

async function getSavedUrls() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['savedUrls'], (items) => {
      resolve(items.savedUrls || []);
    });
  });
}

async function isUrlSaved(url) {
  const saved = await getSavedUrls();
  return saved.includes(url);
}

async function markUrlSaved(url) {
  const saved = await getSavedUrls();
  if (!saved.includes(url)) {
    saved.push(url);
    // Cap at 5000 entries to avoid bloating storage
    const trimmed = saved.slice(-5000);
    await new Promise((resolve) => {
      chrome.storage.local.set({ savedUrls: trimmed }, resolve);
    });
  }
}

async function refreshBadgeForTab(tabId, url) {
  // Skip internal Chrome pages
  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    chrome.action.setBadgeText({ tabId, text: '' });
    return;
  }

  const saved = await isUrlSaved(url);
  if (saved) {
    setBadge(tabId, '✓', BADGE_COLOR_SAVED);
  } else {
    chrome.action.setBadgeText({ tabId, text: '' });
  }
}

function setBadge(tabId, text, color) {
  chrome.action.setBadgeBackgroundColor({ tabId, color });
  chrome.action.setBadgeText({ tabId, text });
}
