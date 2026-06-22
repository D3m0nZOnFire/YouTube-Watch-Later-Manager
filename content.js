// === MEMBERS-ONLY FILTER ===
const MEMBERS_STYLE_ID = 'yt-tools-members-filter';

function applyMembersFilter(enabled) {
  let el = document.getElementById(MEMBERS_STYLE_ID);
  if (enabled) {
    if (!el) {
      el = document.createElement('style');
      el.id = MEMBERS_STYLE_ID;
      el.textContent = 'ytd-rich-item-renderer:has(.ytContentMetadataViewModelMetadataRowMetadataRowWrap){display:none!important}';
      document.head.appendChild(el);
    }
  } else {
    el?.remove();
  }
}

chrome.storage.sync.get(['hideMembersOnly'], ({ hideMembersOnly }) => {
  applyMembersFilter(!!hideMembersOnly);
});

chrome.runtime.onMessage.addListener(({ type, enabled }) => {
  if (type === 'toggleMembersFilter') applyMembersFilter(enabled);
});

// === WATCH LATER CLEANUP ===
const tidyState = {
  mode: 'browse', // 'browse' | 'cleanup' | 'review' | 'deleting' | 'done'
  selected: new Set(),
  activeChips: new Set(), // 'watched' | 'partial' | 'new'
  deletionResults: [],
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const isWL = () => location.href.includes('/playlist?list=WL');

function getProgress(video) {
  const el = video.querySelector('ytd-thumbnail-overlay-resume-playback-renderer #progress');
  return el?.style.width ? parseFloat(el.style.width) || 0 : 0;
}

function getCategory(pct) {
  return pct >= 85 ? 'watched' : pct > 0 ? 'partial' : 'new';
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// === PROGRESS LABELS (always visible) ===
function syncProgressLabels() {
  document.querySelectorAll('ytd-playlist-video-renderer').forEach(v => {
    if (v.querySelector('.tidy-label')) return;
    const pct = getProgress(v);
    const cat = getCategory(pct);
    const label = document.createElement('div');
    label.className = `tidy-label tidy-label-${cat}`;
    label.textContent = cat === 'watched' ? 'Watched' : cat === 'partial' ? `${Math.round(pct)}%` : 'Not started';
    const meta = v.querySelector('#meta');
    if (meta) meta.appendChild(label);
  });
}

// === SIDEBAR BUTTON ===
function syncSidebarBtn() {
  const header = document.querySelector('ytd-playlist-header-renderer');
  if (!header) return;

  const wideForm = header.querySelector('.play-menu.wide-screen-form');
  const smallForm = header.querySelector('.play-menu.small-screen-form');
  const useSmall = smallForm && smallForm.offsetWidth > 0 && (!wideForm || wideForm.offsetWidth === 0);

  let targetParent, insertAfter;
  if (useSmall) {
    targetParent = header.querySelector('.immersive-header-content');
    insertAfter = smallForm;
  } else {
    targetParent = header.querySelector('.thumbnail-and-metadata-wrapper');
    insertAfter = null;
  }
  if (!targetParent) return;

  let btn = document.getElementById('tidy-sidebar-btn');
  if (btn && btn.parentElement !== targetParent) {
    btn.remove();
    btn = null;
  }
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'tidy-sidebar-btn';
    btn.addEventListener('click', () => tidyState.mode === 'browse' ? enterCleanup() : exitCleanup());
    if (insertAfter && insertAfter.nextSibling) {
      targetParent.insertBefore(btn, insertAfter.nextSibling);
    } else {
      targetParent.appendChild(btn);
    }
  }

  btn.textContent = tidyState.mode === 'browse' ? 'Clean up' : 'Exit';
  btn.className = `tidy-btn ${tidyState.mode === 'browse' ? 'tidy-btn-primary' : 'tidy-btn-ghost'}`;
}

// === TOOLBAR ===
function syncToolbar() {
  const list = document.querySelector('ytd-playlist-video-list-renderer');
  if (!list) return;

  let bar = document.getElementById('tidy-toolbar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'tidy-toolbar';
    bar.innerHTML = `
      <div class="tidy-chips">
        <button class="tidy-chip" data-g="watched">Watched <span id="tidy-n-watched">0</span></button>
        <button class="tidy-chip" data-g="partial">Partial <span id="tidy-n-partial">0</span></button>
        <button class="tidy-chip" data-g="new">Not started <span id="tidy-n-new">0</span></button>
      </div>
      <div class="tidy-bar-right">
        <span id="tidy-sel-label">0 selected</span>
        <button class="tidy-btn tidy-btn-ghost tidy-btn-sm" id="tidy-clear">Clear</button>
        <button class="tidy-btn tidy-btn-primary tidy-btn-sm" id="tidy-review" disabled>Review (0)</button>
      </div>
    `;
    bar.querySelectorAll('.tidy-chip').forEach(c => c.addEventListener('click', () => toggleChip(c.dataset.g)));
    bar.querySelector('#tidy-clear').addEventListener('click', clearSel);
    bar.querySelector('#tidy-review').addEventListener('click', showReview);
    list.insertBefore(bar, list.firstChild);
  }

  bar.style.display = tidyState.mode === 'cleanup' ? 'flex' : 'none';
  if (tidyState.mode === 'cleanup') refreshToolbar();
}

function refreshToolbar() {
  const videos = document.querySelectorAll('ytd-playlist-video-renderer');
  let w = 0, p = 0, n = 0;
  videos.forEach(v => {
    const c = getCategory(getProgress(v));
    if (c === 'watched') w++; else if (c === 'partial') p++; else n++;
  });

  const $ = id => document.getElementById(id);
  $('tidy-n-watched').textContent = w;
  $('tidy-n-partial').textContent = p;
  $('tidy-n-new').textContent = n;

  const sel = tidyState.selected.size;
  $('tidy-sel-label').textContent = `${sel} selected`;
  const rb = $('tidy-review');
  if (rb) { rb.textContent = `Review (${sel})`; rb.disabled = sel === 0; }
}

// === CHECKBOXES ===
function syncCheckboxes() {
  document.querySelectorAll('ytd-playlist-video-renderer').forEach((v, i) => {
    if (v.querySelector('.tidy-cb-wrap')) return;
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'tidy-checkbox';
    cb.checked = tidyState.selected.has(i);
    v.classList.toggle('tidy-selected', cb.checked);
    cb.addEventListener('click', e => e.stopPropagation());
    cb.addEventListener('change', () => {
      tidyState.selected[cb.checked ? 'add' : 'delete'](i);
      v.classList.toggle('tidy-selected', cb.checked);
      refreshToolbar();
    });
    const ic = v.querySelector('#index-container');
    if (!ic) return;
    ic.querySelector('#index')?.style.setProperty('display', 'none');
    ic.querySelector('#reorder')?.style.setProperty('display', 'none');
    if (!ic.__tidyStop) {
      ic.__tidyStop = e => e.stopPropagation();
      ic.addEventListener('click', ic.__tidyStop);
    }
    const wrap = document.createElement('div');
    wrap.className = 'tidy-cb-wrap';
    wrap.appendChild(cb);
    ic.appendChild(wrap);
  });
}

function removeCheckboxes() {
  document.querySelectorAll('ytd-playlist-video-renderer').forEach(v => {
    v.classList.remove('tidy-selected');
    const wrap = v.querySelector('.tidy-cb-wrap');
    if (!wrap) return;
    const ic = wrap.closest('#index-container');
    if (ic) {
      ic.querySelector('#index')?.style.removeProperty('display');
      ic.querySelector('#reorder')?.style.removeProperty('display');
      if (ic.__tidyStop) { ic.removeEventListener('click', ic.__tidyStop); delete ic.__tidyStop; }
    }
    wrap.remove();
  });
}

// === SELECTION ===
function toggleChip(group) {
  const adding = !tidyState.activeChips.has(group);
  if (adding) tidyState.activeChips.add(group); else tidyState.activeChips.delete(group);
  document.querySelectorAll('ytd-playlist-video-renderer').forEach((v, i) => {
    if (getCategory(getProgress(v)) === group) {
      const cb = v.querySelector('.tidy-checkbox');
      if (cb) cb.checked = adding;
      v.classList.toggle('tidy-selected', adding);
      tidyState.selected[adding ? 'add' : 'delete'](i);
    }
  });
  syncChipStyles();
  refreshToolbar();
}

function syncChipStyles() {
  document.querySelectorAll('.tidy-chip').forEach(chip => {
    chip.classList.toggle('tidy-chip-active', tidyState.activeChips.has(chip.dataset.g));
  });
}

function clearSel() {
  tidyState.selected.clear();
  tidyState.activeChips.clear();
  document.querySelectorAll('.tidy-checkbox').forEach(cb => (cb.checked = false));
  document.querySelectorAll('ytd-playlist-video-renderer.tidy-selected').forEach(v => v.classList.remove('tidy-selected'));
  syncChipStyles();
  refreshToolbar();
}

// === STATE TRANSITIONS ===
function enterCleanup() {
  tidyState.mode = 'cleanup';
  tidyState.selected.clear();
  tidyState.activeChips.clear();
  syncSidebarBtn();
  syncToolbar();
  syncCheckboxes();
}

function exitCleanup() {
  tidyState.mode = 'browse';
  tidyState.selected.clear();
  tidyState.activeChips.clear();
  removeCheckboxes();
  syncSidebarBtn();
  syncToolbar();
}

// === REVIEW ===
function getSelectedItems() {
  return Array.from(document.querySelectorAll('ytd-playlist-video-renderer'))
    .map((v, i) => ({ video: v, i, title: v.querySelector('#video-title')?.textContent.trim() || 'Unknown' }))
    .filter(({ i }) => tidyState.selected.has(i));
}

function showReview() {
  tidyState.mode = 'review';
  const items = getSelectedItems();
  const ov = document.createElement('div');
  ov.className = 'tidy-overlay';
  ov.innerHTML = `
    <div class="tidy-modal">
      <h3 class="tidy-modal-title">Review before deleting</h3>
      <div class="tidy-list">
        ${items.map(({ title }) => `<div class="tidy-list-item"><span class="tidy-dot">●</span><span>${esc(title)}</span></div>`).join('')}
      </div>
      <div class="tidy-modal-footer">
        <button class="tidy-btn tidy-btn-ghost" id="_rv-cancel">Cancel</button>
        <button class="tidy-btn tidy-btn-danger" id="_rv-confirm">Delete ${items.length} video${items.length !== 1 ? 's' : ''}</button>
      </div>
    </div>
  `;
  document.body.appendChild(ov);
  ov.querySelector('#_rv-cancel').addEventListener('click', () => { ov.remove(); tidyState.mode = 'cleanup'; });
  ov.querySelector('#_rv-confirm').addEventListener('click', () => { ov.remove(); startDeletion(items); });
}

// === DELETION ===
async function startDeletion(items) {
  tidyState.mode = 'deleting';
  tidyState.deletionResults = items.map(({ video, title }) => ({ video, title, status: 'pending' }));

  const ov = document.createElement('div');
  ov.className = 'tidy-overlay';
  ov.innerHTML = `
    <div class="tidy-modal">
      <h3 class="tidy-modal-title">Deleting…</h3>
      <div class="tidy-list" id="tidy-del-list">
        ${tidyState.deletionResults.map((r, i) => `
          <div class="tidy-list-item" id="tidy-dr-${i}">
            <span class="tidy-status-icon tidy-s-pending">⋯</span>
            <span>${esc(r.title)}</span>
          </div>`).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(ov);

  for (let i = 0; i < tidyState.deletionResults.length; i++) {
    const r = tidyState.deletionResults[i];
    const icon = ov.querySelector(`#tidy-dr-${i} .tidy-status-icon`);
    if (icon) { icon.textContent = '⟳'; icon.className = 'tidy-status-icon tidy-s-active'; }
    const ok = await deleteVideo(r.video);
    r.status = ok ? 'ok' : 'fail';
    if (icon) { icon.textContent = ok ? '✓' : '✗'; icon.className = `tidy-status-icon tidy-s-${ok ? 'ok' : 'fail'}`; }
  }

  await sleep(800);
  ov.remove();
  showDone();
}

async function deleteVideo(video) {
  const btn = video.querySelector('#menu button');
  if (!btn) return false;
  btn.click();
  await sleep(300);

  const items = document.querySelectorAll('tp-yt-paper-listbox#items > ytd-menu-service-item-renderer');
  const patterns = [
    'Remove from Watch later',
    'Supprimer de',
    'Aus "Später ansehen"',
    'Eliminar de',
    'Rimuovi da'
  ];

  let target = null;
  for (const item of items) {
    if (patterns.some(p => item.textContent.trim().startsWith(p))) { target = item; break; }
  }
  if (!target && items.length) target = items[0];
  if (!target) return false;

  target.click();
  await sleep(500);
  return true;
}

// === DONE ===
function showDone() {
  tidyState.mode = 'done';
  const ok = tidyState.deletionResults.filter(r => r.status === 'ok').length;
  const fail = tidyState.deletionResults.filter(r => r.status === 'fail').length;
  const remain = document.querySelectorAll('ytd-playlist-video-renderer').length;

  const ov = document.createElement('div');
  ov.className = 'tidy-overlay';
  ov.innerHTML = `
    <div class="tidy-modal tidy-modal-sm">
      <h3 class="tidy-modal-title tidy-center">Done</h3>
      <p class="tidy-done-stat">${ok} removed · ${remain} remain</p>
      ${fail ? `<p class="tidy-done-fail">${fail} couldn't be deleted</p>` : ''}
      <div class="tidy-modal-footer tidy-footer-center">
        ${fail ? `<button class="tidy-btn tidy-btn-ghost" id="_dn-retry">Retry failed</button>` : ''}
        <button class="tidy-btn tidy-btn-primary" id="_dn-done">Done</button>
      </div>
    </div>
  `;
  document.body.appendChild(ov);
  ov.querySelector('#_dn-done').addEventListener('click', () => { ov.remove(); exitCleanup(); });
  if (fail) {
    ov.querySelector('#_dn-retry').addEventListener('click', () => {
      ov.remove();
      startDeletion(tidyState.deletionResults.filter(r => r.status === 'fail').map(r => ({ video: r.video, title: r.title })));
    });
  }
}

// === SYNC ===
let _syncTimer;
function scheduleSync() {
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => {
    if (!isWL()) return;
    syncProgressLabels();
    syncSidebarBtn();
    syncToolbar();
    if (tidyState.mode === 'cleanup') syncCheckboxes();
  }, 400);
}

// === NAVIGATION (SPA) & SCROLL ===
let _lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== _lastUrl) {
    _lastUrl = url;
    if (!isWL()) {
      document.getElementById('tidy-toolbar')?.remove();
      document.getElementById('tidy-sidebar-btn')?.remove();
      document.querySelectorAll('.tidy-label, .tidy-checkbox').forEach(el => el.remove());
      tidyState.mode = 'browse';
      tidyState.selected.clear();
    }
  }
  if (isWL()) scheduleSync();
}).observe(document, { subtree: true, childList: true });

window.addEventListener('scroll', () => { if (isWL()) scheduleSync(); }, { passive: true });
window.addEventListener('resize', () => { if (isWL()) scheduleSync(); }, { passive: true });

if (isWL()) setTimeout(scheduleSync, 1500);
