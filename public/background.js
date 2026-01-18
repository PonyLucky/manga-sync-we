// Background script for Manga Sync Web Extension
// Opens a new tab with the main interface when the extension icon is clicked

browser.action.onClicked.addListener(() => {
  browser.tabs.create({
    url: browser.runtime.getURL('index.html'),
  });
});

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
