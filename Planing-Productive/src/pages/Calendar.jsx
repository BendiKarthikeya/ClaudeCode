// ============================================================
// CALENDAR — Week view with GCal connect flow
// ============================================================
// Icons is on window
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates() {
  const today = new Date();
  const dow = today.getDay() === 0 ? 6 : today.getDay() - 1; // 0=Mon
  const monday = new Date(today); monday.setDate(today.getDate() - dow);
  return Array.from({length:7}, (_,i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i); return d.getDate();
  });
}

function Calendar({ state, dispatch }) {
  const _now = new Date();
  const [nowMin, setNowMin] = React.useState(_now.getHours()*60 + _now.getMinutes());
  const [gEvents, setGEvents] = React.useState([]);
  const [gStatus, setGStatus] = React.useState("idle"); // idle | loading | connected | error
  const [gError, setGError] = React.useState("");

  React.useEffect(() => {
    const id = setInterval(() => { const n = new Date(); setNowMin(n.getHours()*60 + n.getMinutes()); }, 60000);
    return () => clearInterval(id);
  }, []);

  const fetchGoogleEvents = React.useCallback(async (token) => {
    const monday = new Date(); monday.setDate(monday.getDate() - ((monday.getDay() === 0 ? 6 : monday.getDay() - 1)));
    monday.setHours(0,0,0,0);
    const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 7);
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${monday.toISOString()}&timeMax=${sunday.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=100`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Google API ${res.status}`);
    const data = await res.json();
    return (data.items || []).filter(it => it.start?.dateTime).map(it => {
      const s = new Date(it.start.dateTime), e = new Date(it.end.dateTime);
      const day = s.getDay() === 0 ? 6 : s.getDay() - 1;
      const start = s.getHours() + s.getMinutes()/60;
      const end = e.getHours() + e.getMinutes()/60;
      return { id: "g_"+it.id, day, start, end, title: it.summary || "(no title)", kind: "gcal", readonly: true };
    });
  }, []);

  const getGoogleToken = React.useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        reject(new Error("Google Identity Services not loaded yet — reload the page"));
        return;
      }
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: window.__GCAL_CLIENT_ID,
        scope: "https://www.googleapis.com/auth/calendar.readonly",
        prompt: window.__GCAL_TOKEN ? "" : "consent",
        callback: (resp) => {
          if (resp.error) return reject(new Error(resp.error));
          window.__GCAL_TOKEN = resp.access_token;
          window.__GCAL_TOKEN_EXP = Date.now() + (resp.expires_in - 60) * 1000;
          resolve(resp.access_token);
        },
        error_callback: (err) => reject(new Error(err?.type || "Google auth failed")),
      });
      tokenClient.requestAccessToken();
    });
  }, []);

  const connectGoogle = async () => {
    setGError(""); setGStatus("loading");
    try {
      const token = (window.__GCAL_TOKEN && Date.now() < (window.__GCAL_TOKEN_EXP || 0))
        ? window.__GCAL_TOKEN
        : await getGoogleToken();
      const evs = await fetchGoogleEvents(token);
      setGEvents(evs); setGStatus("connected");
    } catch (e) { setGStatus("error"); setGError(e.message); }
  };

  // Auto-reconnect if we already have a valid token in this session
  React.useEffect(() => {
    if (!window.__GCAL_TOKEN || Date.now() >= (window.__GCAL_TOKEN_EXP || 0)) return;
    setGStatus("loading");
    fetchGoogleEvents(window.__GCAL_TOKEN)
      .then(evs => { setGEvents(evs); setGStatus("connected"); })
      .catch(e => { setGStatus("error"); setGError(e.message); });
  }, [fetchGoogleEvents]);

  const disconnectGoogle = () => {
    if (window.__GCAL_TOKEN && window.google?.accounts?.oauth2) {
      try { window.google.accounts.oauth2.revoke(window.__GCAL_TOKEN, () => {}); } catch {}
    }
    window.__GCAL_TOKEN = null;
    window.__GCAL_TOKEN_EXP = 0;
    setGEvents([]); setGStatus("idle");
  };

  const DATES = getWeekDates();

  const startHour = 7;
  const endHour = 20;
  const hourH = 56;

  const handleEventDragStart = (e, ev) => {
    e.dataTransfer.effectAllowed = "move";
    window.dragState.task = { kind: "event", ...ev };
    e.currentTarget.classList.add("is-dragging");
  };
  const handleEventDragEnd = (e) => {
    e.currentTarget.classList.remove("is-dragging");
    window.dragState.task = null;
  };

  const handleColDrop = (e, dayIdx) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const hoursFromStart = y / hourH;
    const newStart = Math.round((startHour + hoursFromStart) * 2) / 2;
    const d = window.dragState.task;
    if (!d) return;
    if (d.kind === "event") {
      const len = d.end - d.start;
      dispatch(s => ({
        events: s.events.map(ev => ev.id === d.id ? { ...ev, day: dayIdx, start: newStart, end: newStart + len } : ev)
      }));
    } else {
      // task dropped onto calendar — schedule it
      dispatch(s => ({
        events: [...s.events, {
          id: "e" + Date.now(), day: dayIdx, start: newStart, end: newStart + ((d.duration || 25) / 60),
          title: d.title, kind: "task"
        }]
      }));
    }
    window.dragState.task = null;
  };

  const nowTopPx = ((nowMin/60) - startHour) * hourH;
  const _d = new Date();
  const todayIdx = _d.getDay() === 0 ? 6 : _d.getDay() - 1;
  const weekLabel = new Date(); weekLabel.setDate(weekLabel.getDate() - todayIdx);
  const monthLabel = weekLabel.toLocaleDateString(undefined, { month: "long", day: "numeric" });

  const [creating, setCreating] = React.useState(null); // {day, start, end}
  const [draft, setDraft] = React.useState(null); // {day, start, end}
  const onColMouseDown = (e, dayIdx, hourIdx) => {
    if (e.button !== 0) return;
    if (e.target.closest(".cal-event")) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const y0 = e.clientY - rect.top;
    const start = startHour + hourIdx + Math.round((y0 / hourH) * 2) / 2;
    setCreating({ day: dayIdx, start, end: start + 0.5, originRect: rect, startY: rect.top + (start - startHour - hourIdx) * hourH });
  };
  React.useEffect(() => {
    if (!creating) return;
    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ns-resize";
    const move = (ev) => {
      ev.preventDefault();
      const absEnd = startHour + Math.max(0.5, Math.round(((ev.clientY - creating.originRect.top) / hourH) * 2) / 2);
      setCreating(c => c ? { ...c, end: Math.max(c.start + 0.5, absEnd) } : c);
    };
    const up = () => {
      const c = creating;
      setCreating(null);
      if (!c) return;
      setDraft({ day: c.day, start: c.start, end: c.end });
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
    };
  }, [creating]);

  const commitDraft = ({ title, quadrant, addTask }) => {
    if (!draft || !title.trim()) { setDraft(null); return; }
    const id = "e" + Date.now();
    dispatch(s => {
      const patch = { events: [...s.events, { id, day: draft.day, start: draft.start, end: draft.end, title: title.trim(), kind: "task" }] };
      if (addTask) {
        const durationMin = Math.round((draft.end - draft.start) * 60);
        const dueLabel = `${DAYS[draft.day]} ${fmtTime(draft.start)}`;
        patch.tasks = [...s.tasks, { id: "t" + Date.now(), title: title.trim(), quadrant, due: dueLabel, duration: durationMin, createdAt: Date.now() }];
      }
      return patch;
    });
    setDraft(null);
  };

  const deleteEvent = (id) => {
    if (!confirm("Delete this event?")) return;
    dispatch(s => ({ events: s.events.filter(e => e.id !== id) }));
  };

  const addEvent = () => {
    const title = prompt("Event title?");
    if (!title) return;
    const dayStr = prompt("Day? 0=Mon … 6=Sun", String(todayIdx));
    const day = Math.max(0, Math.min(6, parseInt(dayStr,10) || todayIdx));
    const startStr = prompt("Start hour (e.g. 14 or 14.5)?", "10");
    const start = Math.max(0, Math.min(23.5, parseFloat(startStr) || 10));
    const durStr = prompt("Duration in minutes?", "60");
    const dur = Math.max(5, parseInt(durStr,10) || 60);
    dispatch(s => ({ events: [...s.events, { id: "e"+Date.now(), day, start, end: start + dur/60, title, kind: "gcal" }] }));
  };

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__kicker">Calendar · {state.events.length} events this week</div>
          <h1 className="page__title">Week of <em>{monthLabel}</em></h1>
        </div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          {gStatus === "connected" ? (
            <button className="btn btn--sm" onClick={disconnectGoogle} title={`${gEvents.length} events from Google`}>
              <Icons.Google size={14}/> <span style={{marginLeft:6}}>Disconnect Google</span>
            </button>
          ) : (
            <button className="btn btn--sm" onClick={connectGoogle} disabled={gStatus === "loading"}>
              <Icons.Google size={14}/> <span style={{marginLeft:6}}>{gStatus === "loading" ? "Loading…" : "Connect Google"}</span>
            </button>
          )}
          <button className="btn" onClick={addEvent}>
            <Icons.Plus size={12}/> New event
          </button>
        </div>
      </div>

      <div className="cal-grid">
        <div className="cal-head">
          <div className="cal-head__spacer"></div>
          {DAYS.map((d, i) => (
            <div key={d} className={`cal-head__day ${i === todayIdx ? "is-today" : ""}`}>
              <div className="cal-head__day-name">{d}</div>
              <div className="cal-head__day-num">{DATES[i]}</div>
            </div>
          ))}
        </div>

        <div className="cal-body">
          {[...Array(endHour - startHour)].map((_, i) => (
            <React.Fragment key={i}>
              <div className="cal-hour">{fmtHour(startHour + i)}</div>
              {DAYS.map((d, di) => (
                <div
                  key={di}
                  className="cal-col"
                  style={{ gridColumn: di + 2, gridRow: i + 2, height: hourH, borderBottom: "1px solid var(--line-soft)" }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleColDrop(e, di)}
                  onMouseDown={(e) => onColMouseDown(e, di, i)}
                >
                  {creating && creating.day === di && creating.start >= startHour + i && creating.start < startHour + i + 1 && (
                    <div style={{position:"absolute", left:2, right:2, top:(creating.start - (startHour + i)) * hourH, height: Math.max(6, (creating.end - creating.start) * hourH - 2), background:"color-mix(in oklab, var(--accent) 40%, transparent)", border:"1px dashed var(--accent)", borderRadius:4, pointerEvents:"none", zIndex:3}} />
                  )}
                  {/* render events that start in this hour+day */}
                  {[...state.events, ...gEvents]
                    .filter(ev => ev.day === di && ev.start >= startHour + i && ev.start < startHour + i + 1)
                    .map(ev => {
                      const topPx = (ev.start - (startHour + i)) * hourH;
                      const heightPx = (ev.end - ev.start) * hourH - 4;
                      return (
                        <div
                          key={ev.id}
                          className={`cal-event cal-event--${ev.kind}`}
                          style={{ top: topPx, height: heightPx, opacity: ev.readonly ? 0.85 : 1 }}
                          draggable={!ev.readonly}
                          onDragStart={(e) => !ev.readonly && handleEventDragStart(e, ev)}
                          onDragEnd={handleEventDragEnd}
                          onDoubleClick={() => !ev.readonly && deleteEvent(ev.id)}
                          title={ev.readonly ? "From Google Calendar (read-only)" : "Double-click to delete"}
                        >
                          <div className="cal-event__title">{ev.title}</div>
                          <div className="cal-event__time">{fmtTime(ev.start)} – {fmtTime(ev.end)}</div>
                        </div>
                      );
                    })
                  }
                  {/* now line on today, in the right hour */}
                  {di === todayIdx && nowMin/60 >= startHour + i && nowMin/60 < startHour + i + 1 && (
                    <div className="now-line" style={{ top: (nowMin/60 - (startHour + i)) * hourH }} />
                  )}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Click-drag on empty space to create · drag events to reschedule · double-click to delete
        {gStatus === "connected" && <span style={{marginLeft:12, color:"var(--fg-2)"}}>· {gEvents.length} events from Google this week</span>}
        {gError && <span style={{marginLeft:12, color:"var(--danger)"}}>· {gError}</span>}
      </div>

      {draft && (
        <CalendarDraftModal
          draft={draft}
          onCancel={() => setDraft(null)}
          onSubmit={commitDraft}
        />
      )}
    </div>
  );
}

function CalendarDraftModal({ draft, onCancel, onSubmit }) {
  const [title, setTitle] = React.useState("");
  const [addTask, setAddTask] = React.useState(false);
  const [quadrant, setQuadrant] = React.useState("plan");
  const inputRef = React.useRef();

  React.useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = () => onSubmit({ title, quadrant, addTask });
  const durMin = Math.round((draft.end - draft.start) * 60);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="qa">
        <div style={{padding:"12px 14px 0", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <div style={{fontFamily:"var(--font-mono)", fontSize:10, color:"var(--fg-3)", letterSpacing:"0.12em", textTransform:"uppercase"}}>
            New block · {DAYS[draft.day]} · {fmtTime(draft.start)} – {fmtTime(draft.end)} · {durMin}m
          </div>
        </div>
        <input
          ref={inputRef}
          className="qa__input"
          placeholder="What are you scheduling?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <div className="qa__divider" />
        <div style={{padding:"10px 14px", display:"flex", alignItems:"center", gap:10}}>
          <label style={{display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:12, color:"var(--fg-1)"}}>
            <input type="checkbox" checked={addTask} onChange={(e) => setAddTask(e.target.checked)} />
            Also add to task matrix
          </label>
        </div>
        {addTask && (
          <>
            <div className="qa__divider" />
            <div className="qa__picker">
              {window.QUADRANTS.map((q) => (
                <button key={q.key} className="qa__pick" aria-pressed={quadrant === q.key} onClick={() => setQuadrant(q.key)}>
                  <span style={{width: 8, height: 8, borderRadius: 2, background: q.color, display: "inline-block"}} />
                  {q.title}
                </button>
              ))}
            </div>
          </>
        )}
        <div className="qa__foot">
          <span><b>↵</b> Create</span>
          <span><b>Esc</b> Cancel</span>
          <span style={{marginLeft:"auto", display:"flex", gap:8}}>
            <button className="btn btn--sm" onClick={onCancel}>Cancel</button>
            <button className="btn btn--sm btn--primary" onClick={submit} disabled={!title.trim()}>Add to calendar</button>
          </span>
        </div>
      </div>
    </div>
  );
}

function fmtHour(h) {
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${h < 12 ? "AM" : "PM"}`;
}
function fmtTime(h) {
  const hr = Math.floor(h);
  const m = Math.round((h - hr) * 60);
  const ampm = hr >= 12 ? "PM" : "AM";
  const hh = hr % 12 === 0 ? 12 : hr % 12;
  return `${hh}:${String(m).padStart(2,"0")} ${ampm}`;
}


window.Calendar = Calendar;
