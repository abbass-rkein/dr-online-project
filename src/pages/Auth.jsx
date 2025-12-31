// src/pages/Auth.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setToken, decodeJwt } from "../lib/auth.js";

const API = "http://localhost:5000";

export default function Auth() {
  const nav = useNavigate();

  const [tab, setTab] = useState("login"); // login | register

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // register fields (patients)
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ---------------- LOGIN ----------------
  async function doLogin(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const r = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok || !j.ok) {
        throw new Error(j.error || "Login failed");
      }

      setToken(j.token);

      const role = decodeJwt(j.token)?.role || "";

      // route by role
      if (role === "ADMIN") nav("/admin");
      else if (role === "DOCTOR") nav("/doctor/dashboard");
      else nav("/");

    } catch (e2) {
      setErr(e2.message || "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  // ---------------- REGISTER ----------------
  async function doRegister(e) {
    e.preventDefault();
    setErr("");

    // client-side validation
    if (password.length < 8) {
      setErr("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        full_name: fullName,
        email,
        password,
        phone: phone || null,
        country: country || null,
      };

      const r = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        // handle backend errors gracefully
        let msg = j.error;
        if (!msg && j.errors) {
          // in case backend returns array of validation errors
          msg = Array.isArray(j.errors) ? j.errors.join(", ") : j.errors;
        }
        throw new Error(msg || "Signup failed");
      }

      if (!j.ok) throw new Error(j.error || "Signup failed");

      setToken(j.token);

      // signup always PATIENT
      nav("/");

    } catch (err) {
      setErr(err.message || "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {tab === "login" ? "Login" : "Register"}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Patients can register. Doctors login with their provided account.
        </p>

        {/* Tabs */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { setErr(""); setTab("login"); }}
            className={`px-4 py-2 rounded-xl border text-sm font-semibold ${
              tab === "login"
                ? "border-sky-400 bg-sky-50 text-sky-700"
                : "border-slate-200 hover:bg-slate-50 text-slate-700"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setErr(""); setTab("register"); }}
            className={`px-4 py-2 rounded-xl border text-sm font-semibold ${
              tab === "register"
                ? "border-sky-400 bg-sky-50 text-sky-700"
                : "border-slate-200 hover:bg-slate-50 text-slate-700"
            }`}
          >
            Register (Patient)
          </button>
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {err}
          </div>
        )}

        {/* Forms */}
        {tab === "login" ? (
          <form onSubmit={doLogin} className="mt-5 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none"
                placeholder="you@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              disabled={loading}
              className={`w-full mt-2 px-4 py-3 rounded-xl font-semibold text-white ${
                loading ? "bg-slate-300" : "bg-sky-600 hover:bg-sky-700"
              }`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        ) : (
          <form onSubmit={doRegister} className="mt-5 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                type="text"
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none"
                placeholder="John Smith"
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none"
                placeholder="you@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none"
                placeholder="Create a password"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Phone (optional)</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none"
                  placeholder="+44..."
                  autoComplete="tel"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Country (optional)</label>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none"
                  placeholder="UK"
                />
              </div>
            </div>

            <button
              disabled={loading}
              className={`w-full mt-2 px-4 py-3 rounded-xl font-semibold text-white ${
                loading ? "bg-slate-300" : "bg-sky-600 hover:bg-sky-700"
              }`}
            >
              {loading ? "Creating..." : "Create account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
