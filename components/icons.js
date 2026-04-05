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
