// Background script for Manga Sync Web Extension
// Opens a new tab with the main interface when the extension icon is clicked

browser.action.onClicked.addListener(() => {
  browser.tabs.create({
    url: browser.runtime.getURL('index.html'),
  });
});

// Context menu IDs
const MENU_ADD_WEBSITE = 'manga-sync-add-website';
const MENU_ADD_MANGA = 'manga-sync-add-manga';

// Create context menus on install
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: MENU_ADD_WEBSITE,
    title: 'Add this website to Manga Sync',
    contexts: ['page'],
  });

  browser.contextMenus.create({
    id: MENU_ADD_MANGA,
    title: 'Add this page as a manga',
    contexts: ['page'],
  });
});

// Update context menu visibility based on current tab
browser.tabs.onActivated.addListener(updateContextMenus);
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    updateContextMenus();
  }
});

async function updateContextMenus() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;

    const url = new URL(tab.url);
    const domain = url.hostname;
    const pathname = url.pathname;

    const storage = await browser.storage.local.get(['websites', 'sources']);
    const websites = storage.websites || [];
    const sources = storage.sources || [];

    const matchingWebsite = websites.find(w => domain === w.domain || domain.endsWith('.' + w.domain));
    const websiteExists = !!matchingWebsite;

    // Check if current path matches an existing source (manga already added or reading a chapter)
    let pathAlreadyTracked = false;
    if (matchingWebsite) {
      const websiteSources = sources.filter(s => s.website_id === matchingWebsite.id);
      pathAlreadyTracked = websiteSources.some(source => pathname.startsWith(source.path));
    }

    // Show "Add website" only if website is NOT already added
    browser.contextMenus.update(MENU_ADD_WEBSITE, {
      visible: !websiteExists,
    });

    // Show "Add manga" only if website IS added AND path is NOT already tracked
    browser.contextMenus.update(MENU_ADD_MANGA, {
      visible: websiteExists && !pathAlreadyTracked,
    });
  } catch (error) {
    // Ignore errors for non-http pages
  }
}

// Handle context menu clicks
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.url) return;

  const url = new URL(tab.url);
  const domain = url.hostname;

  if (info.menuItemId === MENU_ADD_WEBSITE) {
    await handleAddWebsite(domain);
  } else if (info.menuItemId === MENU_ADD_MANGA) {
    await handleAddManga(tab.id, domain, url.pathname);
  }
});

async function handleAddWebsite(domain) {
  try {
    const storage = await browser.storage.local.get(['apiUrl', 'bearerToken', 'websites']);
    const { apiUrl, bearerToken, websites = [] } = storage;

    if (!apiUrl || !bearerToken) {
      console.error('Manga Sync: API not configured');
      return;
    }

    // Create website via API
    const response = await fetch(`${apiUrl}/websites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
      },
      body: JSON.stringify({ domain }),
    });

    if (response.ok) {
      const data = await response.json();
      // Update local storage
      websites.push(data);
      await browser.storage.local.set({ websites });
      await updateContextMenus();
    }
  } catch (error) {
    console.error('Manga Sync: Failed to add website', error);
  }
}

async function handleAddManga(tabId, domain, path) {
  try {
    // Inject the add manga form into the page
    await browser.scripting.executeScript({
      target: { tabId },
      files: ['content-add-manga.js'],
    });

    await browser.scripting.insertCSS({
      target: { tabId },
      files: ['content-add-manga.css'],
    });

    // Send data to the content script
    const storage = await browser.storage.local.get(['websites']);

    await browser.tabs.sendMessage(tabId, {
      type: 'MANGA_SYNC_SHOW_FORM',
      data: {
        domain,
        path,
        websites: storage.websites || [],
      },
    });
  } catch (error) {
    console.error('Manga Sync: Failed to inject form', error);
  }
}

// Handle messages from content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'MANGA_SYNC_CREATE_MANGA') {
    handleCreateManga(message.data).then(sendResponse);
    return true; // Keep the message channel open for async response
  }
});

async function handleCreateManga({ name, cover, coverSmall, domain, path }) {
  try {
    const storage = await browser.storage.local.get(['apiUrl', 'bearerToken']);
    const { apiUrl, bearerToken } = storage;

    if (!apiUrl || !bearerToken) {
      return { success: false, error: 'API not configured' };
    }

    // Create manga (backend handles source creation when domain and path are provided)
    const mangaResponse = await fetch(`${apiUrl}/manga`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearerToken}`,
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
      return { success: false, error: 'Failed to create manga' };
    }

    const manga = await mangaResponse.json();

    // Refresh sources in local storage
    if (domain && path) {
      const sourcesResponse = await fetch(`${apiUrl}/source`, {
        headers: { Authorization: `Bearer ${bearerToken}` },
      });
      if (sourcesResponse.ok) {
        const sources = await sourcesResponse.json();
        await browser.storage.local.set({ sources });
      }
    }

    return { success: true, manga };
  } catch (error) {
    console.error('Manga Sync: Failed to create manga', error);
    return { success: false, error: error.message || 'An error occurred' };
  }
}

// Auto-update manga chapter when navigating to a chapter page
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;

      const storage = await browser.storage.local.get(['websites', 'sources', 'apiUrl', 'bearerToken']);
      const websites = storage.websites || [];
      const sources = storage.sources || [];
      const apiUrl = storage.apiUrl;
      const bearerToken = storage.bearerToken;

      if (!apiUrl || !bearerToken) return;

      // 1. Detect if the visited domain exist in the websites
      const matchingWebsite = websites.find(w => domain === w.domain || domain.endsWith('.' + w.domain));
      if (!matchingWebsite) return;

      // 2. Check if the url path matches with the source
      const websiteSources = sources.filter(s => s.website_id === matchingWebsite.id);
      
      for (const source of websiteSources) {
        if (url.pathname.startsWith(source.path)) {
          // 3. Extract the chapter from the rest of the url
          const remainingPath = url.pathname.slice(source.path.length);
          let chapter = remainingPath.startsWith('/') ? remainingPath.slice(1) : remainingPath;
          
          // Remove trailing slash if present
          if (chapter.endsWith('/')) {
            chapter = chapter.slice(0, -1);
          }

          if (chapter) {
            // 4. PATCH /manga/{id} with the chapter and website_domain in the body
            await fetch(`${apiUrl}/manga/${source.manga_id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${bearerToken}`
              },
              body: JSON.stringify({
                chapter_number: chapter,
                website_domain: matchingWebsite.domain
              })
            });
          }
          break;
        }
      }
    } catch (error) {
      console.error('Manga Sync: Auto-update failed', error);
    }
  }
});
