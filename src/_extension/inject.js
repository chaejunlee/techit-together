function parseData(obj) {
  return obj[0].result;
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    const accessToken = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.localStorage.getItem('access_token') });

    await chrome.storage.session.set({ ['access_token']: parseData(accessToken) }, () => { });

    const persistedStore = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.localStorage.getItem('persist:globWebPersistedStore') });

    await chrome.storage.session.set({ ['persist:globWebPersistedStore']: parseData(persistedStore) }, () => { });
  }
  catch (err) {
    window.console.log(err);
  }
});