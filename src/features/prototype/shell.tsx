import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router";
import {
  Menu,
  ArrowUpRight,
  LogOut,
  X,
  BriefcaseBusiness,
  UserRound,
  Bookmark,
  FileText,
  Users,
  Building2,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { BrandMark } from "@/features/public/brand-mark";
import { Button, buttonVariants } from "@/components/ui/button";
import { currentPerson } from "./model";
import { usePrototype } from "./store";
import { STATIC_DEMO } from "./runtime";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
const navigation = [
  { to: "/oferty", label: "Oferty" },
  { to: "/metodologia", label: "Metodologia" },
  { to: "/auth/sign-in?audience=employer&next=/app/oferty", label: "Dla firm" },
];

export function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "success" | "warning";
}) {
  return (
    <div role="status" className="prototype-notice" data-tone={tone}>
      {children}
    </div>
  );
}
export function PageTitle({
  children,
  action,
  description,
  eyebrow = "DoRoboty.ai / Twoja przestrzeń",
}: {
  children: ReactNode;
  action?: ReactNode;
  description?: string;
  eyebrow?: string;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{children}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action}
    </header>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-symbol" aria-hidden="true">
        ↗
      </span>
      <div>{children}</div>
    </div>
  );
}
export function NotFound() {
  return (
    <section className="prototype-section">
      <Empty>
        <h1>Nie znaleziono strony</h1>
        <p className="my-5">Ten adres nie prowadzi do dostępnej oferty lub aplikacji.</p>
        <Link className={buttonVariants()} to="/oferty">
          Wróć do ofert
        </Link>
      </Empty>
    </section>
  );
}
function PublicHeader({ person }: { person: ReturnType<typeof currentPerson> }) {
  const { logout, pending } = usePrototype();
  const items = [
    ...navigation,
    ...(person?.role === "candidate"
      ? [
          { to: "/app/aplikacje", label: "Aplikacje" },
          { to: "/app/profil", label: "Profil" },
        ]
      : []),
  ];
  return (
    <header className="public-header">
      <div className="tph-container public-header-inner">
        <Link className="brand" to="/" aria-label="DoRoboty.ai — strona główna">
          DoRoboty.ai
          <BrandMark />
        </Link>
        <nav className="public-nav" aria-label="Główna nawigacja">
          {items.map((item) => (
            <NavLink key={item.to} className="public-nav-link" to={item.to}>
              {item.label}
            </NavLink>
          ))}
          <div className="public-account">
            <Link
              to={person ? "/app" : "/auth/sign-in?audience=candidate"}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {person ? "Moje konto" : "Zaloguj się"}
            </Link>
            {person && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Wyloguj się"
                disabled={pending}
                onClick={() => void logout()}
              >
                <LogOut size={18} aria-hidden="true" />
              </Button>
            )}
          </div>
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  className="public-menu"
                  variant="ghost"
                  size="icon"
                  aria-label="Otwórz nawigację"
                />
              }
            >
              <Menu aria-hidden="true" />
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Dokąd teraz?</DialogTitle>
              <DialogDescription>Oferty, profil i informacje o DoRoboty.ai.</DialogDescription>
              <nav className="mobile-public-nav" aria-label="Nawigacja mobilna">
                {items.map((item) => (
                  <DialogClose key={item.to} render={<Link to={item.to} />}>
                    {item.label}
                  </DialogClose>
                ))}
                <DialogClose render={<Link to="/auth/sign-in" />}>Zaloguj się</DialogClose>
              </nav>
            </DialogContent>
          </Dialog>
        </nav>
      </div>
    </header>
  );
}
const candidateNav = [
  ["/app", "Przegląd", LayoutDashboard],
  ["/app/profil", "Profil", UserRound],
  ["/app/zapisane", "Zapisane oferty", Bookmark],
  ["/app/aplikacje", "Moje aplikacje", FileText],
] as const;
const employerNav = [
  ["/app", "Przegląd", LayoutDashboard],
  ["/app/oferty", "Moje oferty", BriefcaseBusiness],
  ["/app/kandydaci", "Kandydaci", Users],
  ["/app/organizacja", "Organizacja", Building2],
] as const;
export function Shell() {
  const { state, issue, error, clearError, logout, pending } = usePrototype();
  const person = currentPerson(state);
  const { pathname } = useLocation();
  const workspace = pathname.startsWith("/app") && person;
  const [menuAt, setMenuAt] = useState<string | null>(null);
  const main = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname) {
      clearError();
      main.current?.focus();
      window.scrollTo(0, 0);
      lastPath.current = pathname;
    }
  }, [pathname, clearError]);
  const roleNav =
    person?.role === "employer"
      ? employerNav
      : person?.role === "operator"
        ? [["/app/case", "Materiały case study", FileText] as const]
        : candidateNav;
  const nav = state.account?.mustChangePassword
    ? []
    : [
        ...roleNav,
        ...(!STATIC_DEMO && state.account?.admin
          ? [
              ["/app/admin", "Panel administracyjny", Users] as const,
              ...(person?.role === "operator"
                ? []
                : [["/app/case", "Materiały case study", FileText] as const]),
            ]
          : []),
      ];
  const content = (
    <>
      <>
        {STATIC_DEMO && (
          <Notice>
            <strong>Demo w przeglądarce.</strong> Logowanie jest symulowane, a dane pozostają tylko
            w tej przeglądarce. Zgłoszenia nie są wysyłane do firm.{" "}
            <Link className="underline" to="/polityka-prywatnosci">
              Jak działa demo
            </Link>
          </Notice>
        )}
        {issue && (
          <Notice tone="warning">
            {issue}{" "}
            <Link className="underline" to="/app/settings">
              Ustawienia danych
            </Link>
          </Notice>
        )}
      </>
      {error && person && !pathname.startsWith("/auth") && (
        <p className="prototype-error" role="alert">
          {error}
        </p>
      )}
      <div key={`${state.activePersonId}:${pathname}`}>
        {state.account?.mustChangePassword &&
        !["/app/settings", "/auth/forgot-password", "/auth/reset-password"].includes(pathname) ? (
          <Navigate to="/app/settings" replace />
        ) : (
          <Outlet />
        )}
      </div>
    </>
  );
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        Przejdź do treści
      </a>
      {workspace ? (
        <div className="app-frame">
          <div className="mobile-header">
            <Link to="/" className="brand">
              <BrandMark />
              DoRoboty.ai
            </Link>
            <Button
              ref={menuButton}
              aria-label={menuAt === pathname ? "Zamknij menu" : "Otwórz menu"}
              aria-expanded={menuAt === pathname}
              aria-controls="workspace-nav"
              variant="ghost"
              size="icon"
              onClick={() => setMenuAt(menuAt === pathname ? null : pathname)}
            >
              {menuAt === pathname ? <X /> : <Menu />}
            </Button>
          </div>
          <aside
            className={`sidebar ${menuAt === pathname ? "sidebar-open" : ""}`}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setMenuAt(null);
                menuButton.current?.focus();
              }
            }}
          >
            <Link className="brand" to="/">
              <BrandMark />
              DoRoboty.ai
            </Link>
            <div className="workspace-label">
              <span className="workspace-avatar">{person.name[0]}</span>
              <div>
                <strong>{person.name}</strong>
                <span>{person.headline}</span>
              </div>
            </div>
            <nav id="workspace-nav" aria-label="Panel użytkownika">
              {nav.map(([to, label, Icon]) => (
                <NavLink
                  end={to === "/app"}
                  key={to}
                  to={to}
                  onClick={() => setMenuAt(null)}
                  className={({ isActive }) => `nav-link ${isActive ? "nav-active" : ""}`}
                >
                  <Icon className="size-4" />
                  {label}
                </NavLink>
              ))}
              <NavLink
                to="/app/settings"
                onClick={() => setMenuAt(null)}
                className={({ isActive }) => `nav-link ${isActive ? "nav-active" : ""}`}
              >
                <Settings className="size-4" />
                Ustawienia
              </NavLink>
              <Link className="nav-link" to="/oferty">
                Wszystkie oferty
              </Link>
              <Link className="nav-link" to="/auth/sign-in">
                Zmień konto
              </Link>
              <Button
                variant="ghost"
                className="nav-link"
                disabled={pending}
                onClick={() => void logout()}
              >
                Wyloguj się
              </Button>
            </nav>
          </aside>
          <div className="workspace">
            <div className="topbar">
              <span>
                {person.role === "candidate"
                  ? "Strefa kandydata"
                  : person.role === "employer"
                    ? "Strefa pracodawcy"
                    : "Case study"}
              </span>
              <Link to="/auth/sign-in">{person.name}</Link>
            </div>
            <main id="main" ref={main} tabIndex={-1} className="main-content outline-none">
              {content}
            </main>
          </div>
        </div>
      ) : (
        <>
          <PublicHeader person={person} />
          <main
            id="main"
            ref={main}
            tabIndex={-1}
            className={
              pathname === "/app/settings" ? "prototype-section outline-none" : "outline-none"
            }
          >
            {content}
          </main>
          <footer className="public-footer tph-container">
            <div className="footer-main">
              <div>
                <Link className="brand" to="/">
                  DoRoboty.ai
                  <BrandMark />
                </Link>
                <p>
                  Praca dla ludzi, którzy potrafią z AI zbudować coś wartościowego — nie tylko
                  wpisać je do CV.
                </p>
              </div>
              <nav aria-label="Stopka">
                <Link to="/oferty">Oferty</Link>
                <Link to="/metodologia">Metodologia</Link>
                <Link to="/polityka-prywatnosci">Prywatność</Link>
                <Link to="/auth/sign-in">
                  Strefa case <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </nav>
            </div>
            <p className="footer-credit">
              © {new Date().getFullYear()} DoRoboty.ai · od Superhero.tech / Technologia po ludzku
            </p>
          </footer>
        </>
      )}
    </div>
  );
}
