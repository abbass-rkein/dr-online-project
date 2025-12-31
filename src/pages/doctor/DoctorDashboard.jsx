import { useEffect, useMemo, useRef, useState } from "react";
import { getToken } from "../../lib/auth.js";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const API = "http://localhost:5000";

function fmt(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return String(dt);
  }
}

function toIsoLocal(date) {
  const pad = (n) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addMinutes(date, mins) {
  const x = new Date(date);
  x.setMinutes(x.getMinutes() + mins);
  return x;
}

export default function DoctorDashboard() {
  const token = useMemo(() => getToken(), []);
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const calendarRef = useRef(null);

  // data
  const [slots, setSlots] = useState([]);
  const [appts, setAppts] = useState([]);

  // UI
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState(""); // mini toast

  // right panel date
  const [activeDate, setActiveDate] = useState(() => new Date());

  // filters
  const [statusFilter, setStatusFilter] = useState("");

  // create slot flow
  const [creating, setCreating] = useState(false);
  const [draftStart, setDraftStart] = useState("");
  const [draftEnd, setDraftEnd] = useState("");

  // click-to-create helper
  const [clickedAt, setClickedAt] = useState(null); // JS Date
  const [slotMinutes, setSlotMinutes] = useState(30);

  // slot action sheet
  const [slotSheet, setSlotSheet] = useState(null); // { slot } | null

  // debounce map for notes saves
  const notesTimers = useRef(new Map());

  function toast(msg) {
    setNotice(msg);
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(() => setNotice(""), 1800);
  }

  async function loadAll() {
    setErr("");
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (statusFilter) qs.set("status", statusFilter);

      const [rs, ra] = await Promise.all([
        fetch(`${API}/api/doctor/slots`, { headers }),
        fetch(`${API}/api/doctor/appointments?${qs.toString()}`, { headers }),
      ]);

      const js = await rs.json().catch(() => ({}));
      const ja = await ra.json().catch(() => ({}));

      if (!rs.ok || !js.ok) throw new Error(js.error || "Failed to load slots");
      if (!ra.ok || !ja.ok)
        throw new Error(ja.error || "Failed to load appointments");

      setSlots(js.data || []);
      setAppts(ja.data || []);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function createSlot(start_at, end_at) {
    setErr("");
    setCreating(true);
    try {
      const r = await fetch(`${API}/api/doctor/slots`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ start_at, end_at }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed to create slot");
      toast("Slot created ✅");
      await loadAll();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setCreating(false);
    }
  }

  async function deleteSlot(slot_id) {
    setErr("");
    try {
      const r = await fetch(`${API}/api/doctor/slots/${slot_id}`, {
        method: "DELETE",
        headers,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "Delete failed");
      toast("Slot deleted 🗑️");
      await loadAll();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  async function updateAppt(appointment_id, payload, optimisticPatch) {
    // optimistic update to reduce “frustrating” feel
    if (optimisticPatch) {
      setAppts((prev) =>
        prev.map((a) =>
          a.appointment_id === appointment_id ? { ...a, ...optimisticPatch } : a
        )
      );
    }

    try {
      const r = await fetch(
        `${API}/api/doctor/appointments/${appointment_id}`,
        {
          method: "PUT",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "Update failed");
      toast("Saved ✅");
      await loadAll();
    } catch (e) {
      toast("Save failed ❌");
      setErr(String(e.message || e));
      await loadAll(); // rollback to server truth
    }
  }

  // calendar events
  const slotEvents = useMemo(() => {
    return (slots || []).map((s) => ({
      id: `slot:${s.slot_id}`,
      title: s.is_booked ? "🔒 Slot (Booked)" : "🟦 Slot (Free)",
      start: s.start_at,
      end: s.end_at,
      allDay: false,
      extendedProps: { kind: "slot", ...s },
      classNames: [
        "rounded-lg",
        s.is_booked ? "fc-slot-booked" : "fc-slot-free",
      ],
    }));
  }, [slots]);

  const apptEvents = useMemo(() => {
    return (appts || []).map((a) => ({
      id: `appt:${a.appointment_id}`,
      title: `🟩 ${a.patient_name} • ${a.status}`,
      start: a.appointment_at,
      end: a.appointment_end_at || null,
      allDay: false,
      extendedProps: { kind: "appt", ...a },
      classNames: ["rounded-lg", "fc-appt"],
    }));
  }, [appts]);

  const events = useMemo(
    () => [...slotEvents, ...apptEvents],
    [slotEvents, apptEvents]
  );

  // right panel lists
  const daySlots = useMemo(() => {
    const from = startOfDay(activeDate).getTime();
    const to = endOfDay(activeDate).getTime();
    return (slots || [])
      .filter((s) => {
        const t = new Date(s.start_at).getTime();
        return t >= from && t <= to;
      })
      .sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  }, [slots, activeDate]);

  const dayAppts = useMemo(() => {
    const from = startOfDay(activeDate).getTime();
    const to = endOfDay(activeDate).getTime();
    return (appts || [])
      .filter((a) => {
        const t = new Date(a.appointment_at).getTime();
        return t >= from && t <= to;
      })
      .sort((a, b) => new Date(a.appointment_at) - new Date(b.appointment_at));
  }, [appts, activeDate]);

  useEffect(() => {
    if (!token) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  if (!token) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700">
          Please login as a DOCTOR.
        </div>
      </div>
    );
  }

  const activeDateLabel = activeDate.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const quickCreate = async (baseDate, minutes) => {
    const s = toIsoLocal(baseDate);
    const e = toIsoLocal(addMinutes(baseDate, minutes));
    setDraftStart(s);
    setDraftEnd(e);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Doctor Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Drag to create slots • Click a time to quick-add • Click a slot for
            actions.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => loadAll()}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {(err || notice) && (
        <div className="mt-5 grid gap-2">
          {notice ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {notice}
            </div>
          ) : null}
          {err ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {err}
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-6 grid lg:grid-cols-[1.6fr_1fr] gap-6">
        {/* CALENDAR */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-3">
            <div className="font-semibold text-slate-900">Schedule</div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">All appointment statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="NO_SHOW">NO_SHOW</option>
              </select>

              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                  Free slot
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                  Booked slot
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Appointment
                </span>
              </div>
            </div>
          </div>

          {/* Quick-add bar (shows after clicking a time) */}
          {clickedAt ? (
            <div className="mx-2 mb-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <span className="font-semibold text-slate-900">Quick add:</span>{" "}
                <span className="text-slate-600">
                  {clickedAt.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={slotMinutes}
                  onChange={(e) => setSlotMinutes(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
                <button
                  onClick={() => quickCreate(clickedAt, slotMinutes)}
                  className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold"
                >
                  Create slot
                </button>
                <button
                  onClick={() => setClickedAt(null)}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-white text-sm font-semibold text-slate-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : null}

          <div className="fc-wrap">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              height="auto"
              nowIndicator
              selectable
              selectMirror
              events={events}
              eventTimeFormat={{
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }}
              select={(info) => {
                // drag to create a slot
                setDraftStart(toIsoLocal(info.start));
                setDraftEnd(toIsoLocal(info.end));
                setClickedAt(null);
              }}
              dateClick={(info) => {
                // single click on a time => quick add
                setActiveDate(info.date);
                setClickedAt(info.date);
              }}
              eventClick={(info) => {
                const kind = info.event.extendedProps?.kind;

                // keep right panel synced to click
                const d = info.event.start || new Date();
                if (!sameDay(d, activeDate)) setActiveDate(d);

                if (kind === "slot") {
                  const s = info.event.extendedProps;
                  setSlotSheet({ slot: s });
                }
              }}
            />
          </div>

          {/* Draft confirm (from drag OR quick-add) */}
          {draftStart && draftEnd ? (
            <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Confirm slot
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {draftStart} → {draftEnd}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setDraftStart("");
                      setDraftEnd("");
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-white text-sm font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={creating}
                    onClick={() =>
                      createSlot(draftStart, draftEnd).then(() => {
                        setDraftStart("");
                        setDraftEnd("");
                      })
                    }
                    className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold disabled:opacity-60"
                  >
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>
              </div>

              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-700">
                    Start
                  </div>
                  <input
                    value={draftStart}
                    onChange={(e) => setDraftStart(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm"
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-700">
                    End
                  </div>
                  <input
                    value={draftEnd}
                    onChange={(e) => setDraftEnd(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="mt-2 text-[11px] text-slate-500">
                Tip: drag across time to draft a slot, or click a time to quick
                add.
              </div>
            </div>
          ) : null}
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {activeDateLabel}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Day overview: slots + appointments
              </div>
            </div>
            {loading ? (
              <div className="text-xs text-slate-500">Loading…</div>
            ) : null}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-900">Slots</div>
              <div className="text-xs text-slate-500">{daySlots.length}</div>
            </div>

            {daySlots.length ? (
              <div className="mt-3 grid gap-2">
                {daySlots.map((s) => (
                  <div
                    key={s.slot_id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {fmt(s.start_at)} → {fmt(s.end_at)}
                      </div>
                      <div className="text-xs text-slate-500">
                        Slot #{s.slot_id} •{" "}
                        {s.is_booked ? "BOOKED" : "AVAILABLE"}
                      </div>
                    </div>
                    <button
                      onClick={() => setSlotSheet({ slot: s })}
                      className="px-3 py-2 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700"
                    >
                      Actions
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-500">
                No slots this day.
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-900">Appointments</div>
              <div className="text-xs text-slate-500">{dayAppts.length}</div>
            </div>

            {dayAppts.length ? (
              <div className="mt-3 grid gap-3">
                {dayAppts.map((a) => (
                  <div
                    key={a.appointment_id}
                    className="rounded-xl border border-slate-100 p-4"
                  >
                    <div className="text-xs text-slate-500">
                      {fmt(a.appointment_at)} • {a.mode} •{" "}
                      <span className="font-semibold text-slate-700">
                        {a.status}
                      </span>
                    </div>

                    <div className="mt-1 text-base font-bold text-slate-900">
                      {a.patient_name}
                    </div>

                    <div className="text-sm text-slate-600">
                      {a.patient_email}{" "}
                      {a.patient_phone ? `• ${a.patient_phone}` : ""}
                    </div>

                    {a.patient_notes ? (
                      <div className="mt-3 text-sm text-slate-700">
                        <span className="font-semibold">Patient notes:</span>{" "}
                        {a.patient_notes}
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700">
                          Update status
                        </label>
                        <select
                          value={a.status}
                          onChange={(e) =>
                            updateAppt(
                              a.appointment_id,
                              { status: e.target.value },
                              { status: e.target.value }
                            )
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                          <option value="NO_SHOW">NO_SHOW</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700">
                          Doctor notes
                        </label>
                        <textarea
                          value={a.doctor_notes || ""}
                          rows={3}
                          className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                          placeholder="Private notes..."
                          onChange={(e) => {
                            const v = e.target.value;
                            setAppts((prev) =>
                              prev.map((x) =>
                                x.appointment_id === a.appointment_id
                                  ? { ...x, doctor_notes: v }
                                  : x
                              )
                            );

                            // debounce save (800ms)
                            const key = a.appointment_id;
                            const map = notesTimers.current;
                            if (map.get(key)) window.clearTimeout(map.get(key));
                            const t = window.setTimeout(() => {
                              updateAppt(
                                a.appointment_id,
                                { doctor_notes: v },
                                { doctor_notes: v }
                              );
                              map.delete(key);
                            }, 800);
                            map.set(key, t);
                          }}
                        />
                        <div className="text-[11px] text-slate-500 mt-1">
                          Autosaves after you stop typing.
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-500">
                No appointments this day.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SLOT ACTION SHEET */}
      {slotSheet?.slot ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSlotSheet(null)}
          />
          <div className="relative w-full sm:max-w-md m-3 rounded-2xl bg-white border border-slate-100 shadow-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-900">
                  Slot actions
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {fmt(slotSheet.slot.start_at)} → {fmt(slotSheet.slot.end_at)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Slot #{slotSheet.slot.slot_id} •{" "}
                  {slotSheet.slot.is_booked ? "BOOKED" : "AVAILABLE"}
                </div>
              </div>
              <button
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-700"
                onClick={() => setSlotSheet(null)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              <button
                disabled={!!slotSheet.slot.is_booked}
                onClick={async () => {
                  const s = slotSheet.slot;
                  setSlotSheet(null);
                  await deleteSlot(s.slot_id);
                }}
                className={`px-3 py-2 rounded-xl text-sm font-semibold border ${
                  slotSheet.slot.is_booked
                    ? "border-slate-200 text-slate-400"
                    : "border-rose-200 text-rose-700 hover:bg-rose-50"
                }`}
              >
                Delete slot
              </button>

              {!slotSheet.slot.is_booked ? (
                <button
                  onClick={() => {
                    // duplicate to the next hour start (simple)
                    const s = new Date(slotSheet.slot.start_at);
                    const e = new Date(slotSheet.slot.end_at);
                    const mins = Math.round((e - s) / 60000);
                    const ns = addMinutes(s, 60);
                    setDraftStart(toIsoLocal(ns));
                    setDraftEnd(toIsoLocal(addMinutes(ns, mins)));
                    setSlotSheet(null);
                  }}
                  className="px-3 py-2 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  Duplicate +1 hour
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* FullCalendar styling */}
      <style>{`
        .fc .fc-toolbar-title { font-size: 1rem; font-weight: 700; color: rgb(15 23 42); }
        .fc .fc-button { border-radius: 12px; border: 1px solid rgb(226 232 240); background: white; color: rgb(51 65 85); }
        .fc .fc-button:hover { background: rgb(248 250 252); }
        .fc .fc-button-primary:not(:disabled).fc-button-active,
        .fc .fc-button-primary:not(:disabled):active {
          background: rgb(224 242 254);
          border-color: rgb(56 189 248);
          color: rgb(3 105 161);
        }
        .fc .fc-daygrid-day-number, .fc .fc-col-header-cell-cushion { color: rgb(51 65 85); }
        .fc .fc-scrollgrid { border: 1px solid rgb(241 245 249); border-radius: 16px; overflow: hidden; }
        .fc-slot-free .fc-event-main { background: rgb(2 132 199); border: none; }
        .fc-slot-booked .fc-event-main { background: rgb(148 163 184); border: none; }
        .fc-appt .fc-event-main { background: rgb(16 185 129); border: none; }
        .fc .fc-event { border-radius: 10px; }
        /* make events easier to click */
        .fc .fc-event { padding: 2px 4px; }
      `}</style>
    </div>
  );
}
