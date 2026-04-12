// ============================================================
// pages/dashboard.js — Dashboard page renderer
// ============================================================

import { getTasks, completeTask, getSubjects, getScheduleBlocks, updateScheduleBlock, getNotes, createNote, updateNote, deleteNote } from "../db.js";
import { computeAnalytics } from "../analytics.js";
import { navigate } from "../app.js";
import { showSnackbar } from "../snackbar.js";
import { escHtml, formatDate, scheduleTask, perfLog, parseFbDate } from "../js/utils.js";
import { startFocusSession } from "../utils/focusEngine.js";

import { cacheManager } from "../utils/cacheManager.js";

let dashboardChart = null;
let dashboardInterval = null;
let isDashboardRendering = false;
let pendingDashboardTasks = new Set();

export function renderDashboard(container, uid, profile, initialData = null) {
  let currentProfile = profile;

  // ── Lifecycle Cleanup ──
  const cleanup = () => {
    pendingDashboardTasks.forEach(id => {
      if (typeof id === 'number') clearTimeout(id);
      else if (window.cancelIdleCallback) window.cancelIdleCallback(id);
    });
    pendingDashboardTasks.clear();

    if (dashboardChart) {
      dashboardChart.destroy();
      dashboardChart = null;
    }
    if (dashboardInterval) {
      clearInterval(dashboardInterval);
      dashboardInterval = null;
    }
    isDashboardRendering = false;
  };

  cleanup();



  // 1. Render FULL visible structure immediately (Sync)
  container.innerHTML = `
    <div class="premium-header">
      <div class="premium-greeting">${getGreeting()}</div>
      <h1 class="premium-name" id="dash-user-name">${currentProfile?.displayName || "Student"}</h1>
      <div class="premium-subtitle">${getSubtitle()}</div>
    </div>
    <div id="dash-content">
      <!-- BTech Banner (Fast) -->
      <div id="dash-btech-banner"></div>

      <!-- Stats Row (Deferred but structure is here) -->
      <div class="stats-row mb-lg" id="dash-stats">
         ${initialData ? '' : `
         <div class="stat-card skeleton" style="height:80px"></div>
         <div class="stat-card skeleton" style="height:80px"></div>
         <div class="stat-card skeleton" style="height:80px"></div>
         <div class="stat-card skeleton" style="height:80px"></div>
         `}
      </div>
      
      <!-- Focus Pipeline (New) -->
      <div id="dash-focus-pipeline" class="mb-lg"></div>

      <div id="dash-main-grid">


        <div id="dash-tasks-col">
          <!-- Tasks summary -->
          <div id="dash-tasks-section"></div>
        </div>

        <div id="dash-notes-col">
          <!-- Quick Notes -->
          <div id="dash-notes-section"></div>
        </div>

      </div>
    </div>
  `;



  // 2. Immediate Render if cache exists
  if (initialData) {
    console.log("[Dashboard] SWR: Rendering from cache");
    requestAnimationFrame(() => {
      if (currentProfile) renderBTechBanner(currentProfile);

      renderStatsHtml(initialData.analyticsData || {});
      if (initialData.scheduleBlocks) {
        renderFocusPipelineHtml(uid, initialData.scheduleBlocks, true);
      }
      if (initialData.pendingTasks) {
        renderPendingTasksHtml(initialData.pendingTasks, true);
      }

      // Load notes from their own dedicated cache key (avoids false empty state)
      const cachedNotes = cacheManager.get(`notes_${uid}`);
      if (cachedNotes) {
        renderNotesHtml(uid, cachedNotes, true);
      } else {
        // Show skeleton — real data will arrive from Firestore shortly
        renderNotesLoadingSkeleton();
      }
    });
  }

  // 3. Background Revalidation
  requestAnimationFrame(() => {
    if (!initialData && currentProfile) renderBTechBanner(currentProfile);
    updateDashboardState(uid, currentProfile, !initialData);
  });

  return {
    cleanup,
    update: (newProfile) => {
      currentProfile = newProfile;
      const nameEl = document.getElementById("dash-user-name");
      if (nameEl) nameEl.textContent = newProfile?.displayName || "Student";
      renderBTechBanner(newProfile);
    }
  };
}

function renderBTechBanner(profile) {
  const el = document.getElementById("dash-btech-banner");
  if (!el) return;
  const { btechStart, btechEnd, btechName } = profile || {};

  if (!btechStart || !btechEnd) {
    el.innerHTML = `
      <div class="btech-banner btech-banner-empty stagger-item" id="btn-add-focus-block">
        <div style="display:flex; align-items:center; gap:var(--space-lg); flex:1">
          <div class="btech-empty-icon"><i data-lucide="target"></i></div>
          <div style="flex:1">
            <div class="btech-degree-label" style="font-size:15px">Long Term Focus Block</div>
            <div class="btech-tagline" style="font-size:12px; margin-top:2px">Set your academic goals to stay on track.</div>
          </div>
        </div>
        <div class="btech-btn-circle-sm">
          <i data-lucide="plus"></i>
        </div>
      </div>
    `;
    el.querySelector("#btn-add-focus-block")?.addEventListener("click", () => navigate("settings"));
    if (window.lucide) window.lucide.createIcons({ nodes: el.querySelectorAll('[data-lucide]') });
    return;
  }

  const start = new Date(btechStart + "T00:00:00");
  const end = new Date(btechEnd + "T00:00:00");
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const totalDays = Math.round((end - start) / 86400000);
  const elapsed = Math.min(Math.max(Math.round((now - start) / 86400000), 0), totalDays);
  const remaining = totalDays - elapsed;
  const pct = Math.round((elapsed / totalDays) * 100);
  const monthsLeft = Math.round(remaining / 30.44);

  el.innerHTML = `
    <div class="btech-banner">
      <div class="btech-banner-top">
        <div>
          <div class="btech-degree-label">${escHtml(btechName || "Long Term Focus Block")}</div>
          <div class="btech-tagline">Progress is steady. Stay on track.</div>
        </div>
        <div class="btech-count-box">
          <div class="btech-count-num">${monthsLeft}</div>
          <div class="btech-count-label">months left</div>
        </div>
      </div>
      <div class="btech-progress-bar">
        <div class="btech-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="btech-progress-meta">
        <span>${elapsed} days down</span>
        <span>${pct}% complete</span>
        <span>${remaining} to go</span>
      </div>
    </div>
  `;
}

async function updateDashboardState(uid, profile, isFirstLoad = false) {
  // ── Guard against duplicate renders ──
  if (isDashboardRendering) return;
  isDashboardRendering = true;

  try {
    console.time("updateDashboardState");
    const startTime = performance.now();

    // ── Background Data Fetching ──

    const subjectsTask = getSubjects(uid);
    const pendingTasksTask = getTasks(uid, { isCompleted: false });
    const scheduleBlocksTask = getScheduleBlocks(uid, new Date().toLocaleDateString('en-CA'));

    // Notes fetched independently — isolated so a permission error doesn't crash the whole dashboard
    const notesTask = getNotes(uid).catch(err => {
      console.warn('[Dashboard] Notes fetch failed (check Firestore rules deployment):', err.message);
      return cacheManager.get(`notes_${uid}`) || []; // fall back to cache
    });

    const [topics, pendingTasks, scheduleBlocks, notes] = await Promise.all([subjectsTask, pendingTasksTask, scheduleBlocksTask, notesTask]);
    const analyticsData = await computeAnalytics(uid, profile?.weekStartDay || "monday", topics);



    // ── Sorting Pending Tasks ──
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const sortedPending = pendingTasks.sort((a, b) => {
      const aDue = parseFbDate(a.dueDate);
      const bDue = parseFbDate(b.dueDate);

      if (aDue) aDue.setHours(0, 0, 0, 0);
      if (bDue) bDue.setHours(0, 0, 0, 0);

      const aIsTodayOrPast = aDue && aDue <= now;
      const bIsTodayOrPast = bDue && bDue <= now;

      // 1. Today/Overdue tasks first
      if (aIsTodayOrPast && !bIsTodayOrPast) return -1;
      if (!aIsTodayOrPast && bIsTodayOrPast) return 1;

      // 2. Priority order (High > Medium > Low)
      const priorities = { high: 3, medium: 2, low: 1 };
      const aPrio = priorities[(a.priority || "medium").toLowerCase()] || 2;
      const bPrio = priorities[(b.priority || "medium").toLowerCase()] || 2;

      if (aPrio !== bPrio) return bPrio - aPrio;

      // 3. Tasks with dates before tasks without dates
      if (aDue && !bDue) return -1;
      if (!aDue && bDue) return 1;

      // 4. Then by due date (closest first)
      if (aDue && bDue) return aDue - bDue;

      return 0;
    });

    // ── Revision-based Change Detection (replaces JSON.stringify) ──
    const cacheKey = `dashboard_${uid}`;
    const previousRevision = cacheManager.getRevision(cacheKey);
    const newData = { analyticsData, pendingTasks: sortedPending, notes };

    // Always update on first load; otherwise check revision
    if (isFirstLoad || cacheManager.hasChanged(cacheKey, previousRevision) || !previousRevision) {
      console.log("[Dashboard] Data changed or first load, updating UI");

      // Update Stats
      renderStatsHtml(analyticsData, isFirstLoad);

      // Update Focus Pipeline
      renderFocusPipelineHtml(uid, scheduleBlocks, isFirstLoad);

      // Update Pending Tasks
      renderPendingTasksHtml(pendingTasks, isFirstLoad);

      // Save to Cache (increments revision)
      cacheManager.set(cacheKey, { ...newData, scheduleBlocks });
    } else {
      console.log("[Dashboard] Data unchanged, skipping UI update");
    }

    // Notes always re-render + stored in their own dedicated cache key
    cacheManager.set(`notes_${uid}`, notes);
    renderNotesHtml(uid, notes, isFirstLoad);

    perfLog("Dashboard Update Complete", startTime);
    isDashboardRendering = false;

  } catch (err) {
    console.error("Dashboard update error:", err);
    isDashboardRendering = false;
  }
}

/**
 * Render Pending Tasks section
 */
function renderPendingTasksHtml(tasks, isFirstLoad = false) {
  const tasksSection = document.getElementById("dash-tasks-section");
  if (!tasksSection) return;

  const pending = tasks.slice(0, 3);
  if (pending.length === 0) {
    tasksSection.innerHTML = `
      <div class="section-header mb-md mt-lg">
        <div class="section-title">Today's Tasks</div>
      </div>
      <div class="empty-state" style="padding:var(--space-lg);text-align:center;background:var(--bg-elevated);border-radius:var(--border-radius-lg);border:1px dashed var(--border)">
        <div style="color:var(--text-muted);font-size:13px"><i data-lucide="check-circle" style="width:24px;height:24px;margin-bottom:5px;opacity:0.5;display:block;margin:0 auto 12px"></i>Awesome! You're all caught up for today.</div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons({ nodes: tasksSection.querySelectorAll('[data-lucide]') });
    return;
  }

  const html = `
    <div class="section-header mb-md mt-lg">
      <div class="section-title">Today's Tasks</div>
      <button class="btn btn-sm btn-ghost ripple" id="dash-btn-see-all-tasks">See All</button>
    </div>
    <div class="tasks-grid">
      ${pending.map((task, index) => {
    const priority = (task.priority || "medium").toLowerCase();
    const due = parseFbDate(task.dueDate);

    return `
          <div class="task-card dash-pending-task-card priority-${priority} ${isFirstLoad ? 'stagger-item' : ''}" 
               style="animation-delay:${200 + (index * 40)}ms; cursor:pointer;"
               data-id="${task.id}">
            <div style="display: flex; justify-content: space-between; align-items: center; pointer-events: none;">
              <div>
                <div style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${escHtml(task.title)}</div>
                <div style="font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
                  <i data-lucide="calendar" style="width: 12px; height: 12px;"></i>
                  ${due ? due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date'}
                </div>
              </div>
              <div class="badge badge-${priority}" style="font-size: 9px; padding: 2px 6px;">${priority}</div>
            </div>
          </div>
        `;
  }).join("")}
    </div>
  `;

  tasksSection.innerHTML = html;

  // Add listeners
  tasksSection.querySelector("#dash-btn-see-all-tasks")?.addEventListener("click", () => navigate("tasks"));
  tasksSection.querySelectorAll(".task-card").forEach(el => {
    el.addEventListener("click", () => navigate("tasks"));
  });

  if (window.lucide) {
    window.lucide.createIcons({ nodes: tasksSection.querySelectorAll('[data-lucide]') });
  }
}

// ── NOTE COLORS ────────────────────────────────────────────────
const NOTE_COLORS = [
  { hex: '#5B8CFF', label: 'Blue' },
  { hex: '#22D3EE', label: 'Cyan' },
  { hex: '#22C55E', label: 'Green' },
  { hex: '#F59E0B', label: 'Amber' },
  { hex: '#EF4444', label: 'Red' },
  { hex: '#A78BFA', label: 'Violet' },
];

/**
 * Show skeleton placeholders in the notes section while loading from Firestore
 */
function renderNotesLoadingSkeleton() {
  const notesSection = document.getElementById('dash-notes-section');
  if (!notesSection) return;
  notesSection.innerHTML = `
    <div class="section-header mb-md">
      <h2 class="section-title">Quick Notes</h2>
    </div>
    <div class="notes-grid">
      <div class="skeleton" style="height:80px;border-radius:var(--border-radius-sm)"></div>
      <div class="skeleton" style="height:80px;border-radius:var(--border-radius-sm)"></div>
    </div>
  `;
}

/**
 * Render Quick Notes section
 */
function renderNotesHtml(uid, notes, isFirstLoad = false) {
  const notesSection = document.getElementById('dash-notes-section');
  if (!notesSection) return;

  const preview = notes.slice(0, 4);

  const emptyState = preview.length === 0 ? `
    <div class="note-empty-state" id="dash-note-empty-add">
      <i data-lucide="sticky-note" style="width:22px;height:22px;margin-bottom:8px;opacity:0.4"></i>
      <div style="font-size:13px;color:var(--text-muted)">Tap to jot a quick note</div>
    </div>
  ` : '';

  const noteCardsHtml = preview.map((note, idx) => `
    <div class="note-card ${isFirstLoad ? 'stagger-item' : ''}" 
         style="--note-color:${escHtml(note.color || '#5B8CFF')};animation-delay:${100 + idx * 40}ms"
         data-id="${note.id}">
      ${note.pinned ? `<div class="note-pin-badge"><i data-lucide="pin" style="width:11px;height:11px"></i></div>` : ''}
      <div class="note-card-title">${escHtml(note.title || 'Untitled')}</div>
      ${note.content ? `<div class="note-card-excerpt">${escHtml(note.content.slice(0, 80))}${note.content.length > 80 ? '…' : ''}</div>` : ''}
    </div>
  `).join('');

  notesSection.innerHTML = `
    <div class="section-header mb-md mt-lg">
      <div class="section-title">Quick Notes</div>
      <button class="btn btn-sm btn-ghost ripple" id="dash-btn-add-note">
        <i data-lucide="plus" style="width:14px;height:14px"></i> New
      </button>
    </div>
    <div class="notes-grid">
      ${noteCardsHtml}
      ${emptyState}
    </div>
    ${notes.length > 4 ? `<div style="text-align:center;margin-top:10px"><span style="font-size:12px;color:var(--text-muted)">${notes.length - 4} more note${notes.length - 4 > 1 ? 's' : ''}</span></div>` : ''}
  `;

  if (window.lucide) window.lucide.createIcons({ nodes: notesSection.querySelectorAll('[data-lucide]') });

  // Listeners
  notesSection.querySelector('#dash-btn-add-note')?.addEventListener('click', () => openNoteModal(uid, null, () => updateDashboardNotes(uid)));
  notesSection.querySelector('#dash-note-empty-add')?.addEventListener('click', () => openNoteModal(uid, null, () => updateDashboardNotes(uid)));
  notesSection.querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('click', () => {
      const noteId = card.dataset.id;
      const note = notes.find(n => n.id === noteId);
      if (note) openNoteModal(uid, note, () => updateDashboardNotes(uid));
    });
  });
}

/** Lightweight re-fetch + re-render of just the notes section */
async function updateDashboardNotes(uid) {
  try {
    const notes = await getNotes(uid);
    // Keep dedicated notes cache in sync — this is what prevents the empty flash on next reload
    cacheManager.set(`notes_${uid}`, notes);
    renderNotesHtml(uid, notes, false);
  } catch (err) {
    console.error('[Dashboard] Notes refresh failed', err);
  }
}

/**
 * Open a create/edit modal for a note
 * @param {string} uid
 * @param {object|null} existingNote — null for create
 * @param {function} onSave — callback after save/delete
 */
function openNoteModal(uid, existingNote, onSave) {
  // Prevent duplicate modals
  if (document.querySelector('.note-modal-backdrop')) return;

  const isEdit = !!existingNote;
  const currentColor = existingNote?.color || '#5B8CFF';
  const currentPinned = existingNote?.pinned || false;

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop note-modal-backdrop';

  backdrop.innerHTML = `
    <div class="note-modal" role="dialog" aria-modal="true" aria-label="${isEdit ? 'Edit' : 'New'} Note">
      <div class="note-modal-header">
        <div class="note-modal-title">
          <i data-lucide="sticky-note" style="width:18px;height:18px;color:var(--primary)"></i>
          ${isEdit ? 'Edit Note' : 'New Note'}
        </div>
        <button class="note-modal-close" id="note-modal-close" aria-label="Close">
          <i data-lucide="x" style="width:18px;height:18px"></i>
        </button>
      </div>

      <div class="note-modal-body">
        <input 
          class="note-modal-input" 
          id="note-modal-title" 
          placeholder="Title (optional)"
          maxlength="100"
          value="${escHtml(existingNote?.title || '')}"
        />
        <textarea 
          class="note-modal-textarea" 
          id="note-modal-content" 
          placeholder="Start writing…"
          maxlength="2000"
          rows="6"
        >${escHtml(existingNote?.content || '')}</textarea>

        <div class="note-modal-meta">
          <div class="note-color-row">
            <span class="note-meta-label">Color</span>
            <div class="note-color-swatches" id="note-color-swatches">
              ${NOTE_COLORS.map(c => `
                <button 
                  class="note-color-swatch ${c.hex === currentColor ? 'active' : ''}" 
                  style="--swatch:${c.hex}" 
                  data-color="${c.hex}" 
                  title="${c.label}"
                  aria-label="${c.label}"
                ></button>
              `).join('')}
            </div>
          </div>

          <label class="note-pin-toggle">
            <input type="checkbox" id="note-modal-pinned" ${currentPinned ? 'checked' : ''} />
            <i data-lucide="pin" style="width:14px;height:14px"></i>
            Pin to top
          </label>
        </div>
      </div>

      <div class="note-modal-footer">
        ${isEdit ? `<button class="note-btn-delete ripple" id="note-modal-delete"><i data-lucide="trash-2" style="width:14px;height:14px"></i> Delete</button>` : '<div></div>'}
        <div class="note-modal-actions">
          <button class="btn btn-ghost ripple" id="note-modal-cancel" style="padding:9px 18px;font-size:13px">Cancel</button>
          <button class="btn btn-primary ripple" id="note-modal-save" style="padding:9px 20px;font-size:13px">${isEdit ? 'Save changes' : 'Create note'}</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  if (window.lucide) window.lucide.createIcons({ nodes: backdrop.querySelectorAll('[data-lucide]') });

  // Focus title
  const titleInput = backdrop.querySelector('#note-modal-title');
  const contentInput = backdrop.querySelector('#note-modal-content');
  setTimeout(() => (existingNote?.title ? contentInput.focus() : titleInput.focus()), 80);

  // Color swatch selection
  let selectedColor = currentColor;
  backdrop.querySelector('#note-color-swatches').addEventListener('click', (e) => {
    const btn = e.target.closest('.note-color-swatch');
    if (!btn) return;
    selectedColor = btn.dataset.color;
    backdrop.querySelectorAll('.note-color-swatch').forEach(s => s.classList.toggle('active', s === btn));
  });

  const closeModal = () => backdrop.remove();

  // Close on backdrop click
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
  backdrop.querySelector('#note-modal-close').addEventListener('click', closeModal);
  backdrop.querySelector('#note-modal-cancel').addEventListener('click', closeModal);

  // Delete
  backdrop.querySelector('#note-modal-delete')?.addEventListener('click', async () => {
    const btn = backdrop.querySelector('#note-modal-delete');
    btn.disabled = true;
    btn.innerHTML = '<i class="spinner-sm"></i>';
    try {
      await deleteNote(existingNote.id);
      closeModal();
      onSave?.();
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="trash-2" style="width:14px;height:14px"></i> Delete';
      if (window.lucide) window.lucide.createIcons({ nodes: btn.querySelectorAll('[data-lucide]') });
    }
  });

  // Save
  backdrop.querySelector('#note-modal-save').addEventListener('click', async () => {
    const saveBtn = backdrop.querySelector('#note-modal-save');
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const pinned = backdrop.querySelector('#note-modal-pinned').checked;

    if (!title && !content) {
      contentInput.focus();
      contentInput.style.borderColor = 'var(--danger)';
      setTimeout(() => contentInput.style.borderColor = '', 1200);
      return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="spinner-sm"></i>';

    try {
      if (isEdit) {
        await updateNote(existingNote.id, { title, content, color: selectedColor, pinned });
      } else {
        await createNote(uid, { title, content, color: selectedColor, pinned });
      }
      closeModal();
      onSave?.();
    } catch (err) {
      saveBtn.disabled = false;
      saveBtn.textContent = isEdit ? 'Save' : 'Create';
    }
  });

  // ESC key
  const escHandler = (e) => { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);
}


function renderFocusPipelineHtml(uid, blocks, isFirstLoad = false) {
  const pipelineEl = document.getElementById("dash-focus-pipeline");
  if (!pipelineEl) return;

  // Filter: Not completed + (Active OR Starting soon/Current)
  const now = new Date();
  const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const relevant = blocks
    .filter(b => b.status !== 'completed')
    .sort((a,b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 3);

  if (relevant.length === 0) {
    pipelineEl.innerHTML = `
      <div class="pipeline-empty">
        <i data-lucide="calendar" style="width:20px;height:20px;margin-bottom:8px"></i>
        <div>No execution blocks scheduled for today</div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons({ nodes: pipelineEl.querySelectorAll('[data-lucide]') });
    return;
  }

  pipelineEl.innerHTML = `
    <div class="section-header mb-md">
      <div class="section-title">Focus Pipeline</div>
      <button class="btn btn-sm btn-ghost ripple" id="dash-btn-see-schedule">Schedule</button>
    </div>
    <div class="focus-pipeline-grid">
      ${relevant.map((block, idx) => {
        const isActive = block.status === 'active' || (nowStr >= block.startTime && nowStr < block.endTime);
        return `
          <div class="focus-pipeline-card ${isActive ? 'active' : ''} ${isFirstLoad ? 'stagger-item' : ''}" 
               style="animation-delay:${100 + (idx * 50)}ms" 
               data-id="${block.id}">
            <div class="pipeline-card-time">${block.startTime} — ${block.endTime}</div>
            <div class="pipeline-card-title">${escHtml(block.title)}</div>
            ${isActive 
              ? `<button class="btn-pipeline-start ripple" data-id="${block.id}">
                   <i data-lucide="zap" style="width:14px;height:14px"></i> Start Focus
                 </button>`
              : `<div style="font-size:11px;color:var(--text-muted);font-weight:700">UPCOMING</div>`
            }
          </div>
        `;
      }).join("")}
    </div>
  `;

  // Listeners
  pipelineEl.querySelector("#dash-btn-see-schedule")?.addEventListener("click", () => navigate("schedule"));
  pipelineEl.querySelectorAll(".btn-pipeline-start").forEach(btn => {
    btn.addEventListener("click", async () => {
      const blockId = btn.dataset.id;
      const block = relevant.find(b => b.id === blockId);
      if (!block) return;
      
      const [sh, sm] = block.startTime.split(":").map(Number);
      const [eh, em] = block.endTime.split(":").map(Number);
      const durationMs = (eh*60 + em - (sh*60 + sm)) * 60000;

      btn.disabled = true;
      btn.innerHTML = `<i class="spinner-sm"></i>`;
      
      try {
        await updateScheduleBlock(blockId, { status: "active" });
        startFocusSession(uid, block, durationMs);
        // Refresh dashboard (optional, or just rely on global event)
        updateDashboardState(uid, null, false);
      } catch (err) {
        showSnackbar("Failed to start session", "error");
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="zap" style="width:14px;height:14px"></i> Start Focus`;
      }
    });
  });

  if (window.lucide) {
    window.lucide.createIcons({ nodes: pipelineEl.querySelectorAll('[data-lucide]') });
  }
}



/**
 * Render Stats HTML from data
 */
function renderStatsHtml(analyticsData, isFirstLoad = false) {
  const statsEl = document.getElementById("dash-stats");
  if (!statsEl) return;

  const html = `
    <div class="stat-card ${isFirstLoad ? 'stagger-item' : ''}" style="animation-delay:0ms">
      <div class="stat-number">${analyticsData.completed || 0}</div>
      <div class="stat-label">Done</div>
    </div>
    <div class="stat-card ${isFirstLoad ? 'stagger-item' : ''}" style="animation-delay:40ms">
      <div class="stat-number">${analyticsData.completionRate || 0}%</div>
      <div class="stat-label">Rate</div>
    </div>
    <div class="stat-card ${isFirstLoad ? 'stagger-item' : ''}" style="animation-delay:80ms">
      <div class="stat-number">${analyticsData.streak || 0}</div>
      <div class="stat-label">Streak <i data-lucide="flame" style="width:14px;height:14px;display:inline-block;vertical-align:middle;color:var(--warning)"></i></div>
    </div>
    <div class="stat-card ${isFirstLoad ? 'stagger-item' : ''}" style="animation-delay:120ms">
      <div class="stat-number" style="${analyticsData.overdue > 0 ? 'color:var(--error)' : ''}">${analyticsData.overdue || 0}</div>
      <div class="stat-label">Overdue</div>
    </div>
  `;
  requestAnimationFrame(() => {
    statsEl.innerHTML = html;
    if (window.lucide) {
      window.lucide.createIcons({ nodes: statsEl.querySelectorAll('[data-lucide]') });
    }
  });
}



window._navTopic = (id, name) => navigate("subtopics", { topicId: id, topicName: name });

// ── Build task card DOM element ───────────────────────────────
export function buildTaskCard(task, uid, onUpdate) {
  const card = document.createElement("div");
  const isDone = task.isCompleted;
  const priority = task.priority || "medium";
  const due = parseFbDate(task.dueDate);
  const isOverdue = due && due < new Date() && !isDone;

  card.className = `task-card priority-${priority}${isDone ? " completed" : ""}`;
  // Use explicit button controls for deletion and completion
  card.innerHTML = `
    <div class="task-top-section">
      <div class="priority-label ${priority.toLowerCase()}">${priority}</div>
    </div>
    <div class="task-main-section">
      <div class="task-title">${escHtml(task.title)}</div>
      <div class="task-meta">
        ${due ? `<span class="task-due${isOverdue ? " overdue" : ""}" style="display:inline-flex;align-items:center;gap:6px"><i data-lucide="calendar" style="width:14px;height:14px"></i> ${formatDate(due)}</span>` : `<span class="task-due" style="display:inline-flex;align-items:center;gap:6px"><i data-lucide="calendar-off" style="width:14px;height:14px"></i> No date</span>`}
      </div>
    </div>
  `;

  card.addEventListener("click", () => {
    navigate("tasks");
  });

  return card;
}

// ── Shared Chart options ──────────────────────────────────────
export function chartBaseOptions(title = "") {
  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "var(--bg-elevated)",
        titleColor: "var(--text-primary)",
        bodyColor: "var(--text-secondary)",
        borderColor: "var(--border)",
        borderWidth: 1,
      },
    },
    scales: {
      x: { grid: { color: "var(--border-subtle)" }, ticks: { color: "var(--text-muted)" } },
      y: { grid: { color: "var(--border-subtle)" }, ticks: { color: "var(--text-muted)", stepSize: 1 }, beginAtZero: true },
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning,";
  if (h >= 12 && h < 17) return "Good afternoon,";
  if (h >= 17 && h < 22) return "Good evening,";
  return "Still working late?";
}

function getSubtitle() {
  const subtitles = [
    "Let’s make today productive.",
    "Stay consistent. You’re improving.",
    "One step closer today."
  ];
  return subtitles[Math.floor(Math.random() * subtitles.length)];
}

// escHtml and formatDate are now in js/utils.js
