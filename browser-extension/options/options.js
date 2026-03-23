// Cortex Capture — Options Page Logic

(function () {
  const apiUrlInput  = document.getElementById('api-url');
  const apiKeyInput  = document.getElementById('api-key');
  const btnSave      = document.getElementById('btn-save');
  const btnTest      = document.getElementById('btn-test');
  const btnClear     = document.getElementById('btn-clear-cache');
  const saveStatus   = document.getElementById('save-status');
  const testStatus   = document.getElementById('test-status');
  const cacheStatus  = document.getElementById('cache-status');

  // ---------------------------------------------------------------------------
  // Load saved settings on open
  // ---------------------------------------------------------------------------

  chrome.storage.sync.get(['apiUrl', 'apiKey'], (items) => {
    apiUrlInput.value = items.apiUrl || '';
    apiKeyInput.value = items.apiKey || '';
  });

  // ---------------------------------------------------------------------------
  // Save settings
  // ---------------------------------------------------------------------------

  btnSave.addEventListener('click', () => {
    const apiUrl = apiUrlInput.value.trim().replace(/\/$/, '');
    const apiKey = apiKeyInput.value.trim();

    if (!apiUrl) {
      showStatus(saveStatus, 'error', 'API URL is required.');
      return;
    }

    if (!apiKey) {
      showStatus(saveStatus, 'error', 'API Key is required.');
      return;
    }

    try {
      new URL(apiUrl); // validate URL format
    } catch (_) {
      showStatus(saveStatus, 'error', 'API URL is not a valid URL.');
      return;
    }

    btnSave.disabled = true;
    btnSave.textContent = 'Saving…';

    chrome.storage.sync.set({ apiUrl, apiKey }, () => {
      if (chrome.runtime.lastError) {
        showStatus(saveStatus, 'error', `Failed to save: ${chrome.runtime.lastError.message}`);
      } else {
        showStatus(saveStatus, 'success', 'Settings saved.');
        // Update the input to normalised URL (no trailing slash)
        apiUrlInput.value = apiUrl;
      }
      btnSave.disabled = false;
      btnSave.textContent = 'Save Settings';
    });
  });

  // ---------------------------------------------------------------------------
  // Test connection
  // ---------------------------------------------------------------------------

  btnTest.addEventListener('click', async () => {
    const apiUrl = apiUrlInput.value.trim().replace(/\/$/, '');
    const apiKey = apiKeyInput.value.trim();

    if (!apiUrl || !apiKey) {
      showStatus(testStatus, 'error', 'Enter both API URL and API Key before testing.');
      return;
    }

    btnTest.disabled = true;
    btnTest.textContent = 'Testing…';
    clearStatus(testStatus);

    try {
      // Primary check: hit /api/health if it exists, otherwise fall back to /api/categories
      let ok = false;
      let detail = '';

      // Try /api/health first (lightweight)
      try {
        const res = await fetch(`${apiUrl}/api/health`, {
          headers: { 'x-api-key': apiKey },
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          ok = true;
          detail = 'Connection successful.';
        } else if (res.status === 401 || res.status === 403) {
          ok = false;
          detail = 'Invalid API key.';
        } else if (res.status === 404) {
          // /api/health not found — try /api/categories as a fallback
          throw new Error('HEALTH_NOT_FOUND');
        } else {
          ok = false;
          detail = `Server returned ${res.status}.`;
        }
      } catch (err) {
        if (err.message === 'HEALTH_NOT_FOUND') {
          // Fallback: test via /api/categories
          const res2 = await fetch(`${apiUrl}/api/categories`, {
            headers: { 'x-api-key': apiKey },
            signal: AbortSignal.timeout(8000),
          });
          if (res2.ok) {
            ok = true;
            const cats = await res2.json();
            detail = `Connection successful. Found ${cats.length} categor${cats.length === 1 ? 'y' : 'ies'}.`;
          } else if (res2.status === 401 || res2.status === 403) {
            ok = false;
            detail = 'Invalid API key.';
          } else {
            ok = false;
            detail = `Server returned ${res2.status}.`;
          }
        } else {
          throw err;
        }
      }

      showStatus(testStatus, ok ? 'success' : 'error', detail);
    } catch (err) {
      if (err.name === 'TimeoutError') {
        showStatus(testStatus, 'error', 'Connection timed out. Check the API URL.');
      } else {
        showStatus(testStatus, 'error', `Connection failed: ${err.message}`);
      }
    } finally {
      btnTest.disabled = false;
      btnTest.textContent = 'Test Connection';
    }
  });

  // ---------------------------------------------------------------------------
  // Clear cache
  // ---------------------------------------------------------------------------

  btnClear.addEventListener('click', () => {
    if (!confirm('Clear the saved URL cache? The badge indicator will not show for previously saved pages until you re-save them.')) {
      return;
    }
    chrome.storage.local.set({ savedUrls: [] }, () => {
      showStatus(cacheStatus, 'success', 'Cache cleared.');
    });
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function showStatus(el, type, message) {
    el.textContent = message;
    el.className = `status-msg visible ${type}`;
  }

  function clearStatus(el) {
    el.textContent = '';
    el.className = 'status-msg';
  }
})();
