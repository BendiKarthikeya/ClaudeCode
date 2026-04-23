// ============================================================
// DASHBOARD
// ============================================================
// Icons is on window
function Dashboard({ state, dispatch, onRoute }) {
  const doNow = state.tasks.filter(t => t.quadrant === "do");
  const plan = state.tasks.filter(t => t.quadrant === "plan");
  const total = state.tasks.length;

  const [user, setUser] = React.useState(null);
  React.useEffect(() => { getCurrentUser().then(setUser); }, []);
  const displayName = user?.user_metadata?.name || (user?.email ? user.email.split("@")[0] : "there");

  const now = new Date();
  const hour = now.getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const todayLabel = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  const dayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const fmtHour = (h) => {
    const hr = Math.floor(h), m = Math.round((h - hr) * 60);
    return `${String(hr).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  };
  const nowH = hour + now.getMinutes()/60;
  const schedule = state.events
    .filter(e => e.day === dayIdx)
    .sort((a,b) => a.start - b.start)
    .map(e => ({
      time: fmtHour(e.start),
      title: e.title,
      meta: `${e.kind} · ${Math.round((e.end - e.start) * 60)} min`,
      past: e.end <= nowH,
      now: e.start <= nowH && nowH < e.end,
    }));

  const nextTask = doNow[0] || plan[0];
  const sessionsToday = state.focusSessionsDone || 0;
  const doneCount = state.completed.length;
  const focusHours = sessionsToday * ((window.__TWEAKS?.pomodoroWork || 25) / 60);
  const goalHours = 4;
  const ringPct = Math.min(100, Math.round((focusHours / goalHours) * 100));
  const c = 2 * Math.PI * 70;
  const offset = c - (c * ringPct) / 100;

  return (
    <div className="page">
      <div className="dash-grid">
        {/* Hero */}
        <div className="dash-hero">
          <div>
            <div className="hero__salute">{greet}, {displayName}</div>
            <h1 className="hero__title">
              Three things <em>matter</em> today.<br/>
              The rest can <mark>wait</mark>.
            </h1>
            {nextTask ? (
              <button className="hero__next" onClick={() => { dispatch({focusTaskId: nextTask.id, focusRunning: true, focusStartedAt: Date.now(), focusElapsed: 0}); onRoute("focus"); }}>
                <span style={{width:8,height:8,borderRadius:4,background:"var(--accent)"}} />
                Up next — <b style={{color:"var(--fg-0)", marginLeft:4}}>{nextTask.title}</b>
                <Icons.Arrow size={12} />
              </button>
            ) : (
              <button className="hero__next" onClick={() => dispatch({ quickAddOpen: true })}>
                <span style={{width:8,height:8,borderRadius:4,background:"var(--accent)"}} />
                No tasks yet — <b style={{color:"var(--fg-0)", marginLeft:4}}>add your first</b>
                <Icons.Arrow size={12} />
              </button>
            )}
          </div>

          <div style={{display:"flex", alignItems:"center", justifyContent:"center", gap: 30}}>
            <div className="focus-ring">
              <svg viewBox="0 0 160 160">
                <circle className="focus-ring__track" cx="80" cy="80" r="70" fill="none" strokeWidth="6"/>
                <circle className="focus-ring__bar" cx="80" cy="80" r="70" fill="none" strokeWidth="6"
                  strokeDasharray={c} strokeDashoffset={offset}/>
              </svg>
              <div className="focus-ring__center">
                <div>
                  <div className="focus-ring__num">{focusHours.toFixed(1)}<span style={{fontSize: 18, color:"var(--fg-3)"}}>h</span></div>
                  <div className="focus-ring__lbl">Focus · goal {goalHours}h</div>
                </div>
              </div>
            </div>

            <div className="hero__stats">
              <div className="stat">
                <div className="stat__label">Sessions</div>
                <div className="stat__num">{sessionsToday}</div>
                <div className="stat__delta">today</div>
              </div>
              <div className="stat">
                <div className="stat__label">Done</div>
                <div className="stat__num">{doneCount}</div>
                <div className="stat__delta">all time</div>
              </div>
              <div className="stat">
                <div className="stat__label">In matrix</div>
                <div className="stat__num">{total}</div>
                <div className="stat__delta stat__delta--down">{doNow.length} urgent</div>
              </div>
              <div className="stat">
                <div className="stat__label">Planned</div>
                <div className="stat__num">{plan.length}</div>
                <div className="stat__delta">to schedule</div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's schedule */}
        <div className="card">
          <div className="card__head">
            <div className="card__title">Today</div>
            <div className="card__kicker">{todayLabel}</div>
          </div>
          <div className="card__body">
            <div className="today-list">
              {schedule.length === 0 && (
                <div style={{color:"var(--fg-3)", fontSize:13, padding:"8px 4px"}}>
                  Nothing on the calendar for today. Add events in Calendar.
                </div>
              )}
              {schedule.map((r, i) => (
                <div key={i} className={`today-row ${r.past ? "today-row--past" : ""} ${r.now ? "today-row--now" : ""}`}>
                  <div className="today-row__time">{r.time}</div>
                  <div className="today-row__bar" />
                  <div>
                    <div className="today-row__title">{r.title}</div>
                    <div className="today-row__meta">{r.meta}</div>
                  </div>
                  {r.now && <span className="chip chip--accent chip--dot">Now</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Do now */}
        <div className="card">
          <div className="card__head">
            <div className="card__title">Do now</div>
            <div className="card__kicker" style={{color: "var(--q-do)"}}>Important · Urgent</div>
          </div>
          <div className="card__body" style={{display:"flex", flexDirection:"column", gap:8}}>
            {doNow.slice(0,3).map(t => (
              <TaskCard key={t.id} task={t}
                onStart={(id) => { dispatch({focusTaskId: id, focusRunning: true, focusStartedAt: Date.now(), focusElapsed: 0}); onRoute("focus"); }}
                onComplete={(id) => dispatch(s => ({
                  tasks: s.tasks.filter(x => x.id !== id),
                  completed: [{id:"c"+Date.now(), title: s.tasks.find(x=>x.id===id).title, at: "Just now", sessions: 1}, ...s.completed]
                }))}
                onDragStart={onTaskDragStart}
                onDragEnd={onTaskDragEnd}
                isRunning={state.focusTaskId === t.id && state.focusRunning}
              />
            ))}
            <button className="btn btn--ghost btn--sm" style={{justifyContent:"flex-start", marginTop: 4}} onClick={() => onRoute("matrix")}>
              See all {state.tasks.length} in matrix <Icons.Arrow size={10}/>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
