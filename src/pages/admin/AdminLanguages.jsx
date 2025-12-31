import { useEffect, useMemo, useState } from "react";
import { getToken } from "../../lib/auth.js";
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";

const API = "http://localhost:5000";

function fmt(n) {
  const x = Number(n || 0);
  return Number.isFinite(x) ? x : 0;
}

export default function AdminLanguages() {
  const token = useMemo(() => getToken(), []);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [name, setName] = useState("");

  async function load(nextPage = page, nextQ = q) {
    setErr("");
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (String(nextQ).trim()) qs.set("q", String(nextQ).trim());
      qs.set("page", String(nextPage));
      qs.set("limit", String(limit));

      const r = await fetch(`${API}/api/admin/languages?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json();
      if (!r.ok || !j.ok)
        throw new Error(j.error || "Failed to load languages");

      setRows(j.data || []);
      setTotalPages(j.totalPages || 1);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(page, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load(1, q);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function openCreate() {
    setEdit(null);
    setName("");
    setOpen(true);
  }

  function openEditRow(r) {
    setEdit(r);
    setName(r.name || "");
    setOpen(true);
  }

  async function save() {
    setErr("");
    try {
      const payload = { name: String(name || "").trim() };
      if (!payload.name) throw new Error("Name is required");

      const url = edit
        ? `${API}/api/admin/languages/${edit.language_id}`
        : `${API}/api/admin/languages`;

      const method = edit ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Save failed");

      setOpen(false);
      setPage(1);
      await load(1, q);
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  async function delRow(rw) {
    const ok = confirm(
      rw.doctor_count > 0
        ? `This language is used by ${rw.doctor_count} doctors and cannot be deleted.`
        : `Delete "${rw.name}"? This cannot be undone.`
    );
    if (!ok) return;

    if (rw.doctor_count > 0) return;

    try {
      const r = await fetch(`${API}/api/admin/languages/${rw.language_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Delete failed");

      setRows((prev) => prev.filter((x) => x.language_id !== rw.language_id));
    } catch (e) {
      alert(String(e.message || e));
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Languages</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage languages used for doctor profiles and filtering.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 text-white px-5 py-2.5 text-sm font-semibold hover:opacity-90 w-full md:w-auto"
        >
          <Plus size={16} /> Add Language
        </button>
      </div>

      {err && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {err}
        </div>
      )}

      <div className="mt-6 relative w-full md:max-w-[520px]">
        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search languages…"
          className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-100 bg-white">
        <table className="w-full min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Name</th>
              <th className="text-left px-4 py-3 font-semibold">Doctors</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={3}>
                  Loading…
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((r) => (
                <tr key={r.language_id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {r.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {fmt(r.doctor_count)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditRow(r)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold hover:bg-slate-50"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        onClick={() => delRow(r)}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold
                          ${
                            fmt(r.doctor_count) > 0
                              ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                          }`}
                        disabled={fmt(r.doctor_count) > 0}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={3}>
                  No languages found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-100 shadow-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {edit ? "Edit Language" : "Add Language"}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Names are unique (case-insensitive). Safe delete blocks used
                  ones.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
                placeholder="e.g. Arabic"
              />
            </div>

            {err && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {err}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="rounded-full bg-sky-600 text-white px-5 py-2 text-sm font-semibold hover:opacity-90"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
