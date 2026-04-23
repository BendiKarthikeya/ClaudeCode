// ============================================================
// HISTORY — completed log + time-on-task from focus sessions
// ============================================================
// Icons is on window
function fmtDuration(secs) {
  if (!secs) return "0m";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${secs}s`;
}

function fmtRelative(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function History({ state, dispatch }) {
  const completeTask = (id) => {
    dispatch(s => {
      const t = s.tasks.find(t => t.id === id);
      if (!t) return {};
      const focusSecs = t.focusSecs || 0;
      return {
        tasks: s.tasks.filter(x => x.id !== id),
        completed: [
          { id: "c"+Date.now(), title: t.title, quadrant: t.quadrant, at: "Just now", completedAt: Date.now(), focusSecs, sessions: Math.max(1, Math.round(focusSecs / 60 / 25)) },
          ...s.completed,
        ],
      };
    });
  };

  const uncompleteTask = (id) => {
    dispatch(s => {
      const c = s.completed.find(x => x.id === id);
      if (!c) return {};
      return {
        completed: s.completed.filter(x => x.id !== id),
        tasks: [{ id: "t"+Date.now(), title: c.title, quadrant: c.quadrant || "plan", focusSecs: c.focusSecs || 0, createdAt: Date.now() }, ...s.tasks],
      };
    });
  };

  const inProgress = state.tasks.filter(t => (t.focusSecs || 0) > 0);
  const untouched = state.tasks.filter(t => !(t.focusSecs));
  const totalFocusSecs = state.tasks.reduce((a, t) => a + (t.focusSecs || 0), 0)
    + state.completed.reduce((a, c) => a + (c.focusSecs || 0), 0);

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__kicker">
            {state.completed.length} completed · {inProgress.length} in progress · {fmtDuration(totalFocusSecs)} focused
          </div>
          <h1 className="page__title">The <em>shape</em> of your work.</h1>
          <div className="page__sub">Time on each task comes from your focus sessions. Tick a task to mark it done.</div>
        </div>
      </div>

      <div className="history-grid">
        <div className="card">
          <div className="card__head">
            <div className="card__title">In progress</div>
            <div className="card__kicker">{inProgress.length} active · {untouched.length} not started</div>
          </div>
          <div className="card__body">
            <div className="history-list">
              {inProgress.length === 0 && untouched.length === 0 && (
                <div style={{fontSize:13, color:"var(--fg-3)", padding:"10px 4px"}}>No open tasks. Add one from the matrix or quick-add (⌘K).</div>
              )}
              {inProgress
                .slice()
                .sort((a, b) => (b.focusSecs || 0) - (a.focusSecs || 0))
                .map(t => {
                  const q = window.QUADRANTS.find(q => q.key === t.quadrant);
                  return (
                    <div key={t.id} className="history-row">
                      <button
                        className="history-row__check"
                        onClick={() => completeTask(t.id)}
                        title="Mark complete"
                        style={{cursor:"pointer", background:"transparent", border:"1.5px solid var(--line)", borderRadius:"50%", width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--fg-2)"}}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--fg-2)"; }}
                      >
                        <Icons.Check size={10}/>
                      </button>
                      <div className="history-row__title">
                        {q && <span style={{display:"inline-block", width:8, height:8, borderRadius:2, background:q.color, marginRight:8, verticalAlign:"middle"}}/>}
                        {t.title}
                      </div>
                      <div className="history-row__meta" style={{color:"var(--accent)"}}>{fmtDuration(t.focusSecs || 0)}</div>
                      <div className="history-row__meta">{q?.title || ""}</div>
                    </div>
                  );
                })}
              {untouched.length > 0 && (
                <div style={{margin:"14px 0 6px", fontFamily:"var(--font-mono)", fontSize:10, color:"var(--fg-3)", letterSpacing:"0.12em", textTransform:"uppercase"}}>
                  Not started
                </div>
              )}
              {untouched.map(t => {
                const q = window.QUADRANTS.find(q => q.key === t.quadrant);
                return (
                  <div key={t.id} className="history-row" style={{opacity:0.75}}>
                    <button
                      className="history-row__check"
                      onClick={() => completeTask(t.id)}
                      title="Mark complete"
                      style={{cursor:"pointer", background:"transparent", border:"1.5px solid var(--line)", borderRadius:"50%", width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--fg-2)"}}
                    >
                      <Icons.Check size={10}/>
                    </button>
                    <div className="history-row__title">
                      {q && <span style={{display:"inline-block", width:8, height:8, borderRadius:2, background:q.color, marginRight:8, verticalAlign:"middle"}}/>}
                      {t.title}
                    </div>
                    <div className="history-row__meta">—</div>
                    <div className="history-row__meta">{q?.title || ""}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div className="card__title">Completed</div>
            <div className="card__kicker">{state.completed.length} total</div>
          </div>
          <div className="card__body">
            <div className="history-list">
              {state.completed.length === 0 && (
                <div style={{fontSize:13, color:"var(--fg-3)", padding:"10px 4px"}}>Nothing completed yet. Check off a task above.</div>
              )}
              {state.completed.map(c => {
                const q = c.quadrant && window.QUADRANTS.find(q => q.key === c.quadrant);
                return (
                  <div key={c.id} className="history-row">
                    <button
                      className="history-row__check"
                      onClick={() => uncompleteTask(c.id)}
                      title="Restore to open tasks"
                      style={{cursor:"pointer", background:"var(--accent)", border:0, borderRadius:"50%", width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--accent-ink)"}}
                    >
                      <Icons.Check size={10}/>
                    </button>
                    <div className="history-row__title" style={{textDecoration:"line-through", color:"var(--fg-2)"}}>
                      {q && <span style={{display:"inline-block", width:8, height:8, borderRadius:2, background:q.color, marginRight:8, verticalAlign:"middle"}}/>}
                      {c.title}
                    </div>
                    <div className="history-row__meta">{fmtDuration(c.focusSecs || 0)}</div>
                    <div className="history-row__meta">{c.completedAt ? fmtRelative(c.completedAt) : c.at}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.History = History;
