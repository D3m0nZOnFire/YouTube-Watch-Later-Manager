document.getElementById('go').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://www.youtube.com/playlist?list=WL' });
});
