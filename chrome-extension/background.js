// Open the games site in a new tab whenever the toolbar icon is clicked.
// Manifest V3 service worker — no popup, no permissions needed.
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: "https://unlimitedgames.vercel.app/" });
});
