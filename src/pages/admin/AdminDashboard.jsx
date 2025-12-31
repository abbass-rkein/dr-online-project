import { useEffect, useState } from "react";
import { getToken } from "../../lib/auth.js";
import { Users, Stethoscope, CalendarCheck, Mail } from "lucide-react";

const API = "http://localhost:5000";

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center">
          <Icon size={18} className="text-sky-600" />
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      setErr("");
      setLoading(true);
      try {
        const token = getToken();
        const r = await fetch(`${API}/api/admin/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await r.json();
        if (!r.ok || !j.ok)
          throw new Error(j.error || "Failed to load summary");
        setData(j.data);
      } catch (e) {
        setErr(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of platform activity.
          </p>
        </div>
        <span className="text-xs text-slate-400">API: {API}</span>
      </div>

      {err && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {err}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Users"
          value={loading ? "…" : data?.users ?? 0}
        />
        <StatCard
          icon={Stethoscope}
          label="Doctors"
          value={loading ? "…" : data?.doctors ?? 0}
        />
        <StatCard
          icon={CalendarCheck}
          label="Appointments"
          value={loading ? "…" : data?.appointments ?? 0}
        />
        <StatCard
          icon={Mail}
          label="New Messages"
          value={loading ? "…" : data?.newMessages ?? 0}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-100 p-4">
        <p className="text-sm font-semibold text-slate-900">Next</p>
        <p className="text-sm text-slate-500 mt-1">
          We’ll add Users table + Messages inbox + Create Doctor + Generate
          Slots.
        </p>
      </div>
    </div>
  );
}
