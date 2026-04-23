// ============================================================
// TWEAKS — in-design tweak panel wired to host Edit Mode
// ============================================================

// Icons is on window
function applyTweaks(t) {
  const html = document.documentElement;
  html.setAttribute("data-theme", t.theme || "dark");
  html.setAttribute("data-accent", t.accent || "amber");
  html.setAttribute("data-font", t.font || "editorial");
  html.setAttribute("data-density", t.density || "comfortable");
}

function TweaksPanel({ onClose }) {
  const [t, setT] = React.useState(window.__TWEAKS);

  const update = (patch) => {
    const next = { ...t, ...patch };
    setT(next);
    window.__TWEAKS = next;
    applyTweaks(next);
    try {
      window.parent.postMessage({ type: "__edit_mode_set_keys", edits: patch }, "*");
    } catch {}
  };

  return (
    <div className="tweaks">
      <div className="tweaks__head">
        <Icons.Sparkle size={14} />
        <div className="tweaks__title">Tweaks</div>
        <button className="btn btn--ghost btn--sm" style={{marginLeft: "auto"}} onClick={onClose}>
          <Icons.X size={12}/>
        </button>
      </div>
      <div className="tweaks__body">
        <div className="tweaks__row">
          <div>
            <div className="tweaks__lbl">Theme</div>
            <div className="tweaks__hint">Appearance</div>
          </div>
          <div className="seg">
            <button className="seg__b" aria-pressed={t.theme === "dark"}  onClick={() => update({ theme: "dark" })}>Dark</button>
            <button className="seg__b" aria-pressed={t.theme === "light"} onClick={() => update({ theme: "light" })}>Light</button>
          </div>
        </div>

        <div className="tweaks__row">
          <div>
            <div className="tweaks__lbl">Accent</div>
            <div className="tweaks__hint">Highlight color</div>
          </div>
          <div className="swatch-row">
            {[
              { k: "amber",  c: "oklch(0.80 0.14 72)" },
              { k: "violet", c: "oklch(0.72 0.16 295)" },
              { k: "mint",   c: "oklch(0.80 0.12 160)" },
              { k: "coral",  c: "oklch(0.74 0.16 28)" },
              { k: "sky",    c: "oklch(0.78 0.10 220)" },
            ].map(s => (
              <button key={s.k} className="swatch" style={{background: s.c}} aria-pressed={t.accent === s.k} onClick={() => update({ accent: s.k })} />
            ))}
          </div>
        </div>

        <div className="tweaks__row">
          <div>
            <div className="tweaks__lbl">Type</div>
            <div className="tweaks__hint">Font pairing</div>
          </div>
          <div className="seg">
            <button className="seg__b" aria-pressed={t.font === "editorial"} onClick={() => update({ font: "editorial" })}>Editorial</button>
            <button className="seg__b" aria-pressed={t.font === "modern"} onClick={() => update({ font: "modern" })}>Modern</button>
            <button className="seg__b" aria-pressed={t.font === "inter"} onClick={() => update({ font: "inter" })}>Inter</button>
          </div>
        </div>

        <div className="tweaks__row">
          <div>
            <div className="tweaks__lbl">Density</div>
            <div className="tweaks__hint">Compact vs. comfortable</div>
          </div>
          <div className="seg">
            <button className="seg__b" aria-pressed={t.density === "comfortable"} onClick={() => update({ density: "comfortable" })}>Comfort</button>
            <button className="seg__b" aria-pressed={t.density === "compact"} onClick={() => update({ density: "compact" })}>Compact</button>
          </div>
        </div>

        <div className="tweaks__row">
          <div>
            <div className="tweaks__lbl">Pomodoro work</div>
            <div className="tweaks__hint">{t.pomodoroWork} min</div>
          </div>
          <input type="range" min="10" max="60" step="5" value={t.pomodoroWork} onChange={(e) => update({ pomodoroWork: +e.target.value })} />
        </div>

        <div className="tweaks__row">
          <div>
            <div className="tweaks__lbl">Pomodoro break</div>
            <div className="tweaks__hint">{t.pomodoroBreak} min</div>
          </div>
          <input type="range" min="3" max="20" step="1" value={t.pomodoroBreak} onChange={(e) => update({ pomodoroBreak: +e.target.value })} />
        </div>

        <div className="tweaks__row">
          <div>
            <div className="tweaks__lbl">Quadrant labels</div>
            <div className="tweaks__hint">Naming style</div>
          </div>
          <div className="seg">
            <button className="seg__b" aria-pressed={t.quadrantLabels === "classic"} onClick={() => update({ quadrantLabels: "classic" })}>Classic</button>
            <button className="seg__b" aria-pressed={t.quadrantLabels === "verbs"} onClick={() => update({ quadrantLabels: "verbs" })}>Verbs</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// init on load
applyTweaks(window.__TWEAKS);

Object.assign(window, { TweaksPanel, applyTweaks });
