import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { useState } from "react";

import {
  BatchesIcon,
  HistoryIcon,
  LogoGlyph,
  LogoutIcon,
  PlaygroundIcon,
  SettingsIcon,
  SidebarToggleIcon,
  SunMoonIcon,
} from "@/components/icons";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

const navItems = [
  { href: "/", label: "Playground", icon: PlaygroundIcon, page: "playground" },
  { href: "/batches", label: "Batches", icon: BatchesIcon, page: "batches" },
  { href: "/history", label: "History", icon: HistoryIcon, page: "history" },
  { href: "/settings", label: "Settings", icon: SettingsIcon, page: "settings" },
];

function getInitialSidebarCollapsedState() {
  if (typeof window === "undefined") {
    return false;
  }

  const datasetValue = document.documentElement.dataset.sidebarCollapsed;
  const storedValue = window.localStorage.getItem("dg-sidebar-collapsed");
  return storedValue === null ? datasetValue === "true" : storedValue === "true";
}

export default function WorkspaceLayout({
  children,
  currentPage,
  theme,
  toggleTheme,
  title,
  description,
  stats,
  onNavClick,
}) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(getInitialSidebarCollapsedState);

  function toggleSidebar() {
    setIsCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("dg-sidebar-collapsed", String(next));
      document.documentElement.dataset.sidebarCollapsed = String(next);
      return next;
    });
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <>
      <Head>
        <title>{title || "Eval AI"}</title>
        <meta
          content={description || "Generate, compare, and batch-evaluate fundraiser messages."}
          name="description"
        />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
      </Head>
      <div className={`${displayFont.variable} ${bodyFont.variable} app-shell`}>
        <div className="app-frame">
          <header className="topbar">
            <div className="topbar-inner">
              <div className="brand-lockup">
                <div className="brand-mark">
                  <LogoGlyph />
                </div>
                <div className="brand-copy">
                  <h1>Eval AI</h1>
                </div>
              </div>
              <button
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="sidebar-toggle"
                onClick={toggleSidebar}
                type="button"
              >
                <SidebarToggleIcon collapsed={isCollapsed} />
              </button>
            </div>
          </header>
          <div className={`workspace-shell ${isCollapsed ? "is-sidebar-collapsed" : ""}`}>
            <aside className={`sidebar ${isCollapsed ? "is-collapsed" : ""}`}>
              <div className="sidebar-inner">
                <nav className="sidebar-nav" aria-label="Primary">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.page;
                    const className = `sidebar-link ${isActive ? "is-active" : ""}`;
                    const content = (
                      <>
                        <span className="sidebar-link-icon">
                          <Icon />
                        </span>
                        <span className="sidebar-link-text">{item.label}</span>
                      </>
                    );

                    if (item.page === "settings" || !onNavClick) {
                      return (
                        <Link
                          aria-current={isActive ? "page" : undefined}
                          className={className}
                          href={item.href}
                          key={item.href}
                        >
                          {content}
                        </Link>
                      );
                    }

                    return (
                      <button
                        aria-current={isActive ? "page" : undefined}
                        className={className}
                        key={item.page}
                        onClick={() => onNavClick(item.page)}
                        type="button"
                      >
                        {content}
                      </button>
                    );
                  })}
                </nav>

                <section className="sidebar-summary">
                  <div className="sidebar-summary-title">Workspace status</div>
                  <div className="sidebar-meta">
                    {stats.map((item) => (
                      <div className="sidebar-stat" key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="sidebar-footer">
                  <button className="sidebar-link sidebar-utility" onClick={toggleTheme} type="button">
                    <span className="sidebar-link-icon">
                      <SunMoonIcon />
                    </span>
                    <span className="sidebar-link-text">
                      {theme === "dark" ? "Light mode" : "Dark mode"}
                    </span>
                  </button>
                  <button className="sidebar-link sidebar-utility" onClick={handleLogout} type="button">
                    <span className="sidebar-link-icon">
                      <LogoutIcon />
                    </span>
                    <span className="sidebar-link-text">Logout</span>
                  </button>
                </div>
              </div>
            </aside>

            <main className="content-panel">{children}</main>
          </div>
        </div>
      </div>
    </>
  );
}
