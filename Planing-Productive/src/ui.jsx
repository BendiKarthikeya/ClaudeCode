// ============================================================
// UI — shared components (Sidebar, Topbar, TaskCard, QuickAdd)
// ============================================================

// Icons is on window
// ---------- Sidebar ----------
function Sidebar({ route, onRoute, focusTaskId }) {
  const [user, setUser] = React.useState(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  React.useEffect(() => { getCurrentUser().then(setUser); }, []);
  const name = user?.user_metadata?.name || (user?.email ? user.email.split("@")[0] : "You");
  const email = user?.email || "";
  const initial = (name || "?").slice(0,1).toUpperCase();

  const items = [
    { key: "dashboard", label: "Dashboard", icon: Icons.Home, kbd: "1" },
    { key: "matrix",    label: "Task Matrix", icon: Icons.Grid, kbd: "2" },
    { key: "calendar",  label: "Calendar",  icon: Icons.Calendar, kbd: "3" },
    { key: "focus",     label: "Focus",     icon: Icons.Focus, kbd: "4", badge: focusTaskId ? "•" : null },
    { key: "history",   label: "History",   icon: Icons.History, kbd: "5" },
    { key: "settings",  label: "Settings",  icon: Icons.Settings, kbd: "," },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="brand__mark" />
        <div className="brand__name">Lumen</div>
        <div className="brand__sub">v2.4</div>
      </div>

      <nav className="nav">
        <div className="nav__label">Workspace</div>
        {items.slice(0,4).map((it) => (
          <button key={it.key}
            className="nav__item"
            aria-current={route === it.key ? "page" : undefined}
            onClick={() => onRoute(it.key)}>
            <it.icon className="nav__icon" />
            <span>{it.label}</span>
            {it.badge
              ? <span className="nav__badge" style={{background: "var(--accent)", color: "var(--accent-ink)"}}>running</span>
              : <span className="nav__kbd">{it.kbd}</span>}
          </button>
        ))}
        <div className="nav__label" style={{marginTop: 8}}>Archive</div>
        {items.slice(4).map((it) => (
          <button key={it.key}
            className="nav__item"
            aria-current={route === it.key ? "page" : undefined}
            onClick={() => onRoute(it.key)}>
            <it.icon className="nav__icon" />
            <span>{it.label}</span>
            <span className="nav__kbd">{it.kbd}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar__foot" style={{position:"relative"}}>
        <button
          className="user"
          onClick={() => setMenuOpen(v => !v)}
          style={{background:"transparent", border:0, width:"100%", textAlign:"left", cursor:"pointer", padding:0, color:"inherit", display:"flex", alignItems:"center", gap:10}}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <div className="user__avatar">{initial}</div>
          <div style={{flex:1, minWidth:0}}>
            <div className="user__name" style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{name}</div>
            <div className="user__meta" style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{email || "Signed in"}</div>
          </div>
          <Icons.Arrow size={12} />
        </button>
        {menuOpen && (
          <div
            role="menu"
            style={{position:"absolute", bottom:"calc(100% + 6px)", left:12, right:12, background:"var(--bg-1)", border:"1px solid var(--line-soft)", borderRadius:8, padding:6, boxShadow:"0 12px 32px rgba(0,0,0,0.35)", zIndex:20}}
          >
            <button className="btn btn--ghost btn--sm" style={{width:"100%", justifyContent:"flex-start"}} onClick={() => { setMenuOpen(false); onRoute("settings"); }}>
              <Icons.Settings size={12}/> Account settings
            </button>
            <button className="btn btn--ghost btn--sm" style={{width:"100%", justifyContent:"flex-start", color:"var(--danger)"}} onClick={() => logout()}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

// ---------- Topbar ----------
function Topbar({ crumbs, actions, onQuickAdd }) {
  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{opacity: 0.4, margin: "0 6px"}}>/</span>}
            {i === crumbs.length - 1 ? <b>{c}</b> : <span>{c}</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="search" onClick={onQuickAdd}>
        <Icons.Search />
        <span>Quick add or jump to…</span>
        <span className="search__kbd">⌘ K</span>
      </div>
      {actions}
    </div>
  );
}

// ---------- Task card ----------
function TaskCard({ task, onStart, onComplete, onDragStart, onDragEnd, isRunning }) {
  const [completing, setCompleting] = React.useState(false);

  const handleCheck = (e) => {
    e.stopPropagation();
    setCompleting(true);
    setTimeout(() => onComplete(task.id), 580);
  };

  return (
    <div
      className={`task ${isRunning ? "is-running" : ""} ${completing ? "is-completing" : ""}`}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
    >
      <button className="task__check" onClick={handleCheck} aria-label="Complete">
        <Icons.Check size={12} />
      </button>
      <div className="task__body">
        <div className="task__title">{task.title}</div>
        <div className="task__meta">
          {task.due && <span><Icons.Clock size={10}/> {task.due}</span>}
          {task.duration && <span><Icons.Dot size={10}/> {task.duration}m</span>}
          {task.subtasks && <span><Icons.List size={10}/> {task.subtasks.filter(s=>s.done).length}/{task.subtasks.length}</span>}
          {task.notes && <span><Icons.Tag size={10}/> note</span>}
        </div>
      </div>
      <button className="task__play" onClick={(e) => { e.stopPropagation(); onStart(task.id); }} aria-label="Start">
        {isRunning ? <Icons.Pause size={12}/> : <Icons.Play size={10}/>}
      </button>
    </div>
  );
}

// ---------- Quick add overlay ----------
function QuickAdd({ onClose, onAdd }) {
  const [text, setText] = React.useState("");
  const [quad, setQuad] = React.useState("plan");
  const [due, setDue] = React.useState("");
  const [dueTime, setDueTime] = React.useState("");
  const [duration, setDuration] = React.useState(25);
  const inputRef = React.useRef();

  React.useEffect(() => {
    inputRef.current?.focus();
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  const submit = () => {
    if (!text.trim()) return;
    let dueLabel = "";
    if (due) {
      const d = new Date(due + (dueTime ? "T" + dueTime : "T00:00"));
      dueLabel = d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + (dueTime ? " " + d.toLocaleTimeString(undefined, {hour:"numeric", minute:"2-digit"}) : "");
    }
    onAdd({ title: text.trim(), quadrant: quad, due: dueLabel || undefined, duration: Number(duration) || 25 });
    onClose();
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="qa">
        <input
          ref={inputRef}
          className="qa__input"
          placeholder="What do you need to do?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <div className="qa__divider" />
        <div className="qa__picker">
          {window.QUADRANTS.map((q) => (
            <button key={q.key} className="qa__pick" aria-pressed={quad === q.key} onClick={() => setQuad(q.key)}>
              <span style={{width: 8, height: 8, borderRadius: 2, background: q.color, display: "inline-block"}} />
              {q.title}
            </button>
          ))}
        </div>
        <div className="qa__divider" />
        <div style={{display:"flex", gap:10, padding:"10px 14px", flexWrap:"wrap", alignItems:"center"}}>
          <label style={{display:"flex", flexDirection:"column", gap:4, fontFamily:"var(--font-mono)", fontSize:10, color:"var(--fg-3)", letterSpacing:"0.12em", textTransform:"uppercase"}}>
            Deadline
            <input type="date" value={due} onChange={(e)=>setDue(e.target.value)}
              style={{background:"var(--bg-2)", border:"1px solid var(--line-soft)", borderRadius:6, padding:"6px 8px", color:"var(--fg-0)", fontSize:12}} />
          </label>
          <label style={{display:"flex", flexDirection:"column", gap:4, fontFamily:"var(--font-mono)", fontSize:10, color:"var(--fg-3)", letterSpacing:"0.12em", textTransform:"uppercase"}}>
            Time
            <input type="time" value={dueTime} onChange={(e)=>setDueTime(e.target.value)}
              style={{background:"var(--bg-2)", border:"1px solid var(--line-soft)", borderRadius:6, padding:"6px 8px", color:"var(--fg-0)", fontSize:12}} />
          </label>
          <label style={{display:"flex", flexDirection:"column", gap:4, fontFamily:"var(--font-mono)", fontSize:10, color:"var(--fg-3)", letterSpacing:"0.12em", textTransform:"uppercase"}}>
            Duration (min)
            <input type="number" min="5" max="480" step="5" value={duration} onChange={(e)=>setDuration(e.target.value)}
              style={{background:"var(--bg-2)", border:"1px solid var(--line-soft)", borderRadius:6, padding:"6px 8px", color:"var(--fg-0)", fontSize:12, width:90}} />
          </label>
        </div>
        <div className="qa__foot">
          <span><b>↵</b> Add</span>
          <span><b>Tab</b> Pick quadrant</span>
          <span><b>Esc</b> Close</span>
          <span style={{marginLeft: "auto"}}>Auto-classifies by keywords</span>
        </div>
      </div>
    </div>
  );
}

// ---------- tiny drag-n-drop helpers ----------
const dragState = { task: null };

function onTaskDragStart(e, task) {
  dragState.task = task;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", task.id);
  e.currentTarget.classList.add("is-dragging");
}
function onTaskDragEnd(e) {
  e.currentTarget.classList.remove("is-dragging");
  dragState.task = null;
  document.querySelectorAll(".is-over").forEach(el => el.classList.remove("is-over"));
}

Object.assign(window, { Sidebar, Topbar, TaskCard, QuickAdd, onTaskDragStart, onTaskDragEnd, dragState });
