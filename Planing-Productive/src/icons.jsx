// Minimal inline icon set — stroke icons, 16/20px, currentColor
const mk = (path, vb = "0 0 24 24") => ({ size = 16, className = "", ...rest } = {}) => (
  <svg width={size} height={size} viewBox={vb} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>
    {path}
  </svg>
);

const Icons = {
  Home:     mk(<><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></>),
  Grid:    mk(<><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></>),
  Calendar: mk(<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>),
  Focus:    mk(<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/></>),
  History:  mk(<><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></>),
  Settings: mk(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>),

  Plus:     mk(<><path d="M12 5v14M5 12h14"/></>),
  Search:   mk(<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>),
  ChevL:    mk(<><path d="M15 6l-6 6 6 6"/></>),
  ChevR:    mk(<><path d="M9 6l6 6-6 6"/></>),
  ChevD:    mk(<><path d="M6 9l6 6 6-6"/></>),
  Play:     mk(<><path d="M7 5l12 7-12 7z" fill="currentColor" stroke="none"/></>),
  Pause:    mk(<><rect x="7" y="5" width="3.5" height="14" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="3.5" height="14" fill="currentColor" stroke="none"/></>),
  Stop:     mk(<><rect x="7" y="7" width="10" height="10" rx="1" fill="currentColor" stroke="none"/></>),
  Check:    mk(<><path d="M4 12l5 5 11-11"/></>),
  X:        mk(<><path d="M6 6l12 12M18 6L6 18"/></>),
  Clock:    mk(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>),
  Flame:    mk(<><path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-3s-1 3 1 3 1-3 1-3 1 3 1 3z"/></>),
  Bell:     mk(<><path d="M6 8a6 6 0 1 1 12 0v5l2 3H4l2-3z"/><path d="M10 19a2 2 0 0 0 4 0"/></>),
  Star:     mk(<><path d="M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></>),
  Drag:     mk(<><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></>),
  Link:     mk(<><path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6L11.5 7"/><path d="M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6L12.5 17"/></>),
  Arrow:    mk(<><path d="M5 12h14M13 6l6 6-6 6"/></>),
  ArrowUp:  mk(<><path d="M12 19V5M6 11l6-6 6 6"/></>),
  Sparkle:  mk(<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/></>),
  List:     mk(<><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>),
  Zap:      mk(<><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></>),
  Sun:      mk(<><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"/></>),
  Moon:     mk(<><path d="M20 14a8 8 0 1 1-10-10 7 7 0 0 0 10 10z"/></>),
  Coffee:   mk(<><path d="M4 8h14v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8z"/><path d="M18 10h2a2 2 0 0 1 0 4h-2"/><path d="M8 2v3M12 2v3M16 2v3"/></>),
  Tag:     mk(<><path d="M3 12V3h9l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/></>),
  Dot:     mk(<><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></>),
  Google:  ({size=16, ...p}) => (
    <svg width={size} height={size} viewBox="0 0 48 48" {...p}>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.9 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6c1.9-5.6 7.1-9.7 13.6-9.7z"/>
      <path fill="#4285F4" d="M46.6 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.8c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 6.9-10 6.9-17.5z"/>
      <path fill="#FBBC05" d="M10.4 28.5c-.5-1.5-.8-3-.8-4.5s.3-3 .8-4.5l-7.8-6C1 16.7 0 20.2 0 24s1 7.3 2.6 10.5l7.8-6z"/>
      <path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.5-5.8c-2.1 1.4-4.8 2.3-8.1 2.3-6.5 0-12-4.1-13.9-9.7l-7.8 6C6.5 42.6 14.6 48 24 48z"/>
    </svg>
  ),
};

window.Icons = Icons;
