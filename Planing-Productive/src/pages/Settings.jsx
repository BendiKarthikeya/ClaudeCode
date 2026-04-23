// ============================================================
// SETTINGS
// ============================================================
// Icons is on window
function Settings({ state, dispatch }) {
  const [t, setT] = React.useState(() => ({ ...window.__TWEAKS, ...(state.tweaks || {}) }));
  const [savedT, setSavedT] = React.useState(() => ({ ...window.__TWEAKS, ...(state.tweaks || {}) }));
  const [saveStatus, setSaveStatus] = React.useState("idle"); // idle | saving | saved
  const update = (patch) => {
    const next = { ...t, ...patch };
    setT(next); window.__TWEAKS = next; window.applyTweaks(next);
    try { window.parent.postMessage({type: "__edit_mode_set_keys", edits: patch}, "*"); } catch {}
  };
  const dirty = JSON.stringify(t) !== JSON.stringify(savedT);
  const saveAppearance = () => {
    setSaveStatus("saving");
    dispatch({ tweaks: t });
    setSavedT(t);
    setTimeout(() => setSaveStatus("saved"), 200);
    setTimeout(() => setSaveStatus("idle"), 1800);
  };
  const revertAppearance = () => {
    setT(savedT); window.__TWEAKS = savedT; window.applyTweaks(savedT);
  };

  const [section, setSection] = React.useState("appearance");

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__kicker">Preferences</div>
          <h1 className="page__title">Make it <em>yours.</em></h1>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-nav">
          {[
            {k:"appearance", l:"Appearance"},
            {k:"timer", l:"Pomodoro"},
            {k:"matrix", l:"Task matrix"},
            {k:"integrations", l:"Integrations"},
            {k:"keyboard", l:"Keyboard"},
            {k:"account", l:"Account"},
          ].map(s => (
            <button key={s.k} className="settings-nav__item" aria-current={section === s.k} onClick={() => setSection(s.k)}>
              {s.l}
            </button>
          ))}
        </div>

        <div className="settings-section">
          {section === "appearance" && (
            <div>
              <div className="settings-group__title">Appearance</div>
              <div className="settings-group__desc">How Lumen looks when you're working.</div>

              <div className="settings-row">
                <div>
                  <div className="settings-row__label">Theme</div>
                  <div className="settings-row__hint">Dark works well in low-light focus sessions.</div>
                </div>
                <div className="seg">
                  <button className="seg__b" aria-pressed={t.theme === "dark"}  onClick={() => update({theme:"dark"})}>Dark</button>
                  <button className="seg__b" aria-pressed={t.theme === "light"} onClick={() => update({theme:"light"})}>Light</button>
                </div>
              </div>

              <div className="settings-row">
                <div>
                  <div className="settings-row__label">Accent</div>
                  <div className="settings-row__hint">Used for buttons, highlights, and the timer ring.</div>
                </div>
                <div className="swatch-row">
                  {[
                    { k: "amber",  c: "oklch(0.80 0.14 72)" },
                    { k: "violet", c: "oklch(0.72 0.16 295)" },
                    { k: "mint",   c: "oklch(0.80 0.12 160)" },
                    { k: "coral",  c: "oklch(0.74 0.16 28)" },
                    { k: "sky",    c: "oklch(0.78 0.10 220)" },
                  ].map(s => (
                    <button key={s.k} className="swatch" style={{background: s.c}} aria-pressed={t.accent === s.k} onClick={() => update({accent:s.k})} />
                  ))}
                </div>
              </div>

              <div className="settings-row">
                <div>
                  <div className="settings-row__label">Typography</div>
                  <div className="settings-row__hint">Editorial uses Instrument Serif for display type.</div>
                </div>
                <div className="seg">
                  <button className="seg__b" aria-pressed={t.font==="editorial"} onClick={() => update({font:"editorial"})}>Editorial</button>
                  <button className="seg__b" aria-pressed={t.font==="modern"} onClick={() => update({font:"modern"})}>Modern</button>
                  <button className="seg__b" aria-pressed={t.font==="inter"} onClick={() => update({font:"inter"})}>Inter</button>
                </div>
              </div>

              <div className="settings-row">
                <div>
                  <div className="settings-row__label">Density</div>
                  <div className="settings-row__hint">Compact fits more on one screen.</div>
                </div>
                <div className="seg">
                  <button className="seg__b" aria-pressed={t.density==="comfortable"} onClick={() => update({density:"comfortable"})}>Comfortable</button>
                  <button className="seg__b" aria-pressed={t.density==="compact"} onClick={() => update({density:"compact"})}>Compact</button>
                </div>
              </div>

              <div style={{display:"flex", alignItems:"center", justifyContent:"flex-end", gap:10, marginTop:18, paddingTop:14, borderTop:"1px solid var(--line-soft)"}}>
                <span style={{fontFamily:"var(--font-mono)", fontSize:10, color: saveStatus === "saved" ? "var(--accent)" : "var(--fg-3)", letterSpacing:"0.12em", textTransform:"uppercase"}}>
                  {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : dirty ? "Unsaved changes" : "All changes saved"}
                </span>
                {dirty && <button className="btn btn--sm" onClick={revertAppearance}>Revert</button>}
                <button className="btn btn--sm btn--primary" onClick={saveAppearance} disabled={!dirty || saveStatus !== "idle"}>
                  Save
                </button>
              </div>
            </div>
          )}

          {section === "timer" && (
            <div>
              <div className="settings-group__title">Pomodoro</div>
              <div className="settings-group__desc">Default durations. You can override per-task.</div>

              <div className="settings-row">
                <div>
                  <div className="settings-row__label">Work duration</div>
                  <div className="settings-row__hint">{t.pomodoroWork} minutes</div>
                </div>
                <input type="range" min="10" max="60" step="5" value={t.pomodoroWork} onChange={(e) => update({pomodoroWork: +e.target.value})} />
              </div>

              <div className="settings-row">
                <div>
                  <div className="settings-row__label">Break</div>
                  <div className="settings-row__hint">{t.pomodoroBreak} minutes</div>
                </div>
                <input type="range" min="3" max="20" step="1" value={t.pomodoroBreak} onChange={(e) => update({pomodoroBreak: +e.target.value})} />
              </div>

              <div className="settings-row">
                <div>
                  <div className="settings-row__label">Auto-start next session</div>
                  <div className="settings-row__hint">Roll straight into work after a break.</div>
                </div>
                <div className="toggle" data-on="true" onClick={(e) => e.currentTarget.dataset.on = e.currentTarget.dataset.on === "true" ? "false" : "true"} />
              </div>
            </div>
          )}

          {section === "matrix" && (
            <div>
              <div className="settings-group__title">Task matrix</div>
              <div className="settings-group__desc">Rename quadrants or adopt a different vocabulary.</div>

              <div className="settings-row">
                <div>
                  <div className="settings-row__label">Label style</div>
                  <div className="settings-row__hint">Classic uses noun phrases; Verbs are action-oriented.</div>
                </div>
                <div className="seg">
                  <button className="seg__b" aria-pressed={t.quadrantLabels==="classic"} onClick={() => update({quadrantLabels:"classic"})}>Classic</button>
                  <button className="seg__b" aria-pressed={t.quadrantLabels==="verbs"} onClick={() => update({quadrantLabels:"verbs"})}>Verbs</button>
                </div>
              </div>

              {window.QUADRANTS.map(q => (
                <div key={q.key} className="settings-row">
                  <div>
                    <div className="settings-row__label" style={{display:"flex", alignItems:"center", gap:8}}>
                      <span style={{width:10,height:10,borderRadius:3,background:q.color}}/>
                      {q.title}
                    </div>
                    <div className="settings-row__hint">{q.verdict}</div>
                  </div>
                  <input defaultValue={q.title} style={{background:"var(--bg-2)", border:"1px solid var(--line-soft)", borderRadius:6, padding:"6px 10px", fontSize: 13, width: 180, color:"var(--fg-0)"}} />
                </div>
              ))}
            </div>
          )}

          {section === "integrations" && (
            <div>
              <div className="settings-group__title">Integrations</div>
              <div className="settings-group__desc">No third-party integrations are connected. Real Google Calendar / Slack / Linear sync requires OAuth credentials that haven't been configured for this app.</div>
            </div>
          )}

          {section === "keyboard" && (
            <div>
              <div className="settings-group__title">Keyboard</div>
              <div className="settings-group__desc">Lumen is built for people who live at the keys.</div>
              {[
                {k: "⌘ K", l: "Quick add / command"},
                {k: "1 2 3 4 5", l: "Jump to page"},
                {k: "Space", l: "Start / pause focus (anywhere)"},
                {k: "Esc",  l: "Exit focus mode"},
                {k: "⌘ ⇧ F", l: "Drop straight into focus"},
                {k: "⌘ /", l: "Open Tweaks"},
              ].map(s => (
                <div key={s.k} className="settings-row">
                  <div className="settings-row__label">{s.l}</div>
                  <span className="kbd">{s.k}</span>
                </div>
              ))}
            </div>
          )}

          {section === "account" && <AccountSection state={state} dispatch={dispatch} />}
          {false && (
            <div>
                <div className="settings-group__title">Account</div>
                <div className="settings-group__desc">Synced to the cloud — log in on any device.</div>
                <div className="settings-row">
                  <div>
                    <div className="settings-row__label">Name</div>
                    <div className="settings-row__hint">{name}</div>
                  </div>
                </div>
                <div className="settings-row">
                  <div>
                    <div className="settings-row__label">Email</div>
                    <div className="settings-row__hint">{email}</div>
                  </div>
                </div>
                <div className="settings-row">
                  <div>
                    <div className="settings-row__label">Export data</div>
                    <div className="settings-row__hint">JSON of all tasks, sessions, and events.</div>
                  </div>
                  <button className="btn" onClick={() => {
                    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `lumen-${email}.json`; a.click();
                    URL.revokeObjectURL(url);
                  }}>Download</button>
                </div>
                <div className="settings-row">
                  <div>
                    <div className="settings-row__label" style={{color:"var(--danger)"}}>Clear all data</div>
                    <div className="settings-row__hint">Delete all tasks, completed items, and events for this account.</div>
                  </div>
                  <button className="btn" onClick={() => {
                    if (!confirm("Delete all your tasks, completed items, and events? This cannot be undone.")) return;
                    dispatch({ tasks: [], completed: [], events: [], focusTaskId: null, focusRunning: false, focusElapsed: 0, focusSessionsDone: 0 });
                  }}>Clear</button>
                </div>
                <div className="settings-row">
                  <div>
                    <div className="settings-row__label">Log out</div>
                    <div className="settings-row__hint">You can log back in anytime.</div>
                  </div>
                  <button className="btn" onClick={() => logout()}>Log out</button>
                </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AccountSection({ state, dispatch }) {
  const [u, setU] = React.useState(null);
  React.useEffect(() => { getCurrentUser().then(setU); }, []);
  const email = u?.email || "—";
  const name = u?.user_metadata?.name || (u?.email ? u.email.split("@")[0] : "—");
  return (
    <div>
      <div className="settings-group__title">Account</div>
      <div className="settings-group__desc">Synced to the cloud — log in on any device.</div>
      <div className="settings-row">
        <div>
          <div className="settings-row__label">Name</div>
          <div className="settings-row__hint">{name}</div>
        </div>
      </div>
      <div className="settings-row">
        <div>
          <div className="settings-row__label">Email</div>
          <div className="settings-row__hint">{email}</div>
        </div>
      </div>
      <div className="settings-row">
        <div>
          <div className="settings-row__label">Export data</div>
          <div className="settings-row__hint">JSON of all tasks, sessions, and events.</div>
        </div>
        <button className="btn" onClick={() => {
          const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = `lumen-${email}.json`; a.click();
          URL.revokeObjectURL(url);
        }}>Download</button>
      </div>
      <div className="settings-row">
        <div>
          <div className="settings-row__label" style={{color:"var(--danger)"}}>Clear all data</div>
          <div className="settings-row__hint">Delete all tasks, completed items, and events for this account.</div>
        </div>
        <button className="btn" onClick={() => {
          if (!confirm("Delete all your tasks, completed items, and events? This cannot be undone.")) return;
          dispatch({ tasks: [], completed: [], events: [], focusTaskId: null, focusRunning: false, focusElapsed: 0, focusSessionsDone: 0 });
        }}>Clear</button>
      </div>
      <div className="settings-row">
        <div>
          <div className="settings-row__label">Log out</div>
          <div className="settings-row__hint">You can log back in anytime.</div>
        </div>
        <button className="btn" onClick={() => logout()}>Log out</button>
      </div>
    </div>
  );
}

window.Settings = Settings;
