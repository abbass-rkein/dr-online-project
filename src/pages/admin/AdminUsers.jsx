import { useEffect, useMemo, useState } from "react";
import { getToken } from "../../lib/auth.js";
import { Search, RefreshCw } from "lucide-react";

const API = "http://localhost:5000";

function RolePill({ role }) {
  const cls =
    role === "ADMIN"
      ? "bg-rose-50 text-rose-700 border-rose-100"
      : role === "DOCTOR"
      ? "bg-sky-50 text-sky-700 border-sky-100"
      : "bg-slate-50 text-slate-700 border-slate-100";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] border ${cls}`}
    >
      {role}
    </span>
  );
}

function StatusPill({ active }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border
        ${
          active
            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
            : "bg-slate-50 text-slate-500 border-slate-100"
        }`}
    >
      {active ? "ACTIVE" : "DISABLED"}
    </span>
  );
}

export default function AdminUsers() {
  const token = useMemo(() => getToken(), []);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  async function load(nextPage = page, nextRole = role, nextQ = q) {
    setErr("");
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (String(nextQ).trim()) qs.set("q", String(nextQ).trim());
      if (nextRole) qs.set("role", nextRole);
      qs.set("page", String(nextPage));
      qs.set("limit", String(limit));

      const r = await fetch(`${API}/api/admin/users?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed to load users");

      setRows(j.data || []);
      setTotalPages(j.totalPages || 1);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(page, role, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, role]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load(1, role, q);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function toggleActive(user_id, currentActive) {
    try {
      const next = currentActive ? 0 : 1;

      const r = await fetch(`${API}/api/admin/users/${user_id}/active`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: next }),
      });

      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Update failed");

      setRows((prev) =>
        prev.map((u) => (u.user_id === user_id ? { ...u, is_active: next } : u))
      );
    } catch (e) {
      alert(String(e.message || e));
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500 mt-1">
            Search users, filter roles, enable/disable accounts.
          </p>
        </div>

        <button
          onClick={() => load(page, role, q)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 w-full md:w-auto"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {err && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {err}
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-[520px]">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <select
          value={role}
          onChange={(e) => {
            const v = e.target.value;
            setRole(v);
            setPage(1);
          }}
          className="w-full md:w-[240px] rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        >
          <option value="">All roles</option>
          <option value="PATIENT">PATIENT</option>
          <option value="DOCTOR">DOCTOR</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      {/* ======= DESKTOP TABLE ======= */}
      <div className="mt-5 hidden md:block w-full overflow-x-auto rounded-2xl border border-slate-100 bg-white">
        <table className="w-full min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">User</th>
              <th className="text-left px-4 py-3 font-semibold">Role</th>
              <th className="text-left px-4 py-3 font-semibold">Country</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
                  Loading…
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((u) => (
                <tr key={u.user_id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">
                      {u.full_name}
                    </div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>

                  <td className="px-4 py-3">
                    <RolePill role={u.role} />
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {u.country || "—"}
                  </td>

                  <td className="px-4 py-3">
                    <StatusPill active={!!u.is_active} />
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() =>
                        toggleActive(
                          u.user_id,
                          u.is_active === 1 || u.is_active === true
                        )
                      }
                      className={`rounded-full px-4 py-2 text-xs font-semibold border transition
                        ${
                          u.is_active
                            ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            : "bg-emerald-600 border-emerald-600 text-white hover:opacity-90"
                        }`}
                    >
                      {u.is_active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ======= MOBILE CARDS ======= */}
      <div className="mt-5 md:hidden w-full space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
            Loading…
          </div>
        ) : rows.length ? (
          rows.map((u) => (
            <div
              key={u.user_id}
              className="rounded-2xl border border-slate-100 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">
                    {u.full_name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{u.email}</div>
                </div>

                <button
                  onClick={() =>
                    toggleActive(
                      u.user_id,
                      u.is_active === 1 || u.is_active === true
                    )
                  }
                  className={`rounded-full px-4 py-2 text-xs font-semibold border transition shrink-0
                    ${
                      u.is_active
                        ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        : "bg-emerald-600 border-emerald-600 text-white hover:opacity-90"
                    }`}
                >
                  {u.is_active ? "Disable" : "Enable"}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <RolePill role={u.role} />
                <StatusPill active={!!u.is_active} />
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] border bg-white text-slate-600 border-slate-200">
                  {u.country || "—"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
            No users found.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-center mt-6 gap-3">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className={`w-full md:w-auto px-4 py-2 rounded-lg border ${
            page === 1
              ? "bg-slate-100 text-slate-400"
              : "bg-white hover:bg-slate-50"
          }`}
        >
          Prev
        </button>

        <span className="px-4 py-2 text-slate-700 font-semibold">
          Page {page} of {totalPages}
        </span>

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className={`w-full md:w-auto px-4 py-2 rounded-lg border ${
            page === totalPages
              ? "bg-slate-100 text-slate-400"
              : "bg-white hover:bg-slate-50"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
