// State
let checkboxesVisible = false;
let checkboxElements = [];

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getStatus':
      sendResponse(getStatus());
      break;
    case 'toggleCheckboxes':
      toggleCheckboxes();
      sendResponse(getStatus());
      break;
    case 'selectAll':
      selectAll();
      sendResponse(getStatus());
      break;
    case 'deselectAll':
      deselectAll();
      sendResponse(getStatus());
      break;
    case 'deleteSelected':
      deleteSelected();
      sendResponse({ success: true });
      break;
  }
  return true;
});

// Check if on Watch Later page
function isWatchLaterPage() {
  return window.location.href.includes('/playlist?list=WL');
}

// Get current status
function getStatus() {
  const checkboxes = document.querySelectorAll('.yt-wl-checkbox');
  const checkedBoxes = document.querySelectorAll('.yt-wl-checkbox:checked');
  
  return {
    checkboxesVisible: checkboxesVisible,
    totalVideos: checkboxes.length,
    selectedCount: checkedBoxes.length
  };
}

// Add checkboxes to videos
function addCheckboxes() {
  if (!isWatchLaterPage()) return;
  
  const videos = document.querySelectorAll('ytd-playlist-video-renderer');
  
  videos.forEach((video, index) => {
    // Skip if checkbox already exists
    if (video.querySelector('.yt-wl-checkbox-container')) {
      return;
    }
    
    // Create checkbox container
    const container = document.createElement('div');
    container.className = 'yt-wl-checkbox-container';
    
    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'yt-wl-checkbox';
    checkbox.dataset.videoIndex = index;
    
    // Prevent checkbox from triggering video navigation
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    container.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    container.appendChild(checkbox);
    
    // Insert checkbox column
    const videoContent = video.querySelector('#content');
    if (videoContent) {
      videoContent.style.display = 'flex';
      videoContent.style.flexDirection = 'row';
      videoContent.insertBefore(container, videoContent.firstChild);
    }
  });
  
  checkboxElements = Array.from(document.querySelectorAll('.yt-wl-checkbox'));
}

// Remove checkboxes
function removeCheckboxes() {
  document.querySelectorAll('.yt-wl-checkbox-container').forEach(el => el.remove());
  checkboxElements = [];
}

// Toggle checkboxes visibility
function toggleCheckboxes() {
  if (checkboxesVisible) {
    removeCheckboxes();
    checkboxesVisible = false;
  } else {
    addCheckboxes();
    checkboxesVisible = true;
  }
}

// Select all checkboxes
function selectAll() {
  document.querySelectorAll('.yt-wl-checkbox').forEach(cb => cb.checked = true);
}

// Deselect all checkboxes
function deselectAll() {
  document.querySelectorAll('.yt-wl-checkbox').forEach(cb => cb.checked = false);
}

// Delete selected videos
async function deleteSelected() {
  const videos = document.querySelectorAll('ytd-playlist-video-renderer');
  const selectedVideos = Array.from(videos).filter(video => {
    const checkbox = video.querySelector('.yt-wl-checkbox');
    return checkbox && checkbox.checked;
  });
  
  if (selectedVideos.length === 0) {
    showNotification('No videos selected!', 'warning');
    return;
  }
  
  // Show progress overlay
  const overlay = createProgressOverlay(selectedVideos.length);
  document.body.appendChild(overlay);
  
  let index = 0;
  let successCount = 0;
  let failCount = 0;
  
  for (const video of selectedVideos) {
    updateProgress(overlay, index, selectedVideos.length, successCount, failCount);
    
    const menuButton = video.querySelector('#menu button');
    if (menuButton) {
      menuButton.click();
      
      await sleep(300);
      
      const menuItems = document.querySelectorAll('tp-yt-paper-listbox#items > ytd-menu-service-item-renderer');
      
      let removeButton = null;
      const removePatterns = [
        'Remove from Watch later',
        'Supprimer de À regarder plus tard',
        'Aus "Später ansehen" entfernen',
        'Eliminar de Ver más tarde',
        'Rimuovi da Guarda più tardi'
      ];
      
      for (const item of menuItems) {
        const text = item.textContent.trim();
        if (removePatterns.some(pattern => text.includes(pattern.split(' ')[0]))) {
          removeButton = item;
          break;
        }
      }
      
      if (!removeButton && menuItems.length > 0) {
        removeButton = menuItems[0];
      }
      
      if (removeButton) {
        removeButton.click();
        successCount++;
      } else {
        failCount++;
      }
      
      await sleep(500);
    } else {
      failCount++;
    }
    
    index++;
  }
  
  // Show completion
  updateProgress(overlay, selectedVideos.length, selectedVideos.length, successCount, failCount, true);
  
  await sleep(3000);
  overlay.remove();
  
  // Refresh page
  removeCheckboxes();
  checkboxesVisible = false;
  
  showNotification(`Deleted ${successCount} videos (${failCount} failed)`, 'success');
}

// Create progress overlay
function createProgressOverlay(total) {
  const overlay = document.createElement('div');
  overlay.className = 'yt-wl-progress-overlay';
  overlay.innerHTML = `
    <div class="yt-wl-progress-card">
      <h3>Deleting Videos</h3>
      <div class="yt-wl-progress-stats">
        <span id="yt-wl-progress-current">0</span> / <span id="yt-wl-progress-total">${total}</span>
      </div>
      <div class="yt-wl-progress-bar-container">
        <div class="yt-wl-progress-bar" id="yt-wl-progress-bar"></div>
      </div>
      <div class="yt-wl-progress-details">
        <span>✓ Success: <strong id="yt-wl-success-count">0</strong></span>
        <span>✗ Failed: <strong id="yt-wl-fail-count">0</strong></span>
      </div>
    </div>
  `;
  return overlay;
}

// Update progress
function updateProgress(overlay, current, total, successCount, failCount, complete = false) {
  const progressBar = overlay.querySelector('#yt-wl-progress-bar');
  const progressCurrent = overlay.querySelector('#yt-wl-progress-current');
  const successCountEl = overlay.querySelector('#yt-wl-success-count');
  const failCountEl = overlay.querySelector('#yt-wl-fail-count');
  const title = overlay.querySelector('h3');
  
  const percentage = (current / total) * 100;
  progressBar.style.width = `${percentage}%`;
  progressCurrent.textContent = current;
  successCountEl.textContent = successCount;
  failCountEl.textContent = failCount;
  
  if (complete) {
    title.textContent = 'Deletion Complete!';
    progressBar.style.background = 'linear-gradient(90deg, #00c853, #00e676)';
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `yt-wl-notification yt-wl-notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Helper: sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle page navigation (YouTube SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (!isWatchLaterPage() && checkboxesVisible) {
      removeCheckboxes();
      checkboxesVisible = false;
    }
  }
}).observe(document, { subtree: true, childList: true });

// Handle dynamic content loading
let scrollTimeout;
window.addEventListener('scroll', () => {
  if (checkboxesVisible && isWatchLaterPage()) {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(addCheckboxes, 300);
  }
});