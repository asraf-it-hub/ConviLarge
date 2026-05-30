import { Link, NavLink } from "react-router-dom";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import Button from "./Button.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  ["Home", "/"],
  ["Convert", "/convert"],
  ["Merge", "/merge"],
  ["Compress", "/compress"],
  ["Split", "/split"],
  ["Security", "/security"]
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const nav = (
    <>
      {links.map(([label, href]) => (
        <NavLink
          key={href}
          to={href}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950" : "text-slate-600 hover:bg-white/80 dark:text-slate-300 dark:hover:bg-slate-900"
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-mist/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/brand/convilarge-icon.webp"
            alt="ConviLarge"
            className="h-9 w-9 rounded-lg object-cover shadow-sm ring-1 ring-slate-200 dark:ring-slate-800"
          />
          <span className="text-lg font-black text-slate-950 dark:text-white">ConviLarge</span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">{nav}</nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="soft">Dashboard</Button>
              </Link>
              <Button onClick={logout}>Logout</Button>
            </>
          ) : (
            <Link to="/auth">
              <Button>Login</Button>
            </Link>
          )}
        </div>
        <button className="focus-ring rounded-lg p-2 lg:hidden" onClick={() => setOpen((next) => !next)} aria-label="Open menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-200 bg-mist px-4 py-3 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
          <nav className="grid gap-1">{nav}</nav>
          <div className="mt-3 flex gap-2">
            <Button variant="soft" onClick={toggleTheme} className="flex-1">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              Theme
            </Button>
            {user ? (
              <Button onClick={logout} className="flex-1">Logout</Button>
            ) : (
              <Link to="/auth" className="flex-1">
                <Button className="w-full">Login</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
