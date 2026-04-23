// ============================================================
// MATRIX — Eisenhower + quadrants with drag
// ============================================================
// Icons is on window
const VERB_LABELS = {
  do: { title: "Attack", verdict: "Important · Urgent" },
  plan: { title: "Plant", verdict: "Important · Not urgent" },
  deleg: { title: "Hand off", verdict: "Not important · Urgent" },
  drop: { title: "Ignore", verdict: "Not important · Not urgent" },
};

function Matrix({ state, dispatch, onRoute }) {
  const byQuad = (k) => state.tasks.filter(t => t.quadrant === k);
  const labels = (window.__TWEAKS?.quadrantLabels === "verbs") ? VERB_LABELS : null;

  const handleDrop = (e, quadKey) => {
    e.preventDefault();
    e.currentTarget.classList.remove("is-over");
    const task = window.dragState.task;
    if (!task || task.quadrant === quadKey) return;
    dispatch(s => ({
      tasks: s.tasks.map(t => t.id === task.id ? { ...t, quadrant: quadKey } : t)
    }));
  };

  const handleStart = (id) => {
    dispatch({focusTaskId: id, focusRunning: true, focusStartedAt: Date.now(), focusElapsed: 0, focusMode: "work"});
    onRoute("focus");
  };

  const handleComplete = (id) => {
    dispatch(s => {
      const t = s.tasks.find(t => t.id === id);
      const focusSecs = t?.focusSecs || 0;
      return {
        tasks: s.tasks.filter(t => t.id !== id),
        completed: [
          { id: "c"+Date.now(), title: t?.title || "Task", quadrant: t?.quadrant, at: "Just now", completedAt: Date.now(), focusSecs, sessions: Math.max(1, Math.round(focusSecs / 60 / 25)) },
          ...s.completed
        ]
      };
    });
  };

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__kicker">Eisenhower matrix · {state.tasks.length} open</div>
          <h1 className="page__title">What deserves your <em>attention?</em></h1>
          <div className="page__sub">Drag a task across the axes. Anything in the top-left needs to be done today. Anything in the bottom-right probably shouldn't happen at all.</div>
        </div>
        <div style={{display: "flex", gap: 8}}>
          <button className="btn" onClick={() => dispatch({ quickAddOpen: true })}>
            <Icons.Plus size={12}/> Add task <span className="kbd">⌘ K</span>
          </button>
        </div>
      </div>

      <div className="matrix-wrap">
        {/* Axis labels */}
        <div className="axis axis--top">
          <span className="axis-label"><Icons.Zap size={12}/> URGENT</span>
          <span className="axis-label" style={{color:"var(--fg-2)"}}>NOT URGENT <Icons.Coffee size={12}/></span>
        </div>
        <div className="axis axis--bot"></div>
        <div className="axis axis--left">
          <span className="axis-label"><Icons.ArrowUp size={12}/> IMPORTANT</span>
        </div>
        <div className="axis axis--right">
          <span className="axis-label">NOT IMPORTANT</span>
        </div>

        {/* Quadrants */}
        {window.QUADRANTS.map(q => {
          const tasks = byQuad(q.key);
          const lbl = labels?.[q.key] || q;
          return (
            <div
              key={q.key}
              className={`quad quad--${q.pos}`}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("is-over"); }}
              onDragLeave={(e) => e.currentTarget.classList.remove("is-over")}
              onDrop={(e) => handleDrop(e, q.key)}
            >
              <div className="quad__head">
                <div className="quad__swatch" style={{background: q.color}} />
                <div>
                  <div className="quad__title">{lbl.title}</div>
                  <div className="quad__verdict">{lbl.verdict}</div>
                </div>
                <div className="quad__count">{tasks.length}</div>
              </div>

              <div className="quad__tasks">
                {tasks.length === 0 && (
                  <div className="empty">drop tasks here</div>
                )}
                {tasks.map(t => (
                  <TaskCard key={t.id} task={t}
                    onStart={handleStart}
                    onComplete={handleComplete}
                    onDragStart={onTaskDragStart}
                    onDragEnd={onTaskDragEnd}
                    isRunning={state.focusTaskId === t.id && state.focusRunning}
                  />
                ))}
                <button className="quad__add" onClick={() => dispatch({ quickAddOpen: true })}>
                  <Icons.Plus size={10} /> add to {lbl.title.toLowerCase()}
                </button>
              </div>
            </div>
          );
        })}

        {/* Hub */}
        <div className="matrix-hub">
          <div className="matrix-hub__inner">
            <div>
              <div className="matrix-hub__num">{state.tasks.length}</div>
              <div className="matrix-hub__lbl">open tasks</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Matrix = Matrix;
