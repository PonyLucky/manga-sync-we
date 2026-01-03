// Background script for Manga Sync Web Extension
// Opens a new tab with the main interface when the extension icon is clicked

browser.action.onClicked.addListener(() => {
  browser.tabs.create({
    url: browser.runtime.getURL('index.html'),
  });
});
