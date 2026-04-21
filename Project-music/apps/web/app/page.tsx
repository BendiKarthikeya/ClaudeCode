'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRealtimeUrl, setRealtimeUrl, clearRealtimeUrl, normalizeUrl, isCloudDefault, getDefaultRealtimeUrl } from '../lib/realtime-url';

type Mode = 'cloud' | 'lan' | 'bt';

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('cloud');
  const [code, setCode] = useState('');
  const [lanUrl, setLanUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [localHints, setLocalHints] = useState<{ port: number; addresses: string[] } | null>(null);

  useEffect(() => {
    const current = getRealtimeUrl();
    if (isCloudDefault(current)) {
      setMode('cloud');
    } else {
      setMode('lan');
      setLanUrl(current);
    }
  }, []);

  async function onCreate() {
    setErr(null);
    setCreating(true);
    try {
      if (mode === 'lan' && lanUrl.trim()) setRealtimeUrl(lanUrl);
      else if (mode === 'cloud') clearRealtimeUrl();
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

  function onJoin(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'lan' && lanUrl.trim()) setRealtimeUrl(lanUrl);
    else if (mode === 'cloud') clearRealtimeUrl();
    if (!code.trim()) return;
    const s = mode === 'lan' && lanUrl.trim() ? `?s=${encodeURIComponent(normalizeUrl(lanUrl))}` : '';
    router.push(`/r/${code.trim().toUpperCase()}${s}`);
  }

  async function detectLocalServer() {
    setErr(null);
    try {
      const res = await fetch('http://localhost:4000/network-info');
      const info = (await res.json()) as { port: number; addresses: string[] };
      setLocalHints(info);
      if (info.addresses[0] && !lanUrl) setLanUrl(`http://${info.addresses[0]}:${info.port}`);
    } catch {
      setErr('No local server detected on :4000. Run `npm run dev:realtime` on the host machine.');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 p-6">
      <div>
        <h1 className="text-4xl font-bold">SyncJam</h1>
        <p className="mt-2 text-white/60">Listen together, in sync, on any device. Free.</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <ModeCard
          active={mode === 'cloud'}
          title="From anywhere"
          desc="Cloud relay. Works across networks."
          onClick={() => setMode('cloud')}
        />
        <ModeCard
          active={mode === 'lan'}
          title="Same WiFi (LAN)"
          desc="One device hosts. No cloud."
          onClick={() => setMode('lan')}
        />
        <ModeCard
          active={false}
          disabled
          title="Bluetooth"
          desc="Not possible from browser — see below."
          onClick={() => setMode('bt')}
        />
      </div>

      {mode === 'lan' && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
          <p className="mb-2 text-white/70">
            Run <code className="rounded bg-black/40 px-1">npm run dev:realtime</code> on one
            machine. Share its address below with anyone on the same WiFi.
          </p>
          <div className="flex gap-2">
            <input
              value={lanUrl}
              onChange={(e) => setLanUrl(e.target.value)}
              placeholder="http://192.168.1.5:4000"
              className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/30"
            />
            <button
              onClick={detectLocalServer}
              className="rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5"
            >
              Detect local
            </button>
          </div>
          {localHints && (
            <p className="mt-2 text-white/50">
              Detected host IPs: {localHints.addresses.join(', ') || 'none'} on :{localHints.port}
            </p>
          )}
        </div>
      )}

      {mode === 'bt' && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          <p className="font-semibold text-white">Why Bluetooth is not an option here</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Browsers can't send audio over Bluetooth (A2DP is OS-level, not exposed to web apps).</li>
            <li>Web Bluetooth only does BLE, which is too low-bandwidth for music streaming.</li>
            <li>Classic BT pairs one source to very few sinks — not a "group" model.</li>
          </ul>
          <p className="mt-2">
            Use <button onClick={() => setMode('lan')} className="underline">Same WiFi</button>{' '}
            instead — it's the closest local-network equivalent.
          </p>
        </div>
      )}

      <button
        onClick={onCreate}
        disabled={creating || mode === 'bt'}
        className="rounded-lg bg-fuchsia-600 px-5 py-3 font-semibold hover:bg-fuchsia-500 disabled:opacity-50"
      >
        {creating ? 'Creating…' : 'Create a room'}
      </button>

      <form onSubmit={onJoin} className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter room code"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 uppercase tracking-widest outline-none focus:border-white/30"
          maxLength={6}
        />
        <button
          disabled={mode === 'bt'}
          className="rounded-lg border border-white/10 px-5 py-3 hover:bg-white/5 disabled:opacity-50"
        >
          Join
        </button>
      </form>

      {err && <p className="text-sm text-red-400">{err}</p>}
    </main>
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
      className={`rounded-xl border p-3 text-left transition ${
        active ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-white/10 hover:bg-white/5'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-xs text-white/60">{desc}</div>
    </button>
  );
}
