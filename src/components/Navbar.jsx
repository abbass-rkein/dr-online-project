// src/components/Navbar.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { clearToken, getAuth, onAuthChanged } from "../lib/auth.js";

export default function Navbar() {
  const [open, setOpen] = useState(false); // mobile menu
  const [menuOpen, setMenuOpen] = useState(false); // user dropdown
  const [auth, setAuth] = useState(() => getAuth());

  const nav = useNavigate();
  const menuRef = useRef(null);

  const linkBase =
    "px-3 py-1 text-sm font-medium transition-colors duration-200";
  const activeClass = "text-sky-600";
  const inactiveClass = "text-slate-600 hover:text-sky-500";

  const authed = !!auth.role;

  const initial = useMemo(() => {
    const n = auth.full_name || auth.email || "U";
    return (n.trim()[0] || "U").toUpperCase();
  }, [auth.full_name, auth.email]);

  function syncAuth() {
    setAuth(getAuth());
  }

  useEffect(() => {
    syncAuth();

    // fires SAME tab (from our custom event)
    const unsub = onAuthChanged(() => syncAuth());

    // other tabs
    const onStorage = () => syncAuth();
    window.addEventListener("storage", onStorage);

    // after redirects / focus
    const onFocus = () => syncAuth();
    window.addEventListener("focus", onFocus);

    return () => {
      unsub();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // close dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function logout() {
    clearToken();
    setMenuOpen(false);
    nav("/auth");
  }

  const desktopLinks = [
    { to: "/", label: "Home", end: true },
    { to: "/services", label: "Services" },
    { to: "/doctors", label: "Find Doctors" },
    { to: "/anatomy", label: "Anatomy" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  // ✅ role-based dashboard target
  const dashboardPath =
    auth.role === "ADMIN"
      ? "/admin"
      : auth.role === "DOCTOR"
      ? "/doctor/dashboard"
      : auth.role === "PATIENT"
      ? "/appointments"
      : "/";

  const dashboardLabel =
    auth.role === "ADMIN"
      ? "Admin Dashboard"
      : auth.role === "DOCTOR"
      ? "Doctor Dashboard"
      : auth.role === "PATIENT"
      ? "My Appointments"
      : "Dashboard";

  return (
    <nav className="fixed top-0 inset-x-0 z-40 bg-white/90 backdrop-blur shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">Dr</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-slate-900 text-lg">
                Dr.Online
              </span>
              <span className="text-[11px] text-slate-500">
                Digital healthcare
              </span>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {desktopLinks.map((x) => (
              <NavLink
                key={x.to}
                to={x.to}
                end={x.end}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? activeClass : inactiveClass}`
                }
              >
                {x.label}
              </NavLink>
            ))}

            {auth.role === "PATIENT" ? (
              <NavLink
                to="/appointments"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? activeClass : inactiveClass}`
                }
              >
                My Appointments
              </NavLink>
            ) : null}

            {/* Right side auth */}
            {authed ? (
              <div className="ml-4 relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm hover:bg-slate-50"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-sky-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                    {initial}
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-sm font-semibold text-slate-900 max-w-[160px] truncate">
                      {auth.full_name || auth.email}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {auth.role}
                    </div>
                  </div>
                  <svg
                    className="h-4 w-4 text-slate-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M5.25 7.5l4.75 5 4.75-5H5.25z" />
                  </svg>
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                    {/* ✅ Dashboard dropdown item for ADMIN + DOCTOR + PATIENT */}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        nav(dashboardPath);
                      }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 text-slate-700"
                    >
                      {dashboardLabel}
                    </button>

                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 text-rose-700 font-semibold"
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                to="/auth"
                className="ml-4 inline-flex items-center rounded-full bg-sky-500 text-white text-sm font-semibold px-4 py-2 shadow-md hover:bg-sky-600 transition-transform duration-200 hover:-translate-y-0.5"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:text-sky-500 hover:bg-slate-100 transition"
            onClick={() => setOpen(!open)}
          >
            <span className="sr-only">Open main menu</span>
            {open ? (
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                stroke="currentColor"
                fill="none"
              >
                <path
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                stroke="currentColor"
                fill="none"
              >
                <path
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  d="M4 7h16M4 12h16M4 17h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 space-y-1">
            {desktopLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-sky-50 text-sky-600"
                      : "text-slate-700 hover:bg-slate-50 hover:text-sky-600"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            {auth.role === "PATIENT" ? (
              <NavLink
                to="/appointments"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-sky-50 text-sky-600"
                      : "text-slate-700 hover:bg-slate-50 hover:text-sky-600"
                  }`
                }
              >
                My Appointments
              </NavLink>
            ) : null}

            {authed ? (
              <div className="pt-2 space-y-1">
                {/* ✅ Mobile Dashboard item for all roles */}
                <button
                  onClick={() => {
                    setOpen(false);
                    nav(dashboardPath);
                  }}
                  className="block w-full text-left rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {dashboardLabel}
                </button>

                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="block w-full text-left rounded-md px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="block mt-2 text-center rounded-full bg-sky-500 text-white text-sm font-semibold px-4 py-2 shadow-md hover:bg-sky-600"
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
