import { Link, NavLink } from "react-router-dom";
import { ArrowLeft, Menu, Moon, Sun, X } from "lucide-react";
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/brand/convilarge-icon.webp"
              alt="ConviLarge"
              className="h-8 w-8 rounded-lg object-cover shadow-2xs ring-1 ring-slate-200 dark:ring-slate-800"
            />
            <span className="text-base font-black text-slate-950 dark:text-white hidden xs:inline">ConviLarge</span>
          </Link>

          <div className="hidden h-5 w-px bg-slate-200 dark:bg-slate-800 sm:block" />

          <a
            href="https://www.collegeprep.page/"
            className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/90 px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-brand-500/40 hover:bg-brand-50/50 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:border-brand-500/40 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
            title="Back to CollegePrep Page"
          >
            <ArrowLeft size={14} className="text-brand-500 transition-transform group-hover:-translate-x-1" />
            <span className="font-extrabold text-xs">CollegePrep</span>
          </a>
        </div>
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
              
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 focus:outline-none"
                  aria-label="User menu"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-200/50 dark:ring-slate-800/50 transition hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-sm dark:bg-white dark:text-slate-950 ring-2 ring-slate-200/50 dark:ring-slate-800/50">
                      {user.name[0]?.toUpperCase()}
                    </div>
                  )}
                </button>
                
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white p-1.5 shadow-lg ring-1 ring-slate-200 focus:outline-none dark:bg-slate-900 dark:ring-slate-800 z-40">
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-left">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 rounded-md transition"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/account"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 rounded-md transition"
                      >
                        Account Settings
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 rounded-md transition"
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 rounded-md transition text-left"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
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
          <a
            href="https://www.collegeprep.page/"
            className="mb-3 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-extrabold text-slate-800 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <ArrowLeft size={14} className="text-brand-500" />
            <span>Back to CollegePrep.page</span>
          </a>
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
