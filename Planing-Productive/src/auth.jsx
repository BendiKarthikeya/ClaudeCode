// ============================================================
// AUTH — Supabase-backed (email + password)
// ============================================================

async function signup({ name, email, password }) {
  email = email.trim().toLowerCase();
  if (!email || !password) throw new Error("Email and password required.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");
  const { data, error } = await sb.auth.signUp({
    email, password,
    options: { data: { name: (name || "").trim() || email.split("@")[0] } },
  });
  if (error) throw error;
  return data.user;
}

async function loginApi({ email, password }) {
  email = email.trim().toLowerCase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

async function logout() {
  await sb.auth.signOut();
  location.reload();
}

async function getCurrentUser() {
  const { data } = await sb.auth.getUser();
  return data?.user || null;
}

async function signInWithGoogle() {
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
  if (error) throw error;
}

async function resetPassword(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase());
  if (error) throw error;
}

function AuthScreen({ onAuthed }) {
  const [mode, setMode] = React.useState("login");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [err, setErr] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg(""); setBusy(true);
    try {
      if (mode === "signup") {
        await signup({ name, email, password });
        setMsg("Account created. Check your email if confirmation is required, then log in.");
        setMode("login");
      } else {
        await loginApi({ email, password });
        onAuthed();
      }
    } catch (ex) {
      setErr(ex.message || String(ex));
    } finally {
      setBusy(false);
    }
  };

  const onReset = async () => {
    setErr(""); setMsg("");
    if (!email) { setErr("Enter your email above first."); return; }
    try { await resetPassword(email); setMsg("Password reset email sent."); }
    catch (ex) { setErr(ex.message || String(ex)); }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">Lumen</div>
        <div className="auth-tag">Focus, matter, finish.</div>

        <div className="auth-tabs">
          <button type="button" className={"auth-tab" + (mode === "login" ? " is-active" : "")} onClick={() => { setMode("login"); setErr(""); setMsg(""); }}>Log in</button>
          <button type="button" className={"auth-tab" + (mode === "signup" ? " is-active" : "")} onClick={() => { setMode("signup"); setErr(""); setMsg(""); }}>Sign up</button>
        </div>

        {mode === "signup" && (
          <label className="auth-field">
            <span>Name</span>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoFocus />
          </label>
        )}
        <label className="auth-field">
          <span>Email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus={mode === "login"} />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
        </label>

        {err && <div className="auth-err">{err}</div>}
        {msg && <div className="auth-msg">{msg}</div>}

        <button type="submit" className="btn btn--primary auth-submit" disabled={busy}>
          {busy ? "…" : (mode === "signup" ? "Create account" : "Log in")}
        </button>

        <div className="auth-divider"><span>or</span></div>

        <button
          type="button"
          className="btn auth-google"
          onClick={async () => {
            setErr(""); setMsg(""); setBusy(true);
            try { await signInWithGoogle(); }
            catch (ex) { setErr(ex.message || String(ex)); setBusy(false); }
          }}
          disabled={busy}
        >
          <Icons.Google size={16} />
          <span>Continue with Google</span>
        </button>

        <div className="auth-hint">
          {mode === "login"
            ? <>No account? <a href="#" onClick={(e) => { e.preventDefault(); setMode("signup"); setErr(""); setMsg(""); }}>Sign up</a>{" · "}<a href="#" onClick={(e) => { e.preventDefault(); onReset(); }}>Forgot password?</a></>
            : <>Already have one? <a href="#" onClick={(e) => { e.preventDefault(); setMode("login"); setErr(""); setMsg(""); }}>Log in</a></>}
        </div>
        <div className="auth-note">Your tasks sync across devices — log in from anywhere.</div>
      </form>
    </div>
  );
}

Object.assign(window, { AuthScreen, getCurrentUser, logout, loginApi, signupApi: signup });
