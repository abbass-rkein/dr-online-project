// src/components/Navbar.jsx
import { useState } from "react";
import { NavLink, Link } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const linkBase =
    "px-3 py-1 text-sm font-medium transition-colors duration-200";
  const activeClass = "text-sky-600";
  const inactiveClass = "text-slate-600 hover:text-sky-500";

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
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${linkBase} ${isActive ? activeClass : inactiveClass}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/services"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? activeClass : inactiveClass}`
              }
            >
              Services
            </NavLink>
            <NavLink
              to="/doctors"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? activeClass : inactiveClass}`
              }
            >
              Find Doctors
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? activeClass : inactiveClass}`
              }
            >
              About
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? activeClass : inactiveClass}`
              }
            >
              Contact
            </NavLink>

            <Link
              to="/contact"
              className="ml-4 inline-flex items-center rounded-full bg-sky-500 text-white text-sm font-semibold px-4 py-2 shadow-md hover:bg-sky-600 transition-transform duration-200 hover:-translate-y-0.5"
            >
              Join us
            </Link>
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
            {[
              { to: "/", label: "Home" },
              { to: "/services", label: "Services" },
              { to: "/doctors", label: "Find Doctors" },
              { to: "/about", label: "About" },
              { to: "/contact", label: "Contact" },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
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
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="block mt-2 text-center rounded-full bg-sky-500 text-white text-sm font-semibold px-4 py-2 shadow-md hover:bg-sky-600"
            >
              Join us
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
