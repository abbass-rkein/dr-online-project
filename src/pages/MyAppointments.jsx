// src/pages/MyAppointments.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getToken } from "../lib/auth.js";

const API = "http://localhost:5000";

function fmt(dt) {
  try {
    return new Date(dt).toLocaleString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dt);
  }
}

export default function MyAppointments() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const t = getToken();
      if (!t)
        throw new Error("Please login as a PATIENT to view appointments.");

      const r = await fetch(`${API}/api/appointments/mine`, {
        headers: { Authorization: `Bearer ${t}` },
      });

      const j = await r.json().catch(() => ({}));

      if (r.status === 401)
        throw new Error("Unauthorized — please login again.");
      if (!r.ok || !j.ok)
        throw new Error(j.error || "Failed to load appointments");

      setRows(j.data || []);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function cancel(appointment_id) {
    const t = getToken();
    if (!t) return;

    if (!confirm("Cancel this appointment?")) return;

    try {
      const r = await fetch(
        `${API}/api/appointments/${appointment_id}/cancel`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${t}` },
        }
      );

      const j = await r.json().catch(() => ({}));
      if (r.status === 401)
        throw new Error("Unauthorized — please login again.");
      if (!r.ok || !j.ok) throw new Error(j.error || "Cancel failed");

      await load();
    } catch (e) {
      alert(String(e.message || e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
        <button
          onClick={load}
          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm"
        >
          Refresh
        </button>
      </div>

      {err ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {err}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 text-slate-500">Loading…</div>
      ) : rows.length ? (
        <div className="mt-6 grid gap-4">
          {rows.map((a) => (
            <div
              key={a.appointment_id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-slate-500">
                    {fmt(a.appointment_at)} • {a.mode} •{" "}
                    <span className="font-semibold text-slate-700">
                      {a.status}
                    </span>
                  </div>

                  <div className="mt-1 text-lg font-bold text-slate-900">
                    {a.doctor_name}{" "}
                    <span className="text-sm font-semibold text-slate-500">
                      {a.doctor_title ? `• ${a.doctor_title}` : ""}
                    </span>
                  </div>

                  <div className="text-sm text-slate-600">
                    {a.doctor_country || "—"}
                  </div>

                  {a.patient_notes ? (
                    <div className="mt-3 text-sm text-slate-700">
                      <span className="font-semibold">Notes:</span>{" "}
                      {a.patient_notes}
                    </div>
                  ) : null}

                  <Link
                    to={`/doctors/${a.doctor_id}`}
                    className="inline-block mt-3 text-sm text-sky-700 hover:underline"
                  >
                    View doctor
                  </Link>
                </div>

                {a.status === "CONFIRMED" ? (
                  <button
                    onClick={() => cancel(a.appointment_id)}
                    className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 p-6 text-slate-500 text-sm">
          You have no appointments yet.
        </div>
      )}
    </div>
  );
}
