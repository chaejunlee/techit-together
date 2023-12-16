const TARGET_URL = "techit.education"

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const tab = await getTab();

    const isTarget = isTargetSite(tab.url);

    if (!isTarget) {
      const body = document.body;
      body.innerHTML = `
      <div class="flex flex-col gap">
        <h2 class="text-center pt-4">You are not on techit.</h2>
        <button class="go-to-techit button">Go to Techit</button>
      </div>
      `

      const goToTechit = document.querySelector(".go-to-techit");
      if (goToTechit) {
        goToTechit.addEventListener('click', () => {
          window.open("https://techit.education", "techit-together");
        })
      }
      return;
    }

    await storeSessionToGlobal(tab);
  }
  catch (err) {
    window.console.log(err);
  }
});

async function getTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function isTargetSite(url) {
  return url.includes(TARGET_URL);
}

async function storeSessionToGlobal(tab) {
  const accessToken = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.localStorage.getItem('access_token') });
  const persistedStore = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.localStorage.getItem('persist:globWebPersistedStore') });

  await chrome.storage.session.set({ ['access_token']: parseData(accessToken) }, () => { });
  await chrome.storage.session.set({ ['persist:globWebPersistedStore']: parseData(persistedStore) }, () => { });
}

function parseData(obj) {
  return obj[0].result;
}