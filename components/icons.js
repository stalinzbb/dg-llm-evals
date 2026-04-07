function IconBase({ children, size = 18 }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  );
}

export function SidebarToggleIcon({ collapsed = false }) {
  return (
    <IconBase>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z" />
      <path d="M9 4v16" />
      {collapsed ? <path d="M14 12h4M16 10l2 2-2 2" /> : <path d="M14 12h4M16 10l-2 2 2 2" />}
    </IconBase>
  );
}

export function LogoGlyph() {
  return (
    <svg aria-hidden="true" fill="none" height="28" viewBox="0 0 32 32" width="28">
      <path
        d="M6 8.5C6 7.11929 7.11929 6 8.5 6H23.5C24.8807 6 26 7.11929 26 8.5V23.5C26 24.8807 24.8807 26 23.5 26H8.5C7.11929 26 6 24.8807 6 23.5V8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M10.5 19.5L14 13L17.5 17L21.5 10.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20.5 10.5H21.5V11.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function PlaygroundIcon() {
  return (
    <IconBase>
      <path d="M4 7.5A3.5 3.5 0 0 1 7.5 4h9A3.5 3.5 0 0 1 20 7.5v9a3.5 3.5 0 0 1-3.5 3.5h-9A3.5 3.5 0 0 1 4 16.5v-9Z" />
      <path d="M20 8h.5A3.5 3.5 0 0 1 24 11.5v5A3.5 3.5 0 0 1 20.5 20H20" />
      <path d="M9 9h6M9 13h6M9 17h4" />
    </IconBase>
  );
}

export function BatchesIcon() {
  return (
    <IconBase>
      <rect height="6" rx="2" width="14" x="5" y="4" />
      <rect height="6" rx="2" width="14" x="5" y="14" />
      <path d="M19 7h2.5A1.5 1.5 0 0 1 23 8.5v7A1.5 1.5 0 0 1 21.5 17H19" />
    </IconBase>
  );
}

export function HistoryIcon() {
  return (
    <IconBase>
      <path d="M4 12a8 8 0 1 0 2.4-5.7" />
      <path d="M4 4v5h5" />
      <path d="M12 8v5l3 2" />
    </IconBase>
  );
}

export function SettingsIcon() {
  return (
    <IconBase>
      <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5Z" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
    </IconBase>
  );
}

export function LogoutIcon() {
  return (
    <IconBase>
      <path d="M14 5h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l-5-5 5-5" />
      <path d="M5 12h11" />
    </IconBase>
  );
}

export function SunMoonIcon() {
  return (
    <IconBase>
      <path d="M12 3v2.5M12 18.5V21M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M3 12h2.5M18.5 12H21M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
      <path d="M12 7a5 5 0 1 0 0 10a4.8 4.8 0 0 1 0-10Z" />
    </IconBase>
  );
}

export function CloseIcon() {
  return (
    <IconBase>
      <path d="M6 6l12 12" />
      <path d="M18 6l-12 12" />
    </IconBase>
  );
}

export function TrashIcon() {
  return (
    <IconBase>
      <path d="M4 7h16" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M7.5 7l.7 11.1A2 2 0 0 0 10.2 20h3.6a2 2 0 0 0 2-1.9L16.5 7" />
      <path d="M10 11v5M14 11v5" />
    </IconBase>
  );
}

export function ShuffleIcon() {
  return (
    <IconBase>
      <path d="M18 14l4 4-4 4" />
      <path d="M22 18h-6.041a6.1 6.1 0 0 1-5.059-2.7l-.3-.45" />
      <path d="M18 2l4 4-4 4" />
      <path d="M22 6h-5.973a6.1 6.1 0 0 0-5.027 2.64L5.7 16.3A6.1 6.1 0 0 1 .973 18H2" />
      <path d="M2 6h1.972A6.1 6.1 0 0 1 9 8.2" />
    </IconBase>
  );
}

export function BadgeCheckIcon() {
  return (
    <IconBase>
      <path d="M9 12l2 2 4-4" />
      <path d="M3.85 8.62a7.4 7.4 0 0 1 5.52-4.77a4.8 4.8 0 0 1 5.26 0a7.4 7.4 0 0 1 5.52 5.52a4.8 4.8 0 0 1 0 5.26a7.4 7.4 0 0 1-5.52 5.52a4.8 4.8 0 0 1-5.26 0a7.4 7.4 0 0 1-5.52-5.52a4.8 4.8 0 0 1 0-5.26Z" />
    </IconBase>
  );
}

export function BoltIcon() {
  return (
    <IconBase>
      <path d="M13 3 5.07 12.69c-.34.42-.51.63-.52.81 0 .15.07.29.19.39.14.11.41.11.95.11H12L11 21l7.93-9.69c.34-.42.51-.63.51-.8 0-.16-.06-.3-.18-.4-.14-.11-.41-.11-.95-.11H12L13 3Z" />
    </IconBase>
  );
}

export function BatchRunBoltIcon() {
  return (
    <IconBase>
      <path d="M11.54 2.67 3.61 12.36c-.34.42-.51.63-.51.81 0 .15.07.3.19.39.14.11.41.11.95.11h6.31l-1 7 7.93-9.69c.34-.42.51-.63.51-.8 0-.16-.07-.3-.19-.4-.14-.11-.41-.11-.95-.11h-6.31l1-7Z" />
      <path d="m14.65 2.33-.67 4.8" />
      <path d="m20.9 11.49-7.61 9.18" />
    </IconBase>
  );
}
