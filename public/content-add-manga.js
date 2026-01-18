// Content script for Manga Sync - Add Manga Form
(function () {
  // Prevent multiple injections
  if (window.__mangaSyncFormInjected) return;
  window.__mangaSyncFormInjected = true;

  let formContainer = null;
  let formData = null;
  let autoAddButton = null;

  // Listen for messages from background script
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'MANGA_SYNC_SHOW_FORM') {
      formData = message.data;
      showForm();
    } else if (message.type === 'MANGA_SYNC_INJECT_AUTO_BUTTON') {
      injectAutoAddButton(message.data);
    }
  });

  /**
   * Extract manga name from the page using the strategy selector
   * @param {string} selector - CSS selector to find the name element
   * @returns {string} The manga name, trimmed of whitespace
   */
  function extractMangaName(selector) {
    const el = document.querySelector(selector);
    return el ? el.textContent.trim() : '';
  }

  /**
   * Extract cover URLs from the page using the strategy selector
   * @param {string} selector - CSS selector to find the cover image
   * @returns {{ cover: string, coverSmall: string }} The cover URLs
   */
  function extractCovers(selector) {
    const img = document.querySelector(selector);
    if (!img) return { cover: '', coverSmall: '' };

    const srcset = img.getAttribute('srcset');
    const src = img.getAttribute('src') || '';

    if (!srcset) {
      return { cover: src, coverSmall: src };
    }

    // Parse srcset: "url1 193w, url2 125w"
    const srcsetParts = srcset.split(',').map(s => s.trim());
    const parsed = srcsetParts.map(part => {
      const [url, descriptor] = part.split(/\s+/);
      const width = parseInt(descriptor) || 0;
      return { url, width };
    }).filter(p => p.url);

    if (parsed.length === 0) {
      return { cover: src, coverSmall: src };
    }

    // Sort by width descending to get largest first
    parsed.sort((a, b) => b.width - a.width);

    const cover = parsed[0]?.url || src;
    const coverSmall = parsed.length > 1 ? parsed[parsed.length - 1]?.url : cover;

    return { cover, coverSmall };
  }

  /**
   * Inject the auto-add button on supported websites
   * @param {object} data - Data from background script
   */
  function injectAutoAddButton(data) {
    const { domain, path, websites, strategy } = data;

    // Don't inject if button already exists
    if (autoAddButton && document.body.contains(autoAddButton)) return;

    // Find the container to append the button
    const container = document.querySelector(strategy.buttonContainerSelector);
    if (!container) return;

    // Create the button
    autoAddButton = document.createElement('button');
    autoAddButton.id = 'manga-sync-auto-add-btn';
    autoAddButton.className = 'manga-sync-auto-add-btn';
    autoAddButton.textContent = 'Add manga to Manga Sync';
    autoAddButton.type = 'button';

    // Handle button click
    autoAddButton.addEventListener('click', () => {
      // Extract manga info using strategy selectors
      const name = extractMangaName(strategy.nameSelector);
      const covers = extractCovers(strategy.coverSelector);

      // Store form data and show form with pre-filled values
      formData = {
        domain,
        path,
        websites,
        prefill: {
          name,
          cover: covers.cover,
          coverSmall: covers.coverSmall,
        },
      };
      showForm();
    });

    // Append button to container
    container.appendChild(autoAddButton);
  }

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
        <form id="manga-sync-add-form" autocomplete="off">
          <div class="manga-sync-form__group">
            <label for="manga-sync-name">Manga Name *</label>
            <input type="text" id="manga-sync-name" placeholder="Enter manga name" required autocomplete="off" />
          </div>
          <div class="manga-sync-form__group">
            <label for="manga-sync-cover">Cover URL *</label>
            <input type="text" id="manga-sync-cover" placeholder="https://example.com/cover.jpg" required autocomplete="off" />
          </div>
          <div class="manga-sync-form__group">
            <label for="manga-sync-cover-small">Small Cover URL *</label>
            <input type="text" id="manga-sync-cover-small" placeholder="https://example.com/cover-small.jpg" required autocomplete="off" />
          </div>
          <div class="manga-sync-form__divider">Initial Source (Optional)</div>
          <div class="manga-sync-form__group">
            <label for="manga-sync-domain">Domain</label>
            <select id="manga-sync-domain" autocomplete="off">
              <option value="">Select a website</option>
            </select>
          </div>
          <div class="manga-sync-form__group">
            <label for="manga-sync-path">Path</label>
            <input type="text" id="manga-sync-path" placeholder="/manga/example-manga" autocomplete="off" />
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

    // Pre-fill from strategy extraction if available
    if (formData.prefill) {
      document.getElementById('manga-sync-name').value = formData.prefill.name || '';
      document.getElementById('manga-sync-cover').value = formData.prefill.cover || '';
      document.getElementById('manga-sync-cover-small').value = formData.prefill.coverSmall || '';
    }

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
      // Send message to background script to create manga
      const response = await browser.runtime.sendMessage({
        type: 'MANGA_SYNC_CREATE_MANGA',
        data: {
          name,
          cover,
          coverSmall,
          domain,
          path,
        },
      });

      if (!response.success) {
        messageEl.textContent = response.error || 'Failed to create manga';
        messageEl.className = 'manga-sync-form__message manga-sync-form__message--error';
      } else {
        messageEl.textContent = 'Manga added successfully!';
        messageEl.className = 'manga-sync-form__message manga-sync-form__message--success';

        setTimeout(hideForm, 1500);
      }
    } catch (error) {
      messageEl.textContent = error.message || 'An error occurred';
      messageEl.className = 'manga-sync-form__message manga-sync-form__message--error';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Manga';
    }
  }
})();
