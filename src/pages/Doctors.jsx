// src/pages/Doctors.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API = "http://localhost:5000";

function Pill({ children }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] border bg-slate-50 text-slate-700 border-slate-100">
      {children}
    </span>
  );
}

export default function Doctors() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(9);

  const [specialtyId, setSpecialtyId] = useState("");
  const [languageId, setLanguageId] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const [specs, setSpecs] = useState([]);
  const [langs, setLangs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const queryKey = useMemo(
    () =>
      JSON.stringify({ q, page, specialtyId, languageId, verifiedOnly, limit }),
    [q, page, specialtyId, languageId, verifiedOnly, limit]
  );

  async function loadMeta() {
    try {
      const [s, l] = await Promise.all([
        fetch(`${API}/api/meta/specialties`).then((r) => r.json()),
        fetch(`${API}/api/meta/languages`).then((r) => r.json()),
      ]);
      if (s?.ok) setSpecs(s.data || []);
      if (l?.ok) setLangs(l.data || []);
    } catch {
      // meta failure shouldn't kill page
    }
  }

  async function loadDoctors() {
    setErr("");
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (String(q).trim()) qs.set("q", String(q).trim());
      if (specialtyId) qs.set("specialty_id", specialtyId);
      if (languageId) qs.set("language_id", languageId);
      if (verifiedOnly) qs.set("verified", "1");
      qs.set("page", String(page));
      qs.set("limit", String(limit));

      const r = await fetch(`${API}/api/doctors?${qs.toString()}`);
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed to load doctors");

      setRows(j.data || []);
      setTotalPages(j.totalPages || 1);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMeta();
  }, []);

  // Load doctors when filters/page changes
  useEffect(() => {
    loadDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  // Debounce typing search: reset to page 1
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-3">Find Doctors</h1>

      <p className="text-slate-600 mb-6 max-w-2xl">
        Browse verified doctors, filter by specialty and language, and book the
        right fit.
      </p>

      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <input
          type="text"
          placeholder="Search name or title..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="md:col-span-2 w-full p-3 rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-sky-400 focus:outline-none"
        />

        <select
          value={specialtyId}
          onChange={(e) => {
            setSpecialtyId(e.target.value);
            setPage(1);
          }}
          className="w-full p-3 rounded-2xl border border-slate-200 bg-white"
        >
          <option value="">All specialties</option>
          {specs.map((s) => (
            <option key={s.specialty_id} value={s.specialty_id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={languageId}
          onChange={(e) => {
            setLanguageId(e.target.value);
            setPage(1);
          }}
          className="w-full p-3 rounded-2xl border border-slate-200 bg-white"
        >
          <option value="">All languages</option>
          {langs.map((l) => (
            <option key={l.language_id} value={l.language_id}>
              {l.name}
            </option>
          ))}
        </select>

        <label className="md:col-span-4 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => {
              setVerifiedOnly(e.target.checked);
              setPage(1);
            }}
          />
          Verified only
        </label>
      </div>

      {err && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {err}
        </div>
      )}

      {/* Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse"
            >
              <div className="h-16 w-16 rounded-full bg-slate-200 mb-4 mx-auto" />
              <div className="h-3 bg-slate-200 rounded w-2/3 mx-auto mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2 mx-auto mb-4" />
              <div className="h-6 bg-slate-200 rounded w-full" />
            </div>
          ))
        ) : rows.length ? (
          rows.map((d) => {
            const initial =
              (d.full_name || "D").split(" ")[1]?.[0] ||
              (d.full_name || "D")[0] ||
              "D";

            return (
              <Link
                key={d.doctor_id}
                to={`/doctors/${d.doctor_id}`}
                className="block"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col items-center text-center hover:-translate-y-1 hover:shadow-md transition">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-sky-300 to-blue-400 flex items-center justify-center text-white font-semibold text-xl mb-3">
                    {initial}
                  </div>

                  <h2 className="font-semibold text-slate-900 text-sm mb-1">
                    {d.full_name}
                    {d.is_verified ? (
                      <span className="ml-2 text-[11px] text-emerald-600 font-semibold">
                        • Verified
                      </span>
                    ) : null}
                  </h2>

                  <p className="text-xs text-slate-500 mb-1">
                    {d.title || "Doctor"}
                  </p>

                  <p className="text-xs text-slate-500 mb-3">
                    {d.years_experience ?? 0} years • {d.country || "—"} • Fee:{" "}
                    {d.consultation_fee ?? "—"}
                  </p>

                  <div className="text-xs text-amber-500 font-semibold mb-3">
                    ⭐ {Number(d.rating || 0).toFixed(1)}{" "}
                    <span className="text-slate-400 font-normal">
                      ({d.rating_count || 0})
                    </span>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {(d.specialties || []).slice(0, 3).map((s) => (
                      <Pill key={s.specialty_id}>{s.name}</Pill>
                    ))}
                    {(d.specialties || []).length > 3 && (
                      <Pill>+{d.specialties.length - 3}</Pill>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {(d.languages || []).slice(0, 3).map((l) => (
                      <Pill key={l.language_id}>{l.name}</Pill>
                    ))}
                    {(d.languages || []).length > 3 && (
                      <Pill>+{d.languages.length - 3}</Pill>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="md:col-span-3 bg-white rounded-2xl border border-slate-100 p-6 text-slate-500 text-sm">
            No doctors found.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-8 gap-3">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className={`px-4 py-2 rounded-lg border ${
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
          className={`px-4 py-2 rounded-lg border ${
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
