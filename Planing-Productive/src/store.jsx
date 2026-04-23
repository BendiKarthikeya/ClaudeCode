// ============================================================
// STORE — global app state, synced to Supabase (app_state table)
// ============================================================

const DEFAULT_STATE = {
  route: "dashboard",
  gcalConnected: false,
  quickAddOpen: false,
  tweaksOpen: false,
  focusTaskId: null,
  focusMode: "work",
  focusStartedAt: null,
  focusElapsed: 0,
  focusRunning: false,
  focusSessionsDone: 0,
  tasks: [],
  completed: [],
  events: [],
};

// Fields excluded from persistence (ephemeral UI state)
const EPHEMERAL = ["quickAddOpen", "tweaksOpen"];

let _userId = null;
let _saveTimer = null;

async function fetchRemoteState(userId) {
  const { data, error } = await sb.from("app_state").select("state").eq("user_id", userId).maybeSingle();
  if (error) { console.warn("fetch state:", error.message); return null; }
  return data?.state || null;
}

async function pushRemoteState(userId, state) {
  const payload = { ...state };
  for (const k of EPHEMERAL) delete payload[k];
  const { error } = await sb.from("app_state").upsert({ user_id: userId, state: payload, updated_at: new Date().toISOString() });
  if (error) console.warn("save state:", error.message);
}

function scheduleSave(state) {
  if (!_userId) return;
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => pushRemoteState(_userId, state), 400);
}

function createStore(initial) {
  let state = initial;
  const listeners = new Set();
  return {
    get: () => state,
    set: (updater) => {
      const patch = typeof updater === "function" ? updater(state) : updater;
      state = { ...state, ...patch };
      scheduleSave(state);
      listeners.forEach((l) => l(state));
    },
    replace: (next) => {
      state = next;
      listeners.forEach((l) => l(state));
    },
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

const store = createStore({ ...DEFAULT_STATE });

async function initStoreForUser(userId) {
  _userId = userId;
  const remote = await fetchRemoteState(userId);
  if (remote && Object.keys(remote).length > 0) {
    store.replace({ ...DEFAULT_STATE, ...remote, quickAddOpen: false, tweaksOpen: false });
  } else {
    // First login: seed remote with defaults
    await pushRemoteState(userId, DEFAULT_STATE);
    store.replace({ ...DEFAULT_STATE });
  }
}

function useStore() {
  const [s, setS] = React.useState(store.get());
  React.useEffect(() => store.subscribe(setS), []);
  return [s, store.set];
}

const QUADRANTS = [
  { key: "do",    title: "Do now",        verdict: "Important · Urgent",         pos: "tl", color: "var(--q-do)",    tone: "Crisis / pressing" },
  { key: "plan",  title: "Schedule",      verdict: "Important · Not urgent",     pos: "tr", color: "var(--q-plan)",  tone: "Deep work, planning" },
  { key: "deleg", title: "Delegate",      verdict: "Not important · Urgent",     pos: "bl", color: "var(--q-deleg)", tone: "Interruptions, asks" },
  { key: "drop",  title: "Let go",        verdict: "Not important · Not urgent", pos: "br", color: "var(--q-drop)",  tone: "Busywork, distraction" },
];

Object.assign(window, { store, useStore, QUADRANTS, DEFAULT_STATE, initStoreForUser });
