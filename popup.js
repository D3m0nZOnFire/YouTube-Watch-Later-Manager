document.getElementById('go').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://www.youtube.com/playlist?list=WL' });
});

const toggle = document.getElementById('members-toggle');

chrome.storage.sync.get(['hideMembersOnly'], ({ hideMembersOnly }) => {
  toggle.checked = !!hideMembersOnly;
});

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  chrome.storage.sync.set({ hideMembersOnly: enabled });
  chrome.tabs.query({ url: 'https://www.youtube.com/*' }, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { type: 'toggleMembersFilter', enabled }).catch(() => {});
    });
  });
});
