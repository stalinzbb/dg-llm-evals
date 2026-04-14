import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";

import {
  BatchesIcon,
  HistoryIcon,
  LogoGlyph,
  LogoutIcon,
  PlaygroundIcon,
  SettingsIcon,
  SunMoonIcon,
} from "@/components/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

const workspaceNavItems = [
  { label: "Playground", icon: PlaygroundIcon, page: "playground" },
  { label: "Batches", icon: BatchesIcon, page: "batches" },
  { label: "History", icon: HistoryIcon, page: "history" },
];

function buildPageHref(page) {
  return page === "playground" ? "/" : `/?tab=${page}`;
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

  function handleNavClick(page) {
    if (onNavClick) {
      onNavClick(page);
    } else {
      router.push(buildPageHref(page));
    }
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
      <SidebarProvider className={`${displayFont.variable} ${bodyFont.variable}`}>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-[12px] border border-sidebar-border bg-background/40 text-sidebar-foreground">
                <LogoGlyph />
              </div>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
                  Eval AI
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  Fundraiser evals
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                {workspaceNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.page}>
                      <SidebarMenuButton
                        isActive={currentPage === item.page}
                        onClick={() => handleNavClick(item.page)}
                        size="lg"
                        tooltip={item.label}
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup className="group-data-[collapsible=icon]:hidden">
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="grid gap-2 px-1 py-1">
                  {(stats || []).map((item) => (
                    <div
                      className="flex items-baseline justify-between gap-2"
                      key={item.label}
                    >
                      <span className="text-[0.7rem] uppercase tracking-wide text-sidebar-foreground/60">
                        {item.label}
                      </span>
                      <strong className="text-xs font-medium text-sidebar-foreground">
                        {item.value}
                      </strong>
                    </div>
                  ))}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={toggleTheme}
                  tooltip={theme === "dark" ? "Light mode" : "Dark mode"}
                >
                  <SunMoonIcon />
                  <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentPage === "settings"}
                  render={<Link href="/settings" />}
                  tooltip="Settings"
                >
                  <SettingsIcon />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                  <LogoutIcon />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[color:var(--line)] px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator className="h-4" orientation="vertical" />
            <span className="text-sm capitalize text-[color:var(--ink-muted)]">
              {currentPage}
            </span>
          </header>
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
