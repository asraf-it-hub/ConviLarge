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
  ["Image", "/image"],
  ["PDF", "/pdf"],
  ["Transfer", "/transfer"],
  ["AI", "/ai"],
  ["Split", "/split"],
  ["Security", "/security"]
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    setOpen(false);
  }

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
              {user.role === "admin" && (
                <Link to="/admin">
                  <Button variant="soft">Admin</Button>
                </Link>
              )}
              <Link to="/dashboard" className="flex items-center gap-2">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-200/50 dark:ring-slate-800/50 transition hover:scale-105"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-sm dark:bg-white dark:text-slate-950 ring-2 ring-slate-200/50 dark:ring-slate-800/50">
                    {user.name[0]?.toUpperCase()}
                  </div>
                )}
                <Button variant="soft">Dashboard</Button>
              </Link>
              <Button onClick={handleLogout}>Logout</Button>
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
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="soft" onClick={toggleTheme} className="w-full">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              Theme
            </Button>
            {user ? (
              <>
                <div className="col-span-2 flex items-center gap-3 py-2 border-b border-slate-200 dark:border-slate-800 mb-1">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-200/50 dark:ring-slate-800/50"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-base dark:bg-white dark:text-slate-950 ring-2 ring-slate-200/50 dark:ring-slate-800/50">
                      {user.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                  </div>
                </div>
                {user.role === "admin" && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="col-span-2">
                    <Button variant="soft" className="w-full">Admin</Button>
                  </Link>
                )}
                <Link to="/dashboard" onClick={() => setOpen(false)} className="col-span-2">
                  <Button variant="soft" className="w-full">Dashboard</Button>
                </Link>
                <Button onClick={handleLogout} className="col-span-2">Logout</Button>
              </>
            ) : (
              <Link to="/auth">
                <Button className="w-full">Login</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
