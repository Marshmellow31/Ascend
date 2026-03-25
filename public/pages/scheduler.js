// ============================================================
// pages/scheduler.js — AI Task Scheduler
// ============================================================

import {
  getSchedulerTasks,
  createSchedulerTask,
  deleteSchedulerTask,
  getWeeklySchedule,
  saveWeeklySchedule,
  getGeneratedPlan,
  saveGeneratedPlan
} from "../db.js";
import { generateStudyPlan } from "../utils/taskScheduler.js";
import { showSnackbar } from "../snackbar.js";
import { escHtml } from "../js/utils.js";

let tasks = [];
let weeklySchedule = null;
let generatedPlan = null;
let unscheduled = [];

export async function renderSchedulerTab(container, uid, profile) {
  try {
    // Load initial data
    await reloadTasks(uid);
    weeklySchedule = await getWeeklySchedule(uid);
    const savedPlan = await getGeneratedPlan(uid);
    if (savedPlan) {
      generatedPlan = savedPlan.planByDay;
      unscheduled = savedPlan.unscheduledTasks;
      
      // We need to wait for the DOM render below before we can set datasets on the child.
      // Or we can just set them on the tab container and make renderPlanView smarter.
      // Let's set them on the tab container and update renderPlanView.
      container.dataset.orderedLabels = JSON.stringify(savedPlan.orderedLabels || []);
      const date = savedPlan.updatedAt ? (savedPlan.updatedAt.toDate ? savedPlan.updatedAt.toDate() : new Date(savedPlan.updatedAt)) : null;
      container.dataset.generatedAt = date ? date.toLocaleString() : "";
    }
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes("permission")) {
      container.innerHTML = `
        <div class="page-header">
          <h1 class="page-title">Smart Scheduler</h1>
        </div>
        <div class="card mb-xl" style="border-color:var(--error); background:rgba(153,51,51,0.05);">
          <h3 style="color:#F87171; margin-bottom:12px;"><i data-lucide="shield-alert" style="width:20px;height:20px;display:inline-block;vertical-align:middle;"></i> Database Permissions Missing</h3>
          <p style="color:var(--text-secondary); margin-bottom:12px; font-size:14px;">Your Firebase database doesn't have permission to use the new Scheduler features yet.</p>
          <p style="color:var(--text-secondary); font-size:14px;">Please deploy the updated <code>firestore.rules</code> file by running this in your terminal:</p>
          <pre style="background:var(--bg-tertiary); padding:12px; border-radius:8px; margin-top:12px; color:var(--text-primary); font-size:13px; font-family:monospace; overflow-x:auto;">npm run deploy:rules</pre>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }
    throw err;
  }

  container.innerHTML = `
    <style>
      @keyframes slowSpin { 100% { transform: rotate(360deg); } }
      .icon-spin { animation: slowSpin 2s linear infinite; }
    </style>
    <div class="page-header">
      <h1 class="page-title">Smart Scheduler</h1>
      <button class="btn btn-sm btn-primary" id="btn-add-sched-task">
        <i data-lucide="plus" style="width:16px;height:16px;"></i> Add Task
      </button>
    </div>

    <div class="card mb-xl">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-md);">
        <h3 style="color:var(--text-primary); margin:0;">Pending Tasks</h3>
      </div>
      <div id="scheduler-task-list"></div>
      
      <div style="margin-top:var(--space-lg); display:flex; flex-direction:column; gap:12px;">
        <button class="btn btn-secondary ripple" id="btn-manage-blocks" style="width:100%;">
          <i data-lucide="clock" style="width:16px;height:16px;margin-right:6px;"></i> Edit Schedule
        </button>
        <button class="btn btn-primary ripple" id="btn-generate-plan" style="width:100%;">
          <i data-lucide="sparkles" style="width:16px;height:16px;margin-right:6px;"></i> Generate Plan
        </button>
      </div>
    </div>

    <!-- Generated Plan View -->
    <div id="generated-plan-container"></div>
  `;

  // Init list
  renderTaskList(uid);
  renderPlanView();

  // Bind Generate Plan
  const genBtn = container.querySelector("#btn-generate-plan");
  if (genBtn) {
    genBtn.addEventListener("click", async () => {
      genBtn.innerHTML = `<i data-lucide="loader-2" class="icon-spin"></i> Generating...`;
      
      try {
        const { allTasks } = await getUnifiedTasks(uid);
        tasks = allTasks;
        weeklySchedule = await getWeeklySchedule(uid);
        
        if (tasks.length === 0) {
          showSnackbar("No pending tasks to schedule.", "info");
          genBtn.innerHTML = `<i data-lucide="sparkles" style="width:16px;height:16px;margin-right:6px;"></i> Generate Plan`;
          if (window.lucide) window.lucide.createIcons();
          return;
        }

        const { planByDay, unscheduledTasks, orderedLabels } = generateStudyPlan(tasks, weeklySchedule);
        generatedPlan = planByDay;
        unscheduled = unscheduledTasks;

        // Set on the Page container so renderPlanView can find it
        container.dataset.orderedLabels = JSON.stringify(orderedLabels);
        container.dataset.generatedAt = new Date().toLocaleString();

        // Save plan
        await saveGeneratedPlan(uid, { 
          planByDay: generatedPlan, 
          unscheduledTasks: unscheduled,
          orderedLabels: orderedLabels
        });
        
        showSnackbar("Study Plan Generated successfully!", "success");
        renderPlanView();
      } catch (err) {
        console.error(err);
        showSnackbar("Error generating plan.", "error");
      } finally {
        genBtn.innerHTML = `<i data-lucide="sparkles" style="width:16px;height:16px;margin-right:6px;"></i> Generate Plan`;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // Bind Manage Blocks
  container.querySelector("#btn-manage-blocks").addEventListener("click", () => {
    openWeeklyTimetableModal(uid, weeklySchedule, async (newSched) => {
      weeklySchedule = newSched;
    });
  });

  // Bind Add Task
  container.querySelector("#btn-add-sched-task").addEventListener("click", () => {
    openAddTaskModal(uid, () => {
      // callback on task added
      reloadTasks(uid);
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

async function getUnifiedTasks(uid) {
  const { getTasks } = await import("../db.js");
  const [schedTasks, mainTasks] = await Promise.all([
    getSchedulerTasks(uid),
    getTasks(uid, { isCompleted: false })
  ]);

  const formattedMain = mainTasks
    .filter(mt => mt.isScheduled && !schedTasks.some(st => st.sourceGoalTaskId === mt.sourceGoalTaskId && mt.sourceGoalTaskId))
    .map(mt => ({
      id: mt.id,
      title: mt.title,
      estimatedTime: mt.estimatedTime || 30,
      priority: mt.priority || "Medium",
      deadline: mt.dueDate ? (mt.dueDate.toDate ? mt.dueDate.toDate().toISOString().split("T")[0] : mt.dueDate) : null,
      isMainTask: true
    }));

  return { allTasks: [...schedTasks, ...formattedMain] };
}

async function reloadTasks(uid) {
  try {
    const { allTasks } = await getUnifiedTasks(uid);
    tasks = allTasks;
    renderTaskList(uid);
  } catch (err) {
    console.error("Failed to reload tasks:", err);
    showSnackbar("Error refreshing task list", "error");
  }
}

function renderTaskList(uid) {
  const listEl = document.getElementById("scheduler-task-list");
  if (!listEl) return;

  if (tasks.length === 0) {
    listEl.innerHTML = `
      <div style="color:var(--text-muted); font-size:13px; font-style:italic; padding:12px 0;">
        No tasks added yet. Add tasks above to include them in your dynamic study plan.
      </div>`;
    return;
  }

  listEl.innerHTML = tasks.map(t => `
    <div class="task-card" style="position:relative; background:var(--bg-tertiary); border:1px solid var(--border); padding:14px 16px; margin-bottom:10px; border-radius:12px; display:flex; flex-direction:row; justify-content:space-between; align-items:center; transition:all 0.2s;">
      <div style="position:absolute; left:-1px; top:-1px; bottom:-1px; width:4px; background:var(--priority-${(t.priority || 'medium').toLowerCase()}); border-top-left-radius:12px; border-bottom-left-radius:12px;"></div>
      
      <div style="margin-left:6px; display:flex; flex-direction:column; gap:4px; flex:1; text-align:left;">
        <div style="font-weight:600; color:var(--text-primary); font-size:15px; display:flex; align-items:center; gap:8px;">
          ${escHtml(t.title)} 
          <span class="priority-label ${(t.priority || 'medium').toLowerCase()}" style="font-size:10px; padding:2px 6px;">${t.priority || 'Medium'}</span>
          ${t.isMainTask ? `<span style="font-size:9px; background:rgba(var(--accent-rgb),0.1); color:var(--accent); padding:1px 5px; border-radius:4px; border:1px solid rgba(var(--accent-rgb),0.2);">Task List</span>` : ''}
          ${t.autoGenerated ? `<span style="font-size:9px; background:rgba(52,211,153,0.1); color:#34D399; padding:1px 5px; border-radius:4px; border:1px solid rgba(52,211,153,0.2);">Goal</span>` : ''}
        </div>
        <div style="font-size:12px; color:var(--text-muted); display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:6px;">
            <i data-lucide="clock" style="width:12px;height:12px;"></i>
            <input type="number" class="sched-task-time-edit" data-id="${t.id}" data-ismaintask="${!!t.isMainTask}" value="${t.estimatedTime}" style="width:45px; background:rgba(255,255,255,0.05); border:1px solid var(--border); border-radius:4px; color:#fff; font-size:11px; padding:2px 4px;" />
            <span>mins</span>
          </div>
          ${t.deadline ? `<span style="display:flex; align-items:center; gap:4px;"><i data-lucide="calendar" style="width:12px;height:12px;"></i> Due: ${t.deadline}</span>` : ''}
        </div>
      </div>
      
      <button class="btn btn-sm btn-ghost btn-del-sched-task" data-id="${t.id}" data-ismaintask="${!!t.isMainTask}" style="padding:6px; margin-left:12px; color:var(--text-muted); border:1px solid transparent; flex-shrink:0;" onmouseover="this.style.color='var(--error)'; this.style.background='var(--bg-card)'" onmouseout="this.style.color='var(--text-muted)'; this.style.background='transparent'">
        <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
      </button>
    </div>
  `).join("");

  // Bind duration changes
  listEl.querySelectorAll(".sched-task-time-edit").forEach(input => {
    input.addEventListener("change", async () => {
      const val = parseInt(input.value, 10);
      const id = input.dataset.id;
      const isMain = input.dataset.ismaintask === "true";
      if (isNaN(val) || val < 1) return;

      try {
        const { updateSchedulerTask, updateTask } = await import("../db.js");
        if (isMain) {
          await updateTask(id, { estimatedTime: val });
        } else {
          await updateSchedulerTask(id, { estimatedTime: val });
        }
        showSnackbar("Time updated", "success");
        // Update local state without full reload
        const t = tasks.find(x => x.id === id);
        if (t) t.estimatedTime = val;
      } catch (err) {
        showSnackbar("Failed to update time", "error");
      }
    });
  });

  // Bind deletes
  listEl.querySelectorAll(".btn-del-sched-task").forEach(btn => {
    btn.addEventListener("click", async () => {
      const isMain = btn.dataset.ismaintask === "true";
      const id = btn.dataset.id;
      if (isMain) {
        if (!confirm("Remove this task from the Scheduler? (It will still exist in your All Tasks list)")) return;
        const { updateTask } = await import("../db.js");
        await updateTask(id, { isScheduled: false });
      } else {
        if (!confirm("Remove this target study task?")) return;
        await deleteSchedulerTask(id);
      }
      showSnackbar("Task removed", "success");
      reloadTasks(uid);
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

function renderPlanView() {
  // Use the main tab container to find datasets
  const tabContainer = document.getElementById("main-content");
  const container = document.getElementById("generated-plan-container");
  if (!container || !tabContainer) return;

  if (!generatedPlan) {
    container.innerHTML = "";
    return;
  }

  const generatedAt = tabContainer.dataset.generatedAt;
  const orderedLabelsRaw = tabContainer.dataset.orderedLabels;

  let html = `
    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:var(--space-2xl); margin-bottom:var(--space-md);">
      <h2 class="page-title" style="margin:0; font-size:18px;">Your Generated Plan</h2>
      ${generatedAt ? `<div style="font-size:11px; color:var(--text-muted);">Updated: ${generatedAt}</div>` : ""}
    </div>
  `;

  // Show Unscheduled if any
  if (unscheduled && unscheduled.length > 0) {
    html += `
      <div class="card mb-md" style="border-color:var(--error); background:rgba(255,80,80,0.05);">
        <h4 style="color:#ff8888; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
          <i data-lucide="alert-triangle" style="width:16px;height:16px;"></i> Unscheduled Tasks
        </h4>
        <div style="font-size:13px; color:var(--text-secondary); margin-bottom:12px;">These could not fit into your available study blocks. Consider freeing up more time or extending deadlines.</div>
        ${unscheduled.map(t => `
          <div style="padding:8px 12px; background:var(--bg-card); border:1px solid var(--border); border-radius:12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:600; color:var(--text-primary); font-size:14px;">${escHtml(t.title)}</div>
            <div style="font-size:12px; color:var(--error); font-weight:600;">Missed ${t.remainingTimeUnscheduled}m</div>
          </div>
        `).join("")}
      </div>
    `;
  }

  // Show Days
  let orderedLabels = [];
  try {
    orderedLabels = JSON.parse(tabContainer.dataset.orderedLabels || "[]");
  } catch(e) {}
  
  if (orderedLabels.length > 0 && !orderedLabels.includes("Today")) {
     html += `<div style="font-size:12px; color:var(--text-muted); padding:8px 12px; background:rgba(255,255,255,0.03); border-radius:8px; margin-bottom:16px;">
        <i data-lucide="info" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> No remaining study blocks for today. Plan starts from the next available time.
     </div>`;
  }

  if (orderedLabels.length === 0) {
    orderedLabels = Object.keys(generatedPlan).sort((a,b) => {
      if (a === "Today") return -1;
      if (b === "Today") return 1;
      if (a === "Tomorrow") return -1;
      if (b === "Tomorrow") return 1;
      return 0;
    });
  }

  orderedLabels.forEach(label => {
    const dayPlan = generatedPlan[label];
    if (dayPlan && dayPlan.length > 0) {
      html += `
        <div class="card mb-md">
          <h4 style="color:var(--text-primary); margin-bottom:12px; border-bottom:1px solid var(--border); padding-bottom:8px; display:flex; align-items:center; gap:8px;">
            <i data-lucide="${label === 'Today' ? 'zap' : 'calendar-days'}" style="width:16px;height:16px;color:var(--accent);"></i> ${label}
          </h4>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${dayPlan.map(block => `
              <div style="display:flex; flex-direction:column; background:var(--bg-card); border:1px solid var(--border-subtle); border-left:3px solid var(--priority-${(block.priority || 'medium').toLowerCase()}); padding:12px; border-radius:12px;">
                <div style="font-weight:600; color:var(--text-primary); font-size:14px;">${escHtml(block.taskTitle)}</div>
                <div style="font-size:12px; color:var(--text-muted); margin-top:4px; display:flex; gap:12px; align-items:center;">
                  <span style="display:flex; align-items:center; gap:4px;"><i data-lucide="clock" style="width:12px;height:12px;"></i> ${block.startTime} - ${block.endTime} (${block.timeSpent}m)</span>
                  <span style="display:flex; align-items:center; gap:4px;"><i data-lucide="map-pin" style="width:12px;height:12px;"></i> ${escHtml(block.blockTitle)}</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }
  });

  const hasAnyScheduled = Object.values(generatedPlan).some(arr => arr.length > 0);
  if (!hasAnyScheduled && unscheduled && unscheduled.length === 0) {
    html += `<div style="text-align:center; color:var(--text-muted); padding:32px;">Schedule is completely empty.</div>`;
  } else if (!hasAnyScheduled && unscheduled && unscheduled.length > 0) {
    html += `<div style="text-align:center; color:var(--text-muted); padding:16px; border:1px dashed var(--border); border-radius:12px;">No tasks could be scheduled into your available Study blocks. Please edit your Schedule tab to add Study time.</div>`;
  }

  container.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();
}

function openAddTaskModal(uid, onTaskAdded) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop centered";

  // Default deadline to today + 7 days
  const tempDate = new Date();
  tempDate.setDate(tempDate.getDate() + 7);
  const futureDateStr = tempDate.toISOString().split("T")[0];

  backdrop.innerHTML = `
    <div class="modal-box" style="max-width:400px">
      <h3 class="modal-title">Add Scheduler Task</h3>
      
      <div class="form-group">
        <label class="form-label">Task Title</label>
        <input type="text" id="ai-task-title" class="form-input" placeholder="E.g., Read Chapter 4" required />
      </div>

      <div style="display:flex; gap:var(--space-md);">
        <div class="form-group" style="flex:1;">
          <label class="form-label">Est. Time (mins)</label>
          <input type="number" id="ai-task-mins" class="form-input" value="60" min="15" step="15" required />
        </div>
        <div class="form-group" style="flex:1;">
          <label class="form-label">Priority</label>
          <select id="ai-task-priority" class="form-select">
            <option value="Low">Low</option>
            <option value="Medium" selected>Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Deadline (Optional)</label>
        <input type="date" id="ai-task-deadline" class="form-input" value="${futureDateStr}" />
      </div>

      <div class="modal-actions">
        <button class="btn btn-secondary" id="ai-task-cancel">Cancel</button>
        <button class="btn btn-primary" id="ai-task-save">Add</button>
      </div>
    </div>
  `;

  backdrop.querySelector("#ai-task-cancel").addEventListener("click", () => backdrop.remove());

  backdrop.querySelector("#ai-task-save").addEventListener("click", async () => {
    const btn = backdrop.querySelector("#ai-task-save");
    btn.disabled = true;
    btn.textContent = "Saving...";

    const title = backdrop.querySelector("#ai-task-title").value.trim();
    const estimatedTime = parseInt(backdrop.querySelector("#ai-task-mins").value, 10);
    const priority = backdrop.querySelector("#ai-task-priority").value;
    const deadline = backdrop.querySelector("#ai-task-deadline").value;

    if (!title || !estimatedTime) {
      showSnackbar("Title and estimated time are required.", "error");
      btn.disabled = false;
      btn.textContent = "Add";
      return;
    }

    try {
      await createSchedulerTask(uid, {
        title,
        estimatedTime,
        priority,
        deadline
      });
      showSnackbar("Task added successfully", "success");
      backdrop.remove();
      if (onTaskAdded) onTaskAdded();
    } catch (err) {
      showSnackbar("Error adding task", "error");
      console.error(err);
      btn.disabled = false;
      btn.textContent = "Add";
    }
  });

  document.body.appendChild(backdrop);
  setTimeout(() => backdrop.querySelector("#ai-task-title").focus(), 100);
}

// ── Merged Timetable Editor ──────────────────────────────────────
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORTS = ["M", "T", "W", "T", "F", "S", "S"];

function openWeeklyTimetableModal(uid, currentSchedule, onUpdate) {
  let localSchedule = JSON.parse(JSON.stringify(currentSchedule || {}));
  let selectedDay = "Monday";

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop centered";

  backdrop.innerHTML = `
    <div class="modal-box" style="max-width:600px; width:95%; padding:var(--space-xl); max-height:90vh; overflow-y:auto; position:relative; background:var(--bg-elevated); border:1px solid var(--border);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-md);">
        <h3 class="modal-title" style="margin:0;">Manage Availability</h3>
        <button class="btn btn-ghost btn-sm" id="btn-close-timetable" style="position:absolute; top:16px; right:16px; padding:8px; z-index:100; color:var(--text-secondary); transition:color 0.2s;" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='var(--text-secondary)'"><i data-lucide="x" style="width:24px;height:24px;"></i></button>
      </div>
      
      <p style="color:var(--text-secondary); font-size:13px; margin-bottom:var(--space-md);">
        Define the time blocks you have available for the AI Scheduler to slot tasks into.
      </p>

      <!-- Day Selector -->
      <div class="filter-bar mb-md" id="schedule-days-bar"></div>

      <!-- Block List -->
      <div id="modal-schedule-list" class="mb-md" style="min-height:100px;"></div>

      <button class="btn btn-secondary btn-full ripple" id="btn-add-block" style="margin-bottom:var(--space-md);">
        <i data-lucide="plus" style="width:16px;height:16px;margin-right:6px;"></i> Add Block to <span id="current-day-display">Monday</span>
      </button>

      <button class="btn btn-primary btn-full ripple" id="btn-save-timetable">
        <i data-lucide="save" style="width:16px;height:16px;margin-right:6px;"></i> Save Schedule
      </button>
    </div>
  `;

  const renderBlocks = () => {
    backdrop.querySelector("#current-day-display").textContent = selectedDay;
    const listEl = backdrop.querySelector("#modal-schedule-list");
    let dayTasks = localSchedule[selectedDay] || [];
    dayTasks.sort((a, b) => a.start_time.localeCompare(b.start_time));

    if (dayTasks.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; padding:var(--space-md); color:var(--text-muted); font-size:13px; border:1px dashed var(--border); border-radius:8px;">No blocks scheduled for ${selectedDay}.</div>`;
    } else {
      listEl.innerHTML = dayTasks.map(t => `
        <div class="task-card" style="margin-bottom:12px !important; border-color:var(--border); display:flex !important; flex-direction:row !important; justify-content:space-between; align-items:center; padding:12px 16px !important; height:auto !important; min-height:0 !important; cursor:default;">
          <div style="flex:1;">
            <div style="font-weight:600; font-size:14px; color:var(--text-primary); margin-bottom:2px; display:flex; align-items:center; gap:8px;">
              ${escHtml(t.title)} 
              <span style="font-size:10px; padding:2px 6px; border-radius:4px; background:var(--bg-card-hover); color:var(--text-secondary); font-weight:500;">${t.type || 'Study'}</span>
            </div>
            <div style="font-size:12px; color:var(--text-muted); display:flex; align-items:center; gap:4px;">
              <i data-lucide="clock" style="width:12px;height:12px;"></i> ${t.start_time} - ${t.end_time}
            </div>
          </div>
          <button class="btn btn-sm btn-ghost btn-del-block" data-id="${t.id}" style="color:var(--error); padding:8px; margin-left:12px;"><i data-lucide="trash-2" style="width:18px;height:18px;"></i></button>
        </div>
      `).join("");

      listEl.querySelectorAll(".btn-del-block").forEach(btn => {
        btn.addEventListener("click", () => {
          localSchedule[selectedDay] = localSchedule[selectedDay].filter(x => x.id !== btn.dataset.id);
          renderBlocks();
        });
      });
    }
    if (window.lucide) window.lucide.createIcons();
  };

  const updateDaySelector = () => {
    const daysBar = backdrop.querySelector("#schedule-days-bar");
    daysBar.innerHTML = DAYS.map((day, i) => `
      <button class="filter-chip ${day === selectedDay ? "active" : "ripple"}" data-day="${day}" style="min-width:40px; justify-content:center;">
        ${DAY_SHORTS[i]}
      </button>
    `).join("");

    daysBar.querySelectorAll(".filter-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedDay = btn.dataset.day;
        updateDaySelector();
        renderBlocks();
      });
    });
  };

  backdrop.querySelector("#btn-close-timetable").addEventListener("click", () => backdrop.remove());
  
  backdrop.querySelector("#btn-add-block").addEventListener("click", () => {
    openAddBlockModal(selectedDay, (newBlock) => {
      if (!localSchedule[selectedDay]) localSchedule[selectedDay] = [];
      localSchedule[selectedDay].push(newBlock);
      renderBlocks();
    });
  });

  backdrop.querySelector("#btn-save-timetable").addEventListener("click", async () => {
    const btn = backdrop.querySelector("#btn-save-timetable");
    btn.disabled = true;
    btn.innerHTML = `Saving...`;
    try {
      await saveWeeklySchedule(uid, localSchedule);
      showSnackbar("Schedule saved successfully", "success");
      if (onUpdate) onUpdate(localSchedule);
      backdrop.remove();
    } catch (err) {
      showSnackbar("Error saving schedule", "error");
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="save"></i> Save Schedule`;
      if (window.lucide) window.lucide.createIcons();
    }
  });

  document.body.appendChild(backdrop);
  updateDaySelector();
  renderBlocks();
}

function openAddBlockModal(day, onAdd) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop centered";
  backdrop.style.zIndex = "1001"; // Above the other modal

  backdrop.innerHTML = `
    <div class="modal-box" style="max-width:350px">
      <h3 class="modal-title">Add Block to ${day}</h3>
      <div class="form-group">
        <label class="form-label">Block Title</label>
        <input type="text" id="block-title" class="form-input" placeholder="e.g. Free Block" required />
      </div>
      <div style="display:flex; gap:12px;">
        <div class="form-group" style="flex:1;">
          <label class="form-label">Start Time</label>
          <input type="time" id="block-start" class="form-input" value="09:00" required />
        </div>
        <div class="form-group" style="flex:1;">
          <label class="form-label">End Time</label>
          <input type="time" id="block-end" class="form-input" value="11:00" required />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Type</label>
        <select id="block-type" class="form-select">
          <option value="Study" selected>Study (AI available)</option>
          <option value="Free">Free Time</option>
          <option value="Busy">Busy</option>
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="btn-cancel-block">Cancel</button>
        <button class="btn btn-primary" id="btn-save-block">Add</button>
      </div>
    </div>
  `;

  backdrop.querySelector("#btn-cancel-block").addEventListener("click", () => backdrop.remove());
  
  backdrop.querySelector("#btn-save-block").addEventListener("click", () => {
    const title = backdrop.querySelector("#block-title").value.trim();
    const start_time = backdrop.querySelector("#block-start").value;
    const end_time = backdrop.querySelector("#block-end").value;
    const type = backdrop.querySelector("#block-type").value;

    if (!title || !start_time || !end_time) return showSnackbar("Fill all fields", "error");
    if (start_time >= end_time) return showSnackbar("Start must be before end", "error");

    onAdd({
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      title, start_time, end_time, type
    });
    backdrop.remove();
  });

  document.body.appendChild(backdrop);
}
