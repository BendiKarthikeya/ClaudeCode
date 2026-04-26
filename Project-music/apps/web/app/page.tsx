'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRealtimeUrl, setRealtimeUrl, clearRealtimeUrl, normalizeUrl, isCloudDefault } from '../lib/realtime-url';

type Mode = 'cloud' | 'lan';

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('cloud');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [lanUrl, setLanUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [localHints, setLocalHints] = useState<{ port: number; addresses: string[] } | null>(null);
  const [lanStep, setLanStep] = useState<'host' | 'guest'>('host');

  useEffect(() => {
    const current = getRealtimeUrl();
    if (isCloudDefault(current)) {
      setMode('cloud');
    } else {
      setMode('lan');
      setLanUrl(current);
    }
    try {
      const stored = localStorage.getItem('syncjam:name');
      if (stored) setName(stored);
    } catch {}
  }, []);

  function persistName(): string | null {
    const trimmed = name.trim().slice(0, 32);
    if (!trimmed) {
      setErr('Please enter your name first.');
      return null;
    }
    try { localStorage.setItem('syncjam:name', trimmed); } catch {}
    return trimmed;
  }

  async function checkLanReachable(url: string): Promise<string | null> {
    try {
      const res = await fetch(`${normalizeUrl(url)}/health`, { cache: 'no-store' });
      if (!res.ok) return `Host responded with ${res.status}`;
      return null;
    } catch {
      if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
        return `Can't reach ${url}. You're on HTTPS — browsers block plain http:// LAN calls. Open the host's http://<ip>:3000 in your browser instead.`;
      }
      return `Can't reach ${url}. Is the host running the app and on the same WiFi?`;
    }
  }

  async function onCreate() {
    setErr(null);
    if (!persistName()) return;
    setCreating(true);
    try {
      if (mode === 'lan') {
        if (!lanUrl.trim()) throw new Error('Enter the host server URL or click Detect.');
        const why = await checkLanReachable(lanUrl);
        if (why) throw new Error(why);
        setRealtimeUrl(lanUrl);
      } else {
        clearRealtimeUrl();
      }
      const res = await fetch(`${getRealtimeUrl()}/api/rooms`, { method: 'POST' });
      if (!res.ok) throw new Error(`server ${res.status}`);
      const data = (await res.json()) as { code: string };
      const s = mode === 'lan' && lanUrl.trim() ? `?s=${encodeURIComponent(normalizeUrl(lanUrl))}` : '';
      router.push(`/r/${data.code}${s}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function onJoin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!code.trim()) return;
    if (!persistName()) return;
    if (mode === 'lan') {
      if (!lanUrl.trim()) { setErr('Enter the host server URL or click Detect.'); return; }
      const why = await checkLanReachable(lanUrl);
      if (why) { setErr(why); return; }
      setRealtimeUrl(lanUrl);
    } else {
      clearRealtimeUrl();
    }
    const s = mode === 'lan' && lanUrl.trim() ? `?s=${encodeURIComponent(normalizeUrl(lanUrl))}` : '';
    router.push(`/r/${code.trim().toUpperCase()}${s}`);
  }

  async function detectLocalServer() {
    setErr(null);
    try {
      const res = await fetch('http://localhost:4000/network-info', { cache: 'no-store' });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const info = (await res.json()) as { port: number; addresses: string[] };
      setLocalHints(info);
      if (info.addresses.length === 0) {
        setErr('Server running but no LAN address found. Are you connected to WiFi?');
        return;
      }
      setLanUrl(`http://${info.addresses[0]}:${info.port}`);
    } catch {
      const onHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      setErr(
        onHttps
          ? 'Detect only works when you open the app locally (http://localhost:3000). HTTPS pages block LAN detection.'
          : 'No server found on :4000. Make sure you ran `npm run dev` on this machine first.',
      );
    }
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 p-6">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-fuchsia-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-purple-700/15 blur-[120px]" />
        <div className="absolute top-1/3 left-0 h-[300px] w-[300px] rounded-full bg-pink-500/10 blur-[100px]" />
      </div>

      <div className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-fuchsia-500" />
          </span>
          Live listening, together
        </div>
        <h1 className="bg-gradient-to-br from-white via-fuchsia-200 to-fuchsia-500 bg-clip-text text-6xl font-black tracking-tight text-transparent drop-shadow-[0_0_30px_rgba(217,70,239,0.25)] sm:text-7xl">
          SyncJam
        </h1>
        <p className="mt-3 text-base text-white/50">
          Listen together, in sync, on any device. <span className="text-fuchsia-300/80">Free.</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ModeCard
          active={mode === 'cloud'}
          title="From anywhere"
          desc="Works across networks via cloud relay."
          onClick={() => setMode('cloud')}
        />
        <ModeCard
          active={mode === 'lan'}
          title="Same WiFi (LAN)"
          desc="No internet needed. One device hosts."
          onClick={() => setMode('lan')}
        />
      </div>

      {mode === 'lan' && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm space-y-4">
          {/* Host / Guest tabs */}
          <div className="flex gap-1 rounded-lg bg-black/30 p-1 w-fit">
            <button
              onClick={() => setLanStep('host')}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                lanStep === 'host' ? 'bg-fuchsia-600 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              I&apos;m the host
            </button>
            <button
              onClick={() => setLanStep('guest')}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                lanStep === 'guest' ? 'bg-fuchsia-600 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              I&apos;m joining
            </button>
          </div>

          {lanStep === 'host' && (
            <div className="space-y-3">
              <p className="text-white/70 font-medium">Set up on your laptop/PC</p>
              <ol className="space-y-2 text-white/60 list-none">
                <Step n={1} text="Make sure Node.js is installed on your machine." />
                <Step n={2} text={<>Clone the repo: <a href="https://github.com/BendiKarthikeya/ClaudeCode" target="_blank" rel="noopener noreferrer" className="font-mono text-fuchsia-400 underline underline-offset-2 hover:text-fuchsia-300 break-all">github.com/BendiKarthikeya/ClaudeCode</a>, then run <code className="rounded bg-black/40 px-1 text-white/80">npm install</code></>} />
                <Step n={3} text={<>Start the server: <code className="rounded bg-black/40 px-1 text-white/80">npm run dev</code></>} />
                <Step n={4} text="Click Detect below to find your local IP, then share it with friends on the same WiFi." />
              </ol>
              <div className="flex gap-2 pt-1">
                <input
                  value={lanUrl}
                  onChange={(e) => setLanUrl(e.target.value)}
                  placeholder="http://192.168.1.5:4000"
                  className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/30 text-white"
                />
                <button
                  onClick={detectLocalServer}
                  className="rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5 whitespace-nowrap"
                >
                  Detect
                </button>
              </div>
              {localHints && localHints.addresses.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-white/60">
                  <span>Your LAN address{localHints.addresses.length > 1 ? 'es' : ''}:</span>
                  {localHints.addresses.map((a) => {
                    const url = `http://${a}:${localHints.port}`;
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setLanUrl(url)}
                        className={`rounded-md border px-2 py-0.5 text-xs font-mono ${
                          normalizeUrl(lanUrl) === url
                            ? 'border-fuchsia-500 bg-fuchsia-500/10 text-white'
                            : 'border-white/10 hover:bg-white/5'
                        }`}
                      >
                        {url}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-white/40">
                Share your address (e.g. <span className="font-mono">http://192.168.1.5:3000</span>) with friends so they can open it in their browser.
              </p>
            </div>
          )}

          {lanStep === 'guest' && (
            <div className="space-y-3">
              <p className="text-white/70 font-medium">Joining from phone or laptop</p>
              <ol className="space-y-2 text-white/60 list-none">
                <Step n={1} text="Connect to the same WiFi as the host." />
                <Step n={2} text="Ask the host for their local address (looks like http://192.168.x.x:3000)." />
                <Step n={3} text="Open that address in your browser — you're in." />
                <Step n={4} text="Or paste the invite link they share with you directly." />
              </ol>
              <div className="flex gap-2 pt-1">
                <input
                  value={lanUrl}
                  onChange={(e) => setLanUrl(e.target.value)}
                  placeholder="http://192.168.1.5:4000"
                  className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/30 text-white"
                />
              </div>
              <p className="text-xs text-white/40">
                No app download needed — just a browser. Works on iPhone, Android, any laptop.
              </p>
            </div>
          )}

          <p className="text-xs text-amber-400/70 border border-amber-400/20 rounded-lg px-3 py-2">
            Note: both devices must be on the same WiFi. Guest networks and phone hotspots often block device-to-device connections.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl shadow-[0_8px_40px_-8px_rgba(217,70,239,0.15)] space-y-5">
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
            maxLength={32}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-fuchsia-400/50 focus:bg-black/40 focus:ring-2 focus:ring-fuchsia-500/20"
          />
        </div>

        <button
          onClick={onCreate}
          disabled={creating}
          className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-fuchsia-600/30 transition hover:shadow-xl hover:shadow-fuchsia-600/50 disabled:opacity-50"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <span className="relative">{creating ? 'Creating…' : '✨ Create a room'}</span>
        </button>

        <div className="relative flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-wider text-white/30">or join</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={onJoin} className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ENTER ROOM CODE"
            className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-center font-mono uppercase tracking-[0.3em] outline-none transition placeholder:text-white/20 focus:border-fuchsia-400/50 focus:ring-2 focus:ring-fuchsia-500/20"
            maxLength={6}
          />
          <button className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium transition hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10">
            Join
          </button>
        </form>
      </div>

      {err && <p className="text-sm text-red-400">{err}</p>}
    </main>
  );
}

function Step({ n, text }: { n: number; text: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-fuchsia-600/30 text-xs font-bold text-fuchsia-400">
        {n}
      </span>
      <span>{text}</span>
    </li>
  );
}

function ModeCard({
  active,
  title,
  desc,
  onClick,
  disabled,
}: {
  active: boolean;
  title: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group rounded-xl border p-4 text-left transition backdrop-blur ${
        active
          ? 'border-fuchsia-500/60 bg-fuchsia-500/10 shadow-lg shadow-fuchsia-600/20'
          : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-xs text-white/60">{desc}</div>
    </button>
  );
}
