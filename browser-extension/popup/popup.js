// Cortex Capture — Popup Logic

(async function () {
  // ---------------------------------------------------------------------------
  // State helpers
  // ---------------------------------------------------------------------------

  const states = ['loading', 'config', 'form', 'success', 'duplicate', 'error'];

  function showState(name) {
    states.forEach((s) => {
      const el = document.getElementById(`state-${s}`);
      if (el) el.classList.toggle('hidden', s !== name);
    });
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  showState('loading');

  // Load settings
  const settings = await new Promise((resolve) => {
    chrome.storage.sync.get(['apiUrl', 'apiKey'], resolve);
  });

  const apiUrl = (settings.apiUrl || '').replace(/\/$/, '');
  const apiKey = settings.apiKey || '';

  if (!apiUrl || !apiKey) {
    showState('config');
    document.getElementById('btn-open-options').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
    document.getElementById('link-options').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
    return;
  }

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url) {
    showState('config');
    document.getElementById('btn-open-options').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
    return;
  }

  const pageUrl = tab.url;
  const pageTitle = tab.title || pageUrl;

  // Populate page info
  const titleEl = document.getElementById('page-title');
  const urlEl = document.getElementById('page-url');
  titleEl.textContent = pageTitle;
  titleEl.title = pageTitle;
  urlEl.textContent = pageUrl;
  urlEl.title = pageUrl;

  // Check if already saved (from local cache)
  const { savedUrls = [] } = await new Promise((resolve) => {
    chrome.storage.local.get(['savedUrls'], resolve);
  });
  const alreadySaved = savedUrls.includes(pageUrl);

  // Fetch categories
  let categories = [];
  try {
    const res = await fetch(`${apiUrl}/api/categories`, {
      headers: { 'x-api-key': apiKey },
    });
    if (res.ok) {
      categories = await res.json();
    }
  } catch (err) {
    console.warn('[Cortex] Failed to fetch categories:', err);
  }

  // Populate category dropdown
  const select = document.getElementById('category-select');
  categories.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat.slug;
    opt.textContent = cat.name;
    select.appendChild(opt);
  });

  // If already saved, show duplicate state first but still allow re-navigation
  if (alreadySaved) {
    showState('duplicate');
    bindDuplicateBack();
    bindFooterOptions();
    return;
  }

  showState('form');
  bindFormHandlers();
  bindFooterOptions();

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  function bindFormHandlers() {
    const saveBtn = document.getElementById('btn-save');
    saveBtn.addEventListener('click', handleSave, { once: true });
  }

  async function handleSave() {
    const saveBtn = document.getElementById('btn-save');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    const categorySlug = document.getElementById('category-select').value;
    const notes = document.getElementById('notes-input').value.trim();

    try {
      const body = {
        url: pageUrl,
        capture_source: 'extension',
        ...(categorySlug ? { category_slug: categorySlug } : {}),
        ...(notes ? { user_notes: notes } : {}),
      };

      const res = await fetch(`${apiUrl}/api/items/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(body),
      });

      if (res.status === 409) {
        // Already saved — update local cache and show duplicate state
        await notifyWorkerSaved(pageUrl, tab.id);
        showState('duplicate');
        bindDuplicateBack();
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let detail = `HTTP ${res.status}`;
        try {
          const json = JSON.parse(text);
          detail = json.error || json.message || detail;
        } catch (_) {
          detail = text || detail;
        }
        document.getElementById('error-detail').textContent = detail;
        showState('error');
        bindRetry();
        return;
      }

      const data = await res.json();

      // Notify background worker to update badge
      await notifyWorkerSaved(pageUrl, tab.id);

      // Show success with applied tags
      const tagsEl = document.getElementById('success-tags');
      if (data.applied_tags && data.applied_tags.length > 0) {
        tagsEl.textContent = `Tags: ${data.applied_tags.join(', ')}`;
      } else {
        tagsEl.textContent = '';
      }
      showState('success');
      bindSuccessBack();
    } catch (err) {
      console.error('[Cortex] Save error:', err);
      document.getElementById('error-detail').textContent = err.message || 'Network error';
      showState('error');
      bindRetry();
    }
  }

  function bindSuccessBack() {
    document.getElementById('btn-save-another').addEventListener('click', () => {
      // Since the current page is now saved, show duplicate state
      showState('duplicate');
      bindDuplicateBack();
    }, { once: true });
  }

  function bindDuplicateBack() {
    document.getElementById('btn-dup-back').addEventListener('click', () => {
      // Re-show form so user can save again with different settings if desired
      showState('form');
      bindFormHandlers();
    }, { once: true });
  }

  function bindRetry() {
    document.getElementById('btn-retry').addEventListener('click', () => {
      showState('form');
      bindFormHandlers();
    }, { once: true });
  }

  function bindFooterOptions() {
    document.getElementById('link-options').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  async function notifyWorkerSaved(url, tabId) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'URL_SAVED', url, tabId },
        () => {
          // Ignore errors (worker may not be running)
          if (chrome.runtime.lastError) { /* noop */ }
          resolve();
        }
      );
    });
  }
})();
