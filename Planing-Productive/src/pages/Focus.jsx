// ============================================================
// FOCUS mode — Pomodoro timer, ambient background
// ============================================================
// Icons is on window
function Focus({ state, dispatch, onRoute }) {
  const task = state.tasks.find(t => t.id === state.focusTaskId);
  const workMin = window.__TWEAKS?.pomodoroWork ?? 25;
  const breakMin = window.__TWEAKS?.pomodoroBreak ?? 5;

  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!state.focusRunning) return;
    const iv = setInterval(() => {
      dispatch(s => ({ focusElapsed: (s.focusElapsed || 0) + 1 }));
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(iv);
  }, [state.focusRunning]);

  const totalSec = (state.focusMode === "work" ? workMin : breakMin) * 60;
  const remain = Math.max(0, totalSec - state.focusElapsed);
  const min = Math.floor(remain / 60);
  const sec = remain % 60;
  const pct = Math.min(1, state.focusElapsed / totalSec);

  const c = 2 * Math.PI * 160;
  const offset = c * (1 - pct);

  // if no running task, show a pick-task state
  if (!task) {
    const candidates = state.tasks.filter(t => t.quadrant === "do" || t.quadrant === "plan").slice(0, 4);
    return (
      <div className="focus-page">
        <div className="focus-top">
          <div className="focus-kicker">Focus · idle</div>
          <div className="focus-escape">press <span className="kbd">Esc</span> anytime</div>
        </div>
        <div className="focus-center">
          <div className="focus-task">Choose a task to begin</div>
          <h1 className="focus-title" style={{fontSize: 44}}>What deserves this <em>hour?</em></h1>
          <div style={{display:"flex", flexDirection:"column", gap: 10, width: "min(540px, 90%)"}}>
            {candidates.map(t => (
              <button key={t.id}
                onClick={() => dispatch({focusTaskId: t.id, focusRunning: true, focusStartedAt: Date.now(), focusElapsed: 0, focusMode: "work"})}
                style={{
                  display:"flex", alignItems:"center", gap: 14,
                  padding: "14px 18px", textAlign: "left",
                  background: "color-mix(in oklab, var(--bg-1) 70%, transparent)",
                  border: "1px solid var(--line-soft)", borderRadius: 12,
                  backdropFilter: "blur(10px)", color: "var(--fg-0)",
                }}>
                <Icons.Play size={12} />
                <div style={{flex:1}}>
                  <div style={{fontSize: 14}}>{t.title}</div>
                  <div style={{fontFamily:"var(--font-mono)", fontSize: 10, color:"var(--fg-3)", letterSpacing:"0.12em", textTransform:"uppercase", marginTop: 3}}>
                    {window.QUADRANTS.find(q => q.key === t.quadrant)?.title} · {t.duration || 25}m
                  </div>
                </div>
                <Icons.Arrow size={14} />
              </button>
            ))}
          </div>
        </div>
        <div className="focus-bottom">
          <div className="focus-stat"><div className="focus-stat__lbl">Sessions today</div><div className="focus-stat__val">{state.focusSessionsDone}</div></div>
          <div className="focus-stat"><div className="focus-stat__lbl">Current streak</div><div className="focus-stat__val">12 days</div></div>
          <div className="focus-stat"><div className="focus-stat__lbl">Goal</div><div className="focus-stat__val">4 h</div></div>
        </div>
      </div>
    );
  }

  const accumulateFocus = (s) => {
    if (s.focusMode !== "work" || !s.focusTaskId || !s.focusElapsed) return s.tasks;
    return s.tasks.map(t => t.id === s.focusTaskId ? { ...t, focusSecs: (t.focusSecs || 0) + s.focusElapsed } : t);
  };
  const stop = () => dispatch(s => ({
    tasks: accumulateFocus(s),
    focusTaskId: null, focusRunning: false, focusElapsed: 0,
  }));
  const toggle = () => dispatch({ focusRunning: !state.focusRunning });
  const skip = () => dispatch(s => ({
    tasks: accumulateFocus(s),
    focusMode: s.focusMode === "work" ? "break" : "work",
    focusElapsed: 0,
    focusSessionsDone: s.focusMode === "work" ? s.focusSessionsDone + 1 : s.focusSessionsDone,
  }));

  return (
    <div className="focus-page">
      <div className="focus-top">
        <div className="focus-kicker">{state.focusMode === "work" ? "Deep work" : "Break"} · session {state.focusSessionsDone + 1}</div>
        <button className="focus-escape" onClick={() => onRoute("matrix")}>
          <Icons.X size={14}/> exit focus
        </button>
      </div>

      <div className="focus-center">
        <div className="focus-task">
          {state.focusMode === "work" ? "Working on" : "Break — don't touch it"}
        </div>
        <h1 className="focus-title">{task.title}</h1>

        <div className="focus-clock">
          <svg viewBox="0 0 360 360">
            <circle className="focus-clock__track" cx="180" cy="180" r="160" fill="none" strokeWidth="8"/>
            <circle
              className={`focus-clock__bar ${state.focusMode === "break" ? "focus-clock__bar--break" : ""}`}
              cx="180" cy="180" r="160" fill="none" strokeWidth="8"
              strokeDasharray={c} strokeDashoffset={offset}
            />
          </svg>
          <div className="focus-clock__num">
            <div>
              <div className="focus-clock__num-main">{String(min).padStart(2,"0")}:{String(sec).padStart(2,"0")}</div>
              <div className="focus-clock__num-lbl">{state.focusMode === "work" ? `${workMin}-min pomodoro` : `${breakMin}-min break`}</div>
            </div>
          </div>
        </div>

        <div className="session-dots">
          {[0,1,2,3].map(i => (
            <div key={i}
              className={`session-dots__dot ${i < state.focusSessionsDone ? "is-done" : ""} ${i === state.focusSessionsDone ? "is-active" : ""}`} />
          ))}
        </div>

        <div className="focus-ctrl">
          <button className="btn" onClick={skip}>
            <Icons.ChevR size={12} /> Skip {state.focusMode === "work" ? "to break" : "break"}
          </button>
          <button className="focus-ctrl__primary" onClick={toggle} aria-label="Play/Pause">
            {state.focusRunning ? <Icons.Pause size={20}/> : <Icons.Play size={16}/>}
          </button>
          <button className="btn" onClick={stop}>
            <Icons.Stop size={10} /> End session
          </button>
        </div>
      </div>

      <div className="focus-bottom">
        <div className="focus-stat">
          <div className="focus-stat__lbl">Sessions today</div>
          <div className="focus-stat__val">{state.focusSessionsDone}</div>
        </div>
        <div className="focus-stat">
          <div className="focus-stat__lbl">Elapsed on task</div>
          <div className="focus-stat__val">{Math.floor(state.focusElapsed/60)}m {state.focusElapsed%60}s</div>
        </div>
        <div className="focus-stat">
          <div className="focus-stat__lbl">Next up</div>
          <div className="focus-stat__val" style={{fontSize: 16}}>
            {state.tasks.filter(t => t.quadrant === "do" && t.id !== task.id)[0]?.title?.slice(0, 34) || "—"}
            {state.tasks.filter(t => t.quadrant === "do" && t.id !== task.id)[0]?.title?.length > 34 ? "…" : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

window.Focus = Focus;
