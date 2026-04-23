// ============================================================
// APP — root with routing, keyboard shortcuts, tweaks wiring
// ============================================================
// Icons is on window
function AppShell() {
  const [state, setStateRaw] = useStore();
  const dispatch = (patch) => store.set(typeof patch === "function" ? patch : patch);

  const [tweaksOpen, setTweaksOpen] = React.useState(false);

  const onRoute = (r) => dispatch({ route: r });

  // Keyboard
  React.useEffect(() => {
    const keys = (e) => {
      const cmd = e.metaKey || e.ctrlKey;
      if (cmd && e.key.toLowerCase() === "k") { e.preventDefault(); dispatch({ quickAddOpen: true }); return; }
      if (cmd && e.key === "/") { e.preventDefault(); setTweaksOpen(v => !v); return; }
      if (cmd && e.shiftKey && e.key.toLowerCase() === "f") { e.preventDefault(); onRoute("focus"); return; }
      // only when not in input
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "1") onRoute("dashboard");
      else if (e.key === "2") onRoute("matrix");
      else if (e.key === "3") onRoute("calendar");
      else if (e.key === "4") onRoute("focus");
      else if (e.key === "5") onRoute("history");
      else if (e.key === ",") onRoute("settings");
      else if (e.key === " " && state.focusTaskId) {
        e.preventDefault();
        dispatch({ focusRunning: !state.focusRunning });
      } else if (e.key === "Escape") {
        if (state.quickAddOpen) dispatch({ quickAddOpen: false });
      }
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, [state.focusTaskId, state.focusRunning, state.quickAddOpen]);

  // Edit-mode protocol
  React.useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === "__activate_edit_mode") setTweaksOpen(true);
      if (e.data?.type === "__deactivate_edit_mode") setTweaksOpen(false);
    };
    window.addEventListener("message", onMsg);
    try { window.parent.postMessage({ type: "__edit_mode_available" }, "*"); } catch {}
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Add task
  const addTask = ({ title, quadrant, due, duration }) => {
    dispatch(s => ({
      tasks: [{ id: "t" + Date.now(), title, quadrant, duration: duration || 25, ...(due ? {due} : {}) }, ...s.tasks],
    }));
  };

  const crumbsFor = {
    dashboard: ["Lumen", "Dashboard"],
    matrix: ["Lumen", "Tasks", "Matrix"],
    calendar: ["Lumen", "Calendar", "Week"],
    focus: ["Lumen", "Focus"],
    history: ["Lumen", "History"],
    settings: ["Lumen", "Settings"],
  };

  const actions = state.route !== "focus" && (
    <>
      <button className="btn btn--ghost btn--sm" onClick={() => setTweaksOpen(v => !v)} aria-label="Tweaks">
        <Icons.Sparkle size={14}/>
      </button>
      <button className="btn btn--primary btn--sm" onClick={() => dispatch({ quickAddOpen: true })}>
        <Icons.Plus size={12}/> New task
      </button>
    </>
  );

  return (
    <div className="app">
      <Sidebar route={state.route} onRoute={onRoute} focusTaskId={state.focusTaskId} />
      <main className="main">
        {state.route !== "focus" && (
          <Topbar
            crumbs={crumbsFor[state.route]}
            actions={actions}
            onQuickAdd={() => dispatch({ quickAddOpen: true })}
          />
        )}
        {state.route === "dashboard" && <Dashboard state={state} dispatch={dispatch} onRoute={onRoute} />}
        {state.route === "matrix" && <Matrix state={state} dispatch={dispatch} onRoute={onRoute} />}
        {state.route === "calendar" && <Calendar state={state} dispatch={dispatch} />}
        {state.route === "focus" && <Focus state={state} dispatch={dispatch} onRoute={onRoute} />}
        {state.route === "history" && <History state={state} dispatch={dispatch} />}
        {state.route === "settings" && <Settings state={state} dispatch={dispatch} />}
      </main>

      {state.quickAddOpen && (
        <QuickAdd onClose={() => dispatch({ quickAddOpen: false })} onAdd={addTask} />
      )}
      {tweaksOpen && <TweaksPanel onClose={() => setTweaksOpen(false)} />}
    </div>
  );
}

function App() {
  const [status, setStatus] = React.useState("loading"); // loading | anon | ready
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await sb.auth.getSession();
      const u = data?.session?.user || null;
      if (!mounted) return;
      if (!u) { setStatus("anon"); return; }
      setUser(u);
      await initStoreForUser(u.id);
      if (!mounted) return;
      setStatus("ready");
    })();
    const { data: sub } = sb.auth.onAuthStateChange((_evt, session) => {
      if (!session?.user) { setUser(null); setStatus("anon"); }
    });
    return () => { mounted = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  if (status === "loading") {
    return <div className="auth-screen"><div className="auth-card" style={{textAlign:"center"}}><div className="auth-brand">Lumen</div><div className="auth-tag">Loading…</div></div></div>;
  }
  if (status === "anon") {
    return <AuthScreen onAuthed={() => location.reload()} />;
  }
  return <AppShell />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
