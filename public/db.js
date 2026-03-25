// ============================================================
// db.js — Firestore CRUD helpers for all collections
// ============================================================

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { showSnackbar } from "./snackbar.js";

function handleError(err, context = "operation") {
  console.error(`DB Error (${context}):`, err);
  if (err.message && err.message.toLowerCase().includes("permission")) {
    showSnackbar("Permission denied. Check database rules.", "error");
  } else {
    showSnackbar(`Failed to sync ${context}.`, "error");
  }
  throw err;
}

// ─────────────────────────────────────────────────────────────
//  USER PROFILE
// ─────────────────────────────────────────────────────────────
export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    return handleError(err, "profile");
  }
}

export async function updateUserProfile(uid, data) {
  try {
    await updateDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() });
  } catch (err) {
    handleError(err, "update profile");
  }
}

// ─────────────────────────────────────────────────────────────
//  SUBJECTS
// ─────────────────────────────────────────────────────────────
export async function createSubject(uid, { name, color, order = 0 }) {
  try {
    return await addDoc(collection(db, "subjects"), {
      userId: uid,
      name,
      color: color || "#6c63ff",
      order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    return handleError(err, "create subject");
  }
}

export async function getSubjects(uid) {
  try {
    const q = query(
      collection(db, "subjects"),
      where("userId", "==", uid)
    );
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return data.sort((a, b) => {
      if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
      return tA - tB;
    });
  } catch (err) {
    return handleError(err, "load subjects");
  }
}

export async function updateSubject(id, data) {
  try {
    await updateDoc(doc(db, "subjects", id), { ...data, updatedAt: serverTimestamp() });
  } catch (err) {
    handleError(err, "update subject");
  }
}

export async function deleteSubject(id) {
  try {
    await deleteDoc(doc(db, "subjects", id));
  } catch (err) {
    handleError(err, "delete subject");
  }
}

// ─────────────────────────────────────────────────────────────
//  TOPICS
// ─────────────────────────────────────────────────────────────
export async function createTopic(uid, { subjectId, name, order = 0 }) {
  try {
    return await addDoc(collection(db, "topics"), {
      userId: uid,
      subjectId,
      name,
      order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    return handleError(err, "create topic");
  }
}

export async function getTopics(uid, subjectId = null) {
  try {
    const constraints = [where("userId", "==", uid)];
    if (subjectId) constraints.push(where("subjectId", "==", subjectId));
    const q = query(collection(db, "topics"), ...constraints);
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return data.sort((a, b) => {
      if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
      return tA - tB;
    });
  } catch (err) {
    return handleError(err, "load topics");
  }
}

export async function updateTopic(id, data) {
  try {
    await updateDoc(doc(db, "topics", id), { ...data, updatedAt: serverTimestamp() });
  } catch (err) {
    handleError(err, "update topic");
  }
}

export async function deleteTopic(id) {
  try {
    await deleteDoc(doc(db, "topics", id));
  } catch (err) {
    handleError(err, "delete topic");
  }
}

// ─────────────────────────────────────────────────────────────
//  TASKS
// ─────────────────────────────────────────────────────────────
export async function createTask(uid, taskData) {
  const {
    subjectId = null,
    topicId = null,
    title,
    description = "",
    priority = "medium",
    dueDate = null,
    reminderTime = null,
  } = taskData;

  try {
    return await addDoc(collection(db, "tasks"), {
      userId: uid,
      subjectId,
      topicId,
      title,
      description,
      priority,
      dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null,
      reminderTime: reminderTime ? Timestamp.fromDate(new Date(reminderTime)) : null,
      isCompleted: false,
      completedAt: null,
      reminderSent: false,
      snoozedUntil: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    return handleError(err, "create task");
  }
}

export async function getTasks(uid, filters = {}) {
  try {
    const constraints = [where("userId", "==", uid)];

    if (filters.subjectId) constraints.push(where("subjectId", "==", filters.subjectId));
    if (filters.topicId) constraints.push(where("topicId", "==", filters.topicId));
    if (filters.isCompleted !== undefined)
      constraints.push(where("isCompleted", "==", filters.isCompleted));
    if (filters.priority) constraints.push(where("priority", "==", filters.priority));

    const q = query(collection(db, "tasks"), ...constraints);
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return data.sort((a, b) => {
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
      return tB - tA; // desc
    });
  } catch (err) {
    return handleError(err, "load tasks");
  }
}

export async function updateTask(id, data) {
  try {
    const update = { ...data, updatedAt: serverTimestamp() };
    if (data.dueDate) update.dueDate = Timestamp.fromDate(new Date(data.dueDate));
    if (data.reminderTime) update.reminderTime = Timestamp.fromDate(new Date(data.reminderTime));
    await updateDoc(doc(db, "tasks", id), update);
  } catch (err) {
    handleError(err, "update task");
  }
}

export async function completeTask(id) {
  try {
    await updateDoc(doc(db, "tasks", id), {
      isCompleted: true,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleError(err, "complete task");
  }
}

export async function reopenTask(id) {
  try {
    await updateDoc(doc(db, "tasks", id), {
      isCompleted: false,
      completedAt: null,
      reminderSent: false,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleError(err, "reopen task");
  }
}

export async function snoozeTask(id, minutes = 15) {
  try {
    const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
    await updateDoc(doc(db, "tasks", id), {
      snoozedUntil: Timestamp.fromDate(snoozedUntil),
      reminderSent: false,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleError(err, "snooze task");
  }
}

export async function deleteTask(id) {
  try {
    await deleteDoc(doc(db, "tasks", id));
  } catch (err) {
    handleError(err, "delete task");
  }
}

// ─────────────────────────────────────────────────────────────
//  FCM TOKENS
// ─────────────────────────────────────────────────────────────
export async function saveFcmToken(uid, token) {
  try {
    await setDoc(doc(db, "users", uid, "fcmTokens", token), {
      token,
      createdAt: serverTimestamp(),
      platform: navigator.platform || "unknown",
    });
  } catch (err) {
    handleError(err, "save token");
  }
}

export async function removeFcmToken(uid, token) {
  try {
    await deleteDoc(doc(db, "users", uid, "fcmTokens", token));
  } catch (err) {
    handleError(err, "remove token");
  }
}

// ─────────────────────────────────────────────────────────────
//  WEEKLY SCHEDULE
// ─────────────────────────────────────────────────────────────
const defaultSchedule = {
  Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
};

export async function getWeeklySchedule(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid, "planner", "schedule"));
    if (snap.exists()) {
      const data = snap.data();
      return { ...defaultSchedule, ...data.week_schedule };
    }
    return defaultSchedule;
  } catch (err) {
    return handleError(err, "load schedule");
  }
}

export async function saveWeeklySchedule(uid, week_schedule) {
  try {
    await setDoc(doc(db, "users", uid, "planner", "schedule"), {
      week_schedule,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleError(err, "save schedule");
  }
}

// ─────────────────────────────────────────────────────────────
//  SCHEDULER TASKS & GENERATED PLAN
// ─────────────────────────────────────────────────────────────
export async function createSchedulerTask(uid, taskData) {
  try {
    return await addDoc(collection(db, "schedulerTasks"), {
      userId: uid,
      title: taskData.title,
      subject: taskData.subject || "",
      estimatedTime: parseInt(taskData.estimatedTime, 10) || 60,
      deadline: taskData.deadline || null,
      priority: taskData.priority || "medium",
      notes: taskData.notes || "",
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    return handleError(err, "create scheduler task");
  }
}

export async function getSchedulerTasks(uid) {
  try {
    const q = query(collection(db, "schedulerTasks"), where("userId", "==", uid));
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return data.sort((a, b) => {
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
      return tA - tB;
    });
  } catch (err) {
    return handleError(err, "load scheduler tasks");
  }
}

export async function updateSchedulerTask(id, data) {
  try {
    await updateDoc(doc(db, "schedulerTasks", id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    handleError(err, "update scheduler task");
  }
}

export async function deleteSchedulerTask(id) {
  try {
    await deleteDoc(doc(db, "schedulerTasks", id));
  } catch (err) {
    handleError(err, "delete scheduler task");
  }
}

export async function getGeneratedPlan(uid) {
  const snap = await getDoc(doc(db, "users", uid, "planner", "generated_plan"));
  return snap.exists() ? snap.data().plan : null;
}

export async function saveGeneratedPlan(uid, plan) {
  await setDoc(doc(db, "users", uid, "planner", "generated_plan"), {
    plan,
    updatedAt: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────────────────────
//  PERSONAL GOALS
// ─────────────────────────────────────────────────────────────
export async function createGoal(uid, goalData) {
  try {
    return await addDoc(collection(db, "personalGoals"), {
      userId: uid,
      title: goalData.title,
      category: goalData.category || "custom",
      totalTarget: goalData.totalTarget,
      unit: goalData.unit || "sessions",
      durationDays: goalData.durationDays,
      startDate: goalData.startDate,
      endDate: goalData.endDate || null,
      dailyTarget: goalData.dailyTarget,
      priority: goalData.priority || "medium",
      autoAddDaily: goalData.autoAddDaily !== false,
      status: "active",
      totalProgress: 0,
      lastGeneratedDate: null,
      notes: goalData.notes || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    return handleError(err, "create goal");
  }
}

export async function getGoals(uid) {
  try {
    const q = query(collection(db, "personalGoals"), where("userId", "==", uid));
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return data.sort((a, b) => {
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tB - tA;
    });
  } catch (err) {
    return handleError(err, "load goals");
  }
}

export async function updateGoal(id, data) {
  try {
    await updateDoc(doc(db, "personalGoals", id), { ...data, updatedAt: serverTimestamp() });
  } catch (err) {
    handleError(err, "update goal");
  }
}

export async function deleteGoal(id) {
  try {
    await deleteDoc(doc(db, "personalGoals", id));
  } catch (err) {
    handleError(err, "delete goal");
  }
}

// ─────────────────────────────────────────────────────────────
//  GOAL TASKS (auto-generated daily tasks from a goal)
// ─────────────────────────────────────────────────────────────
export async function createGoalTask(uid, taskData) {
  return addDoc(collection(db, "goalTasks"), {
    userId: uid,
    sourceGoalId: taskData.sourceGoalId,
    title: taskData.title,
    type: "personalDevelopment",
    estimatedTime: taskData.estimatedTime || 30,
    deadline: taskData.deadline || null,
    priority: taskData.priority || "medium",
    status: "pending",
    autoGenerated: true,
    date: taskData.date,        // YYYY-MM-DD — used for deduplication
    schedulerTaskId: null,      // set when pushed to schedulerTasks
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getGoalTasks(uid, goalId = null) {
  const constraints = [where("userId", "==", uid)];
  if (goalId) constraints.push(where("sourceGoalId", "==", goalId));
  const q = query(collection(db, "goalTasks"), ...constraints);
  const snap = await getDocs(q);
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return data.sort((a, b) => {
    const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return tB - tA;
  });
}

export async function updateGoalTask(id, data) {
  await updateDoc(doc(db, "goalTasks", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteGoalTask(id) {
  await deleteDoc(doc(db, "goalTasks", id));
}
