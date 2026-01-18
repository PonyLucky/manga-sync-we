// Content script for Manga Sync - Add Manga Form
(function () {
  // Prevent multiple injections
  if (window.__mangaSyncFormInjected) return;
  window.__mangaSyncFormInjected = true;

  let formContainer = null;
  let formData = null;

  // Listen for messages from background script
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'MANGA_SYNC_SHOW_FORM') {
      formData = message.data;
      showForm();
    }
  });

  function showForm() {
    // Remove existing form if any
    if (formContainer) {
      formContainer.remove();
    }

    formContainer = document.createElement('div');
    formContainer.id = 'manga-sync-form-container';
    formContainer.innerHTML = `
      <div class="manga-sync-form">
        <div class="manga-sync-form__header">
          <h2>Add Manga to Manga Sync</h2>
          <button type="button" class="manga-sync-form__close" id="manga-sync-close">&times;</button>
        </div>
        <form id="manga-sync-add-form">
          <div class="manga-sync-form__group">
            <label for="manga-sync-name">Manga Name *</label>
            <input type="text" id="manga-sync-name" placeholder="Enter manga name" required />
          </div>
          <div class="manga-sync-form__group">
            <label for="manga-sync-cover">Cover URL *</label>
            <input type="text" id="manga-sync-cover" placeholder="https://example.com/cover.jpg" required />
          </div>
          <div class="manga-sync-form__group">
            <label for="manga-sync-cover-small">Small Cover URL *</label>
            <input type="text" id="manga-sync-cover-small" placeholder="https://example.com/cover-small.jpg" required />
          </div>
          <div class="manga-sync-form__divider">Initial Source (Optional)</div>
          <div class="manga-sync-form__group">
            <label for="manga-sync-domain">Domain</label>
            <select id="manga-sync-domain">
              <option value="">Select a website</option>
            </select>
          </div>
          <div class="manga-sync-form__group">
            <label for="manga-sync-path">Path</label>
            <input type="text" id="manga-sync-path" placeholder="/manga/example-manga" />
          </div>
          <div class="manga-sync-form__actions">
            <button type="button" class="manga-sync-btn manga-sync-btn--ghost" id="manga-sync-cancel">Cancel</button>
            <button type="submit" class="manga-sync-btn manga-sync-btn--primary" id="manga-sync-submit">Add Manga</button>
          </div>
          <div class="manga-sync-form__message" id="manga-sync-message"></div>
        </form>
      </div>
    `;

    document.body.insertBefore(formContainer, document.body.firstChild);

    // Populate domain dropdown
    const domainSelect = document.getElementById('manga-sync-domain');
    formData.websites.forEach((website) => {
      const option = document.createElement('option');
      option.value = website.domain;
      option.textContent = website.domain;
      if (website.domain === formData.domain || formData.domain.endsWith('.' + website.domain)) {
        option.selected = true;
      }
      domainSelect.appendChild(option);
    });

    // Pre-fill path
    document.getElementById('manga-sync-path').value = formData.path;

    // Event listeners
    document.getElementById('manga-sync-close').addEventListener('click', hideForm);
    document.getElementById('manga-sync-cancel').addEventListener('click', hideForm);
    document.getElementById('manga-sync-add-form').addEventListener('submit', handleSubmit);
  }

  function hideForm() {
    if (formContainer) {
      formContainer.remove();
      formContainer = null;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('manga-sync-name').value.trim();
    const cover = document.getElementById('manga-sync-cover').value.trim();
    const coverSmall = document.getElementById('manga-sync-cover-small').value.trim();
    const domain = document.getElementById('manga-sync-domain').value;
    const path = document.getElementById('manga-sync-path').value.trim();

    const messageEl = document.getElementById('manga-sync-message');
    const submitBtn = document.getElementById('manga-sync-submit');

    if (!name || !cover || !coverSmall) {
      messageEl.textContent = 'Please fill in all required fields';
      messageEl.className = 'manga-sync-form__message manga-sync-form__message--error';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';

    try {
      // Get website ID if domain is selected
      let websiteId = null;
      if (domain) {
        const website = formData.websites.find((w) => w.domain === domain);
        if (website) {
          websiteId = website.id;
        }
      }

      // Create manga
      const mangaResponse = await fetch(`${formData.apiUrl}/manga`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${formData.bearerToken}`,
        },
        body: JSON.stringify({
          name,
          cover,
          cover_small: coverSmall,
          website_domain: domain || undefined,
          source_path: path || undefined,
        }),
      });

      if (!mangaResponse.ok) {
        throw new Error('Failed to create manga');
      }

      const manga = await mangaResponse.json();

      // Create source if domain and path are provided
      if (websiteId && path) {
        const sourceResponse = await fetch(`${formData.apiUrl}/sources`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${formData.bearerToken}`,
          },
          body: JSON.stringify({
            manga_id: manga.id,
            website_id: websiteId,
            path,
          }),
        });

        if (!sourceResponse.ok) {
          messageEl.textContent = 'Manga created but failed to add source';
          messageEl.className = 'manga-sync-form__message manga-sync-form__message--error';
          return;
        }
      }

      messageEl.textContent = 'Manga added successfully!';
      messageEl.className = 'manga-sync-form__message manga-sync-form__message--success';

      setTimeout(hideForm, 1500);
    } catch (error) {
      messageEl.textContent = error.message || 'An error occurred';
      messageEl.className = 'manga-sync-form__message manga-sync-form__message--error';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Manga';
    }
  }
})();
