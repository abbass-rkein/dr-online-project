import { useEffect, useMemo, useState } from "react";
import { getToken } from "../../lib/auth.js";
import { Search, MailOpen, Archive, Inbox } from "lucide-react";

const API = "http://localhost:5000";

function TabBtn({ active, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition
        ${
          active
            ? "bg-sky-600 text-white border-sky-600"
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
        }
      `}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function formatDate(x) {
  try {
    return new Date(x).toLocaleString();
  } catch {
    return String(x);
  }
}

export default function AdminMessages() {
  const token = useMemo(() => getToken(), []);
  const [status, setStatus] = useState("NEW"); // NEW | READ | ARCHIVED
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const [openMsg, setOpenMsg] = useState(null);

  async function load(nextPage = page, nextStatus = status, nextQ = q) {
    setErr("");
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("status", nextStatus);
      if (String(nextQ).trim()) qs.set("q", String(nextQ).trim());
      qs.set("page", String(nextPage));
      qs.set("limit", String(limit));

      const r = await fetch(`${API}/api/admin/messages?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed to load messages");

      setRows(j.data || []);
      setTotalPages(j.totalPages || 1);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(page, status, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load(1, status, q);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function setMsgStatus(message_id, nextStatus) {
    const r = await fetch(`${API}/api/admin/messages/${message_id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: nextStatus }),
    });
    const j = await r.json();
    if (!r.ok || !j.ok) throw new Error(j.error || "Update failed");

    // remove from list (because we are filtering by status)
    setRows((prev) => prev.filter((x) => x.message_id !== message_id));
    setOpenMsg((prev) => (prev?.message_id === message_id ? null : prev));
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-sm text-slate-500 mt-1">
            Inbox from the Contact form (NEW / READ / ARCHIVED).
          </p>
        </div>
      </div>

      {err && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {err}
        </div>
      )}

      {/* Tabs + Search */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <TabBtn
            active={status === "NEW"}
            icon={Inbox}
            label="New"
            onClick={() => {
              setStatus("NEW");
              setPage(1);
            }}
          />
          <TabBtn
            active={status === "READ"}
            icon={MailOpen}
            label="Read"
            onClick={() => {
              setStatus("READ");
              setPage(1);
            }}
          />
          <TabBtn
            active={status === "ARCHIVED"}
            icon={Archive}
            label="Archived"
            onClick={() => {
              setStatus("ARCHIVED");
              setPage(1);
            }}
          />
        </div>

        <div className="relative w-full lg:max-w-[520px]">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, subject, message…"
            className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="mt-5 grid gap-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
            Loading…
          </div>
        ) : rows.length ? (
          rows.map((m) => (
            <button
              key={m.message_id}
              onClick={() => setOpenMsg(m)}
              className="text-left rounded-2xl border border-slate-100 bg-white p-4 hover:bg-slate-50/60 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">
                    {m.subject}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">
                    {m.full_name} • {m.email}
                  </div>
                </div>
                <div className="text-xs text-slate-400 shrink-0">
                  {formatDate(m.created_at)}
                </div>
              </div>
              <div className="text-sm text-slate-600 mt-2 line-clamp-2">
                {m.message}
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
            No messages.
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

      {/* Modal */}
      {openMsg && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => setOpenMsg(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-white border border-slate-100 shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900">
                  {openMsg.subject}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {openMsg.full_name} • {openMsg.email} •{" "}
                  {formatDate(openMsg.created_at)}
                </p>
              </div>

              <button
                onClick={() => setOpenMsg(null)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap">
              {openMsg.message}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
              {status === "NEW" && (
                <>
                  <button
                    onClick={async () => {
                      try {
                        await setMsgStatus(openMsg.message_id, "READ");
                      } catch (e) {
                        alert(String(e.message || e));
                      }
                    }}
                    className="rounded-full bg-sky-600 text-white px-5 py-2 text-sm font-semibold hover:opacity-90"
                  >
                    Mark as Read
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await setMsgStatus(openMsg.message_id, "ARCHIVED");
                      } catch (e) {
                        alert(String(e.message || e));
                      }
                    }}
                    className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold hover:bg-slate-50"
                  >
                    Archive
                  </button>
                </>
              )}

              {status === "READ" && (
                <button
                  onClick={async () => {
                    try {
                      await setMsgStatus(openMsg.message_id, "ARCHIVED");
                    } catch (e) {
                      alert(String(e.message || e));
                    }
                  }}
                  className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Archive
                </button>
              )}

              {status === "ARCHIVED" && (
                <button
                  onClick={async () => {
                    try {
                      await setMsgStatus(openMsg.message_id, "READ");
                    } catch (e) {
                      alert(String(e.message || e));
                    }
                  }}
                  className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Move to Read
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
