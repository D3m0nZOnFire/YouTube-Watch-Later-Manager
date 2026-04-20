// State management
let checkboxesVisible = false;
let isWatchLaterPage = false;

// Get the current tab
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Check if current page is Watch Later
async function checkPageStatus() {
  const tab = await getCurrentTab();
  isWatchLaterPage = tab.url && tab.url.includes('youtube.com/playlist?list=WL');
  
  const pageStatus = document.getElementById('pageStatus');
  const warningMessage = document.getElementById('warningMessage');
  const toggleButton = document.getElementById('toggleCheckboxes');
  
  if (isWatchLaterPage) {
    pageStatus.textContent = 'Watch Later';
    pageStatus.className = 'status-value active';
    warningMessage.classList.remove('show');
    toggleButton.disabled = false;
    document.getElementById('selectWatched').disabled = false;
  } else {
    pageStatus.textContent = 'Not on playlist';
    pageStatus.className = 'status-value inactive';
    warningMessage.classList.add('show');
    toggleButton.disabled = true;
  }
  
  // Get checkbox status from page
  if (isWatchLaterPage) {
    const result = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
    updateUIStatus(result);
  }
}

// Update UI with current status
function updateUIStatus(status) {
  const checkboxStatus = document.getElementById('checkboxStatus');
  const selectedCount = document.getElementById('selectedCount');
  const watchedCount = document.getElementById('watchedCount');
  const inProgressCount = document.getElementById('inProgressCount');
  const toggleButton = document.getElementById('toggleCheckboxes');
  const selectAllBtn = document.getElementById('selectAll');
  const deselectAllBtn = document.getElementById('deselectAll');
  const selectWatchedBtn = document.getElementById('selectWatched');
  const deleteBtn = document.getElementById('deleteSelected');

  checkboxesVisible = status.checkboxesVisible;

  if (checkboxesVisible) {
    checkboxStatus.textContent = 'Active';
    checkboxStatus.className = 'status-value active';
    toggleButton.innerHTML = '<span class="icon">☑️</span><span>Hide Checkboxes</span>';
    selectAllBtn.disabled = false;
    deselectAllBtn.disabled = false;
    selectWatchedBtn.disabled = false;
    deleteBtn.disabled = false;
  } else {
    checkboxStatus.textContent = 'Inactive';
    checkboxStatus.className = 'status-value inactive';
    toggleButton.innerHTML = '<span class="icon">☑️</span><span>Show Checkboxes</span>';
    selectAllBtn.disabled = true;
    deselectAllBtn.disabled = true;
    selectWatchedBtn.disabled = true;
    deleteBtn.disabled = true;
  }

  selectedCount.textContent = status.selectedCount || 0;
  watchedCount.textContent = status.watchedCount != null ? status.watchedCount : '—';
  inProgressCount.textContent = status.inProgressCount != null ? status.inProgressCount : '—';
}

// Toggle checkboxes
async function toggleCheckboxes() {
  const tab = await getCurrentTab();
  const result = await chrome.tabs.sendMessage(tab.id, { action: 'toggleCheckboxes' });
  updateUIStatus(result);
}

// Select all checkboxes
async function selectAll() {
  const tab = await getCurrentTab();
  const result = await chrome.tabs.sendMessage(tab.id, { action: 'selectAll' });
  updateUIStatus(result);
}

// Deselect all checkboxes
async function deselectAll() {
  const tab = await getCurrentTab();
  const result = await chrome.tabs.sendMessage(tab.id, { action: 'deselectAll' });
  updateUIStatus(result);
}

// Delete selected videos
async function deleteSelected() {
  const tab = await getCurrentTab();
  
  // Show progress container
  document.getElementById('progressContainer').classList.add('show');
  
  // Disable all buttons during deletion
  document.querySelectorAll('button').forEach(btn => btn.disabled = true);
  
  // Start deletion
  await chrome.tabs.sendMessage(tab.id, { action: 'deleteSelected' });
  
  // Listen for progress updates
  // Note: Progress will be shown in the content script overlay
}

// Select watched videos (>=85%)
async function selectWatched() {
  const tab = await getCurrentTab();
  const result = await chrome.tabs.sendMessage(tab.id, { action: 'selectWatched', threshold: 85 });
  updateUIStatus(result);
}

// Event listeners
document.getElementById('toggleCheckboxes').addEventListener('click', toggleCheckboxes);
document.getElementById('selectAll').addEventListener('click', selectAll);
document.getElementById('deselectAll').addEventListener('click', deselectAll);
document.getElementById('selectWatched').addEventListener('click', selectWatched);
document.getElementById('deleteSelected').addEventListener('click', deleteSelected);

// Initialize popup
checkPageStatus();

// Refresh status every second while popup is open
setInterval(async () => {
  if (isWatchLaterPage) {
    const tab = await getCurrentTab();
    try {
      const result = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
      updateUIStatus(result);
    } catch (error) {
      // Tab might have been closed or navigated away
      checkPageStatus();
    }
  }
}, 1000);