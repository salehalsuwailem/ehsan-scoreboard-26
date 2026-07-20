import { APP_VERSION, SITE_NAME } from "@/lib/constants";
import { ar } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Link, usePath } from "@/router";
import { IconBarChart, IconHome } from "@/components/Icons";

const LINKS = [
  { to: "/", label: ar.nav.home, icon: IconHome },
  { to: "/statistics", label: ar.nav.statistics, icon: IconBarChart },
];

function isActive(path: string, to: string): boolean {
  if (to === "/") return path === "/" || path.startsWith("/group/");
  return path === to;
}

/* --------------------------------- Navbar --------------------------------- */

export function Navbar() {
  const path = usePath();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="container-site flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label={SITE_NAME}>
          <img src="/logo.png" alt="" className="h-9 w-auto" />
          <span className="truncate font-bold text-primary">{SITE_NAME}</span>
        </Link>

        <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const active = isActive(path, link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-btn px-4 py-2 text-sm font-semibold transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

/* -------------------------------- BottomNav ------------------------------- */

export function BottomNav() {
  const path = usePath();

  return (
    <nav
      aria-label="تنقل الجوال"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-2">
        {LINKS.map((link) => {
          const active = isActive(path, link.to);
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-caption font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* --------------------------------- Footer --------------------------------- */

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container-site flex flex-col items-center justify-between gap-2 py-6 text-caption text-muted-foreground sm:flex-row">
        <p>{ar.footer.rights}</p>
        <p className="tabular">v{APP_VERSION}</p>
      </div>
    </footer>
  );
}
