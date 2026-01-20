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

  function createFormGroup(labelText, inputId, inputAttrs) {
    const group = document.createElement('div');
    group.className = 'manga-sync-form__group';

    const label = document.createElement('label');
    label.setAttribute('for', inputId);
    label.textContent = labelText;
    group.appendChild(label);

    let input;
    if (inputAttrs.tagName === 'select') {
      input = document.createElement('select');
      if (inputAttrs.options) {
        inputAttrs.options.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.text;
          input.appendChild(option);
        });
      }
    } else {
      input = document.createElement('input');
      input.type = inputAttrs.type || 'text';
      if (inputAttrs.placeholder) input.placeholder = inputAttrs.placeholder;
      if (inputAttrs.required) input.required = true;
    }
    input.id = inputId;
    input.autocomplete = 'off';
    group.appendChild(input);

    return group;
  }

  function showForm() {
    // Remove existing form if any
    if (formContainer) {
      formContainer.remove();
    }

    formContainer = document.createElement('div');
    formContainer.id = 'manga-sync-form-container';

    // Create form wrapper
    const formWrapper = document.createElement('div');
    formWrapper.className = 'manga-sync-form';

    // Header
    const header = document.createElement('div');
    header.className = 'manga-sync-form__header';
    const h2 = document.createElement('h2');
    h2.textContent = 'Add Manga to Manga Sync';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'manga-sync-form__close';
    closeBtn.id = 'manga-sync-close';
    closeBtn.textContent = '\u00D7';
    header.appendChild(h2);
    header.appendChild(closeBtn);
    formWrapper.appendChild(header);

    // Form
    const form = document.createElement('form');
    form.id = 'manga-sync-add-form';
    form.autocomplete = 'off';

    // Form groups
    form.appendChild(createFormGroup('Manga Name *', 'manga-sync-name', {
      type: 'text', placeholder: 'Enter manga name', required: true
    }));
    form.appendChild(createFormGroup('Cover URL *', 'manga-sync-cover', {
      type: 'text', placeholder: 'https://example.com/cover.jpg', required: true
    }));
    form.appendChild(createFormGroup('Small Cover URL *', 'manga-sync-cover-small', {
      type: 'text', placeholder: 'https://example.com/cover-small.jpg', required: true
    }));

    // Divider
    const divider = document.createElement('div');
    divider.className = 'manga-sync-form__divider';
    divider.textContent = 'Initial Source (Optional)';
    form.appendChild(divider);

    form.appendChild(createFormGroup('Domain', 'manga-sync-domain', {
      tagName: 'select', options: [{ value: '', text: 'Select a website' }]
    }));
    form.appendChild(createFormGroup('Path', 'manga-sync-path', {
      type: 'text', placeholder: '/manga/example-manga'
    }));

    // Actions
    const actions = document.createElement('div');
    actions.className = 'manga-sync-form__actions';
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'manga-sync-btn manga-sync-btn--ghost';
    cancelBtn.id = 'manga-sync-cancel';
    cancelBtn.textContent = 'Cancel';
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'manga-sync-btn manga-sync-btn--primary';
    submitBtn.id = 'manga-sync-submit';
    submitBtn.textContent = 'Add Manga';
    actions.appendChild(cancelBtn);
    actions.appendChild(submitBtn);
    form.appendChild(actions);

    // Message
    const message = document.createElement('div');
    message.className = 'manga-sync-form__message';
    message.id = 'manga-sync-message';
    form.appendChild(message);

    formWrapper.appendChild(form);
    formContainer.appendChild(formWrapper);

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
